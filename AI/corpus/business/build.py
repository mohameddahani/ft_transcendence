"""Build Collection B: fetch, clean and summarise every approved row of manifest.csv.

    .venv/bin/python corpus/business/build.py            # everything not built yet
    .venv/bin/python corpus/business/build.py --only ID  # one document (--force rebuilds it)

Runs on the host (it needs the internet and the Gemini key from AI/.env). Writes
docs/<id>.md with the manifest row as front matter. Resumable: a document whose file
already exists is skipped, so an interrupted run just continues.

Three kinds of source, one function each:
  research   Europe PMC full-text XML -> title, abstract and findings (no methods,
             references, funding or author notes)
  wikipedia  the MediaWiki API's plain text -> sections, minus references and links
  summary    the article is fetched but never stored: Gemini summarises it, and the
             summary is rejected if it states a number the article does not, or copies
             a run of 15 words (a sentence) from it
"""

from __future__ import annotations

import argparse
import csv
import datetime
import json
import random
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).parent
DOCS = HERE / "docs"
# "compatible;" is how an honest crawler says what it is; some sites refuse anything else.
USER_AGENT = "Mozilla/5.0 (compatible; gym-saas-corpus/1.0; student project)"

DROP_SECTIONS = re.compile(
    r"method|material|author|funding|consent|review board|ethic|data availab|conflict|"
    r"acknowledg|footnote|reference|supplement|abbreviation|appendix|see also|further reading|"
    r"external link|notes|bibliography|sources|citations", re.IGNORECASE)


# ------------------------------------------------------------------ HTTP, politely
def get(url: str, attempts: int = 4) -> str:
    """GET with retries on the errors worth retrying (429, 5xx, timeouts), with
    exponential backoff and jitter. A 403 or 404 will not change: fail at once."""
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            if exc.code != 429 and exc.code < 500:
                raise
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(2 ** attempt + random.random())
    raise RuntimeError(f"gave up on {url} after {attempts} attempts")


# ------------------------------------------------------------------ research
def _text(node: ET.Element) -> str:
    """Paragraph text without citation markers like [12]."""
    for xref in node.iter("xref"):
        if xref.get("ref-type") == "bibr":
            xref.text, xref.tail = "", xref.tail
            for child in list(xref):
                xref.remove(child)
    text = re.sub(r"\s+", " ", "".join(node.itertext()))
    # What is left of "[12,13]" once the linked numbers are gone: "[]", "[,]", "[–]".
    return re.sub(r"\s*\[[\s,;–-]*\]", "", text).strip()


def research(row: dict) -> str:
    pmcid = row["url"].rsplit("/", 1)[-1]
    root = ET.fromstring(get(f"https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML"))
    for drop in root.iter():
        for child in list(drop):
            if child.tag in ("fig", "table-wrap", "ref-list", "fn-group"):
                drop.remove(child)
    parts = [f"# {row['title']}"]
    abstract = root.find(".//abstract")
    if abstract is not None:
        parts.append("## Abstract\n\n" + "\n\n".join(_text(p) for p in abstract.iter("p")))
    body = root.find(".//body")
    for section in (body.findall("sec") if body is not None else []):
        title = section.find("title")
        name = _text(title) if title is not None else ""
        if DROP_SECTIONS.search(name):
            continue
        paragraphs = [_text(p) for p in section.iter("p")]
        parts.append(f"## {re.sub(r'^[0-9.]+ *', '', name)}\n\n" + "\n\n".join(p for p in paragraphs if p))
    return "\n\n".join(parts)


# ------------------------------------------------------------------ wikipedia
def wikipedia(row: dict) -> str:
    title = urllib.parse.unquote(row["url"].rsplit("/", 1)[-1]).replace("_", " ")
    query = urllib.parse.urlencode({"action": "query", "prop": "extracts", "explaintext": 1,
                                    "redirects": 1, "titles": title, "format": "json"})
    pages = json.loads(get(f"https://en.wikipedia.org/w/api.php?{query}"))["query"]["pages"]
    text = next(iter(pages.values()))["extract"]
    parts, keep = [f"# {row['title']}"], True
    for block in re.split(r"\n(?==+ )", text):
        heading = re.match(r"(=+) (.+?) =+\n?", block)
        if heading:
            keep = not DROP_SECTIONS.search(heading.group(2))
            block = "#" * len(heading.group(1)) + " " + heading.group(2) + "\n\n" + block[heading.end():]
        if keep and block.strip():
            parts.append(block.strip())
    return "\n\n".join(parts)


# ------------------------------------------------------------------ industry summaries
class _ArticleText(HTMLParser):
    """The readable text of a page: headings, paragraphs and list items, skipping
    navigation, scripts and footers."""

    SKIP = {"script", "style", "nav", "footer", "header", "aside", "form", "noscript", "svg"}
    KEEP = {"h1", "h2", "h3", "p", "li"}

    def __init__(self) -> None:
        super().__init__()
        self.skipping, self.current, self.blocks = 0, None, []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skipping += 1
        elif tag in self.KEEP and not self.skipping:
            self.current = []

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skipping:
            self.skipping -= 1
        elif tag in self.KEEP and self.current is not None:
            text = re.sub(r"\s+", " ", "".join(self.current)).strip()
            if len(text) > 30:
                self.blocks.append(text)
            self.current = None

    def handle_data(self, data):
        if self.current is not None and not self.skipping:
            self.current.append(data)


def article_text(url: str) -> str:
    parser = _ArticleText()
    parser.feed(get(url))
    return "\n\n".join(dict.fromkeys(parser.blocks))     # de-duplicated, in order


SUMMARY_PROMPT = """Summarise this article for the owner of a gym, in your own words.
- English, 250 to 450 words, in Markdown, with exactly these two sections:
  "## Key points" (bullets) and "## What a gym can do" (bullets).
- Only state what the article says. Include a number, percentage or price only if it
  appears in the article; otherwise describe it in words.
- Do not copy sentences: paraphrase.
- Ignore navigation, adverts and product promotion for the publisher's own software.

Article title: {title}

Article text:
{text}"""

NUMBER = re.compile(r"\d+(?:[.,]\d+)*")
_env = dict(line.split("=", 1) for line in (HERE.parent.parent / ".env").read_text().splitlines()
            if "=" in line and not line.startswith("#"))


def unsupported_numbers(summary: str, source: str) -> list[str]:
    """Numbers the summary states that the article never does -- a made-up statistic
    is exactly what Collection B exists to prevent."""
    plain = lambda s: s.replace(",", "")  # noqa: E731  "1,200" and "1200" are the same number
    in_source = {plain(n) for n in NUMBER.findall(source)}
    return sorted({n for n in NUMBER.findall(summary) if plain(n) not in in_source})


def copied_runs(summary: str, source: str, length: int = 15) -> list[str]:
    """Runs of `length` consecutive words the summary shares with the article -- a copied
    sentence. Not 12: that caught lists of metric names ("payroll as a share of revenue
    and revenue per full-time-equivalent employee"), which are terms, not prose."""
    words = lambda s: re.findall(r"[a-z0-9']+", s.lower())  # noqa: E731
    src = words(source)
    grams = {" ".join(src[i:i + length]) for i in range(len(src) - length + 1)}
    out = words(summary)
    return [" ".join(out[i:i + length]) for i in range(len(out) - length + 1)
            if " ".join(out[i:i + length]) in grams]


def summary(row: dict) -> str:
    from langchain_google_genai import ChatGoogleGenerativeAI
    source = article_text(row["url"])
    if len(source) < 800:                     # a short news item is fine; a JavaScript shell is not
        raise RuntimeError(f"only {len(source)} characters of text on the page")
    model = ChatGoogleGenerativeAI(model=_env["GEMINI_CHAT_MODEL"], google_api_key=_env["GEMINI_API_KEY"],
                                   temperature=0, thinking_budget=0)
    prompt = SUMMARY_PROMPT.format(title=row["title"], text=source[:40000])
    for attempt in range(2):
        text = model.invoke(prompt).text.strip()
        bad_numbers, copied = unsupported_numbers(text, source), copied_runs(text, source)
        if not bad_numbers and not copied:
            return (f"# {row['title']}\n\n*A summary in our own words of [the original article]"
                    f"({row['url']}). Numbers in it appear in the original.*\n\n{text}")
        prompt += ("\n\nYour previous summary was rejected. "
                   + (f"These numbers are not in the article: {', '.join(bad_numbers)}. " if bad_numbers else "")
                   + (f"It copied these phrases word for word: {'; '.join(copied[:3])}. " if copied else "")
                   + "Write it again without them.")
    raise RuntimeError(f"rejected twice: numbers {bad_numbers}, copied runs {len(copied)}")


# ------------------------------------------------------------------ main
BUILDERS = {"research": research, "wikipedia": wikipedia, "summary": summary}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="build one document by id")
    parser.add_argument("--force", action="store_true", help="rebuild even if the file exists")
    args = parser.parse_args()

    DOCS.mkdir(exist_ok=True)
    rows = [r for r in csv.DictReader(open(HERE / "manifest.csv")) if r["status"] == "approved"]
    if args.only:
        rows = [r for r in rows if r["id"] == args.only]
    built = skipped = 0
    failed = []
    for row in rows:
        path = DOCS / f"{row['id']}.md"
        if path.exists() and not args.force:
            skipped += 1
            continue
        try:
            body = BUILDERS[row["kind"]](row)
        except Exception as exc:  # noqa: BLE001 -- one bad source must not stop the other 150
            failed.append((row["id"], f"{type(exc).__name__}: {exc}"[:120]))
            print(f"  ✗ {row['id']}: {failed[-1][1]}", flush=True)
            continue
        header = "---\n" + "".join(f"{k}: {row[k]}\n" for k in ("id", "title", "topic", "kind", "url", "licence"))
        path.write_text(header + f"retrieved: {datetime.date.today()}\n---\n\n{body}\n")
        built += 1
        print(f"  ✓ {row['id']} ({len(body):,} chars)", flush=True)
        time.sleep(1)                                   # one request a second: be a polite client
    print(f"\nbuilt {built}, skipped {skipped} (already built), failed {len(failed)}")
    for doc_id, reason in failed:
        print(f"  {doc_id}: {reason}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
