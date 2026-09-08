"""Tasks 1.6 + 1.7 acceptance checks: feedback comments and policy documents.

Runs on the HOST (imports `seeder/`, reads as `admin`):

    .venv/bin/python -m scripts.check_corpus

Feedback is checked for the properties task 5.1 will be graded against: three
sentiments in every gym, a real unscored backlog, mixed comments that carry praise
and a complaint in the same sentence, and enough variety that a classifier has to
read the text rather than memorise it.

Documents are checked for two things that would each produce a confidently wrong
answer in front of an evaluator: prices that disagree with the database, and
staff-only facts sitting in a member-visible file.
"""

from __future__ import annotations

import asyncio
import re
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import asyncpg  # noqa: E402

from app.db.models import Feedback, Sentiment  # noqa: E402
from seeder.catalogue import CATALOGUE, FIXTURE_MEMBER_USERNAMES  # noqa: E402
from seeder.documents import (  # noqa: E402
    DOCS_ROOT,
    POLICIES,
    VISIBILITIES,
    build_all,
    load_all,
    write_all,
)
from seeder.feedback import LANGUAGE_WEIGHTS, POLARITY_WEIGHTS, UNSCORED_RATE  # noqa: E402
from seeder.seed import resolve_dsn  # noqa: E402

FAIL = 0
MONEY = re.compile(r"([\d,]+\.\d{2}) MAD")


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


async def check_feedback(conn: asyncpg.Connection) -> None:
    per_gym = await conn.fetch(
        """SELECT u.company_name,
                  count(*) FILTER (WHERE f.sentiment = 'POSITIVE') pos,
                  count(*) FILTER (WHERE f.sentiment = 'NEGATIVE') neg,
                  count(*) FILTER (WHERE f.sentiment = 'NEUTRAL')  mix,
                  count(*) FILTER (WHERE f.sentiment IS NULL)      todo,
                  count(*) total
           FROM users u JOIN feedbacks f ON f.admin_id = u.id
           WHERE u.role = 'ADMIN' GROUP BY 1 ORDER BY 1""")
    check("every gym has feedback", len(per_gym) == len(CATALOGUE),
          ", ".join(str(r["total"]) for r in per_gym))
    check("every gym has all three sentiments",
          all(r["pos"] and r["neg"] and r["mix"] for r in per_gym),
          " / ".join(f"{r['pos']}+{r['mix']}~{r['neg']}-" for r in per_gym))
    # A count per gym plus a share overall. A per-gym percentage looks tighter but
    # is not: each gym draws independently, so one of four lands two sigma low often
    # enough to fail on a seed change, and a suite that fails for no reason is a
    # suite people stop reading.
    negatives = sum(r["neg"] for r in per_gym)
    everything = sum(r["total"] for r in per_gym)
    check("negative feedback is a real share, not a token one",
          all(r["neg"] >= 5 for r in per_gym) and negatives >= everything * 0.12,
          f"{negatives} of {everything} overall, min {min(r['neg'] for r in per_gym)} per gym")

    total, unscored = await conn.fetchrow(
        "SELECT count(*), count(*) FILTER (WHERE sentiment IS NULL) FROM feedbacks")
    # Left unscored on purpose: a real backlog exists at any moment, and task 5.1
    # needs rows to actually work on rather than a table that is already finished.
    check("an unscored backlog exists for the sentiment module",
          0 < unscored < total * (UNSCORED_RATE * 2),
          f"{unscored} of {total} awaiting a score")

    # --- integrity ------------------------------------------------------------
    check("no comment predates or outlives its membership",
          await conn.fetchval(
              """SELECT count(*) FROM feedbacks f WHERE NOT EXISTS (
                   SELECT 1 FROM memberships m WHERE m.member_id = f.member_id
                   AND f.created_at BETWEEN m.start_date AND m.expires_at)""") == 0)
    check("no comment is in the future",
          await conn.fetchval("SELECT count(*) FROM feedbacks WHERE created_at > now()") == 0)
    check("a comment's gym matches the member's gym",
          await conn.fetchval(
              """SELECT count(*) FROM feedbacks f JOIN members m ON m.id = f.member_id
                 WHERE m.admin_id <> f.admin_id""") == 0)
    check("ratings and scores are inside their ranges",
          await conn.fetchval(
              """SELECT count(*) FROM feedbacks
                 WHERE (rating IS NOT NULL AND rating NOT BETWEEN 1 AND 5)
                    OR (sentiment_score IS NOT NULL
                        AND sentiment_score NOT BETWEEN 0 AND 1)""") == 0)
    check("the fixture members left no feedback",
          await conn.fetchval(
              """SELECT count(*) FROM feedbacks f JOIN members m ON m.id = f.member_id
                 WHERE m.user_name = ANY($1::text[])""",
              sorted(FIXTURE_MEMBER_USERNAMES)) == 0)

    # --- the properties task 5.1 is graded on ---------------------------------
    avg = dict(await conn.fetch(
        """SELECT sentiment::text, avg(rating) FROM feedbacks
           WHERE sentiment IS NOT NULL GROUP BY 1"""))
    check("rating tracks sentiment", avg["POSITIVE"] > avg["NEUTRAL"] > avg["NEGATIVE"],
          " ".join(f"{k[:3]}={v:.1f}" for k, v in sorted(avg.items())))
    # ...but not perfectly. A corpus where the rating predicts the label exactly
    # would let a classifier cheat by reading the number instead of the text.
    overlap = await conn.fetchval(
        """SELECT count(*) FROM feedbacks
           WHERE (sentiment = 'POSITIVE' AND rating <= 4)
              OR (sentiment = 'NEGATIVE' AND rating >= 3)""")
    check("...but not perfectly, so the number cannot stand in for the text",
          overlap > 0, f"{overlap} comments where rating and label disagree")

    distinct, repeated = await conn.fetchrow(
        """SELECT count(DISTINCT content), max(n) FROM feedbacks,
           LATERAL (SELECT count(*) n FROM feedbacks f2 WHERE f2.content = feedbacks.content) s""")
    check("content is varied, not a handful of repeated lines",
          distinct > total * 0.7 and repeated <= 8,
          f"{distinct} distinct of {total}, most repeated {repeated}x")

    # The hard case: praise and a complaint in one comment. A keyword classifier
    # reads the first clause and calls it positive.
    mixed_markers = await conn.fetchval(
        """SELECT count(*) FROM feedbacks WHERE sentiment = 'NEUTRAL'
           AND (content ILIKE '%but %' OR content ILIKE '%that said%'
                OR content ILIKE '%par contre%' OR content ILIKE '%only complaint%'
                OR content ILIKE '%negatif%' OR content ILIKE '%walakin%')""")
    check("mixed comments really do carry both halves", mixed_markers > 20,
          f"{mixed_markers} with an explicit turn")

    french = await conn.fetchval(
        "SELECT count(*) FROM feedbacks WHERE content ~ '(?i)(vestiaire|coach|salle|materiel|prix)'"
        " AND content !~ '(?i)(the |and |is )'")
    check("the inbox is not monolingual", french > 10,
          f"~{french} non-English of {total}; weights {LANGUAGE_WEIGHTS}")

    row = await conn.fetchrow(
        """SELECT id, admin_id, member_id, content, rating, sentiment, sentiment_score,
                  created_at FROM feedbacks WHERE sentiment IS NOT NULL LIMIT 1""")
    model = Feedback(**dict(row))
    check("Feedback parses from a real row",
          model.is_scored and isinstance(model.sentiment, Sentiment)
          and isinstance(model.sentiment_score, Decimal),
          f"{model.sentiment.value} {model.sentiment_score}")
    unscored_row = await conn.fetchrow(
        """SELECT id, admin_id, member_id, content, rating, sentiment, sentiment_score,
                  created_at FROM feedbacks WHERE sentiment IS NULL LIMIT 1""")
    check("...and from an unscored one", not Feedback(**dict(unscored_row)).is_scored)
    check("all three polarities are wired up", len(POLARITY_WEIGHTS) == 3)


def check_documents() -> None:
    docs = load_all()
    check("sixteen documents on disk, four per gym",
          len(docs) == len(CATALOGUE) * 4
          and all(sum(1 for d in docs if d.gym_key == g.key) == 4 for g in CATALOGUE),
          f"{len(docs)} files")
    check("every gym has both a member-visible and a staff-only set",
          all({d.visibility for d in docs if d.gym_key == g.key} == set(VISIBILITIES)
              for g in CATALOGUE))
    check("every visibility tag is one of the two allowed",
          {d.visibility for d in docs} == set(VISIBILITIES))

    # Chunking is ~1000 chars with 150 overlap. A document shorter than that is one
    # chunk, and one chunk retrieves as an all-or-nothing block.
    shortest = min(len(d.text) for d in docs)
    check("every document is long enough to chunk", shortest > 1500,
          f"shortest {shortest:,} chars, longest {max(len(d.text) for d in docs):,}")

    # The consistency guarantee. A document quoting 2,600 MAD while the database
    # charges 2,800 makes the assistant contradict itself depending on whether the
    # question routes to SQL or to retrieval -- and it reads as a model failure.
    for gym in CATALOGUE:
        terms = next(d for d in docs
                     if d.gym_key == gym.key and d.filename == "membership-terms.md")
        quoted = {Decimal(m.replace(",", "")) for m in MONEY.findall(terms.text)}
        catalogue = {price for plan in gym.plans for _, price in plan.durations}
        check(f"{gym.key}: document prices match the catalogue", quoted == catalogue,
              f"{len(quoted)} prices, {sorted(quoted)[0]}-{sorted(quoted)[-1]} MAD")

    # The visibility filter is what stops a member agent finding these. If the fact
    # is also in a member document, the filter has nothing left to protect.
    #
    # Compared within one gym, and with a boundary on the money pattern. Matching a
    # bare substring across every gym's text reported Atlas's 50.00 MAD late fee as
    # leaked, because Oasis charges 450.00 MAD for a monthly plan and "450.00 MAD"
    # contains "50.00 MAD". The test was wrong, not the corpus.
    for gym in CATALOGUE:
        policy = POLICIES[gym.key]
        mine = [d for d in docs if d.gym_key == gym.key]
        member_text = "\n".join(d.text for d in mine if d.visibility == "member").lower()
        staff_text = "\n".join(d.text for d in mine if d.visibility == "staff").lower()
        fee = re.compile(rf"(?<![\d,]){re.escape(f'{policy.late_fee_mad:,.2f}')} mad")
        plain = (f"{policy.max_discount_pct}%", policy.key_safe_location.lower())

        check(f"{gym.key}: staff-only facts are in the staff files",
              all(s in staff_text for s in plain) and bool(fee.search(staff_text)))
        leaked = [s for s in plain if s in member_text]
        if fee.search(member_text):
            leaked.append("late fee")
        check(f"{gym.key}: ...and in none of the member files", not leaked,
              f"leaked: {leaked}" if leaked else "discount, key safe, late fee")

    # Same reason the prices differ: a retrieval leak across tenants then shows up
    # as a wrong FACT in an answer, not merely as an extra chunk.
    check("no two gyms share an opening-hours policy",
          len({(p.weekday_hours, p.weekend_hours) for p in POLICIES.values()}) == len(POLICIES))
    check("no two gyms share a freeze policy",
          len({(p.freeze_days, p.freezes_per_year) for p in POLICIES.values()}) == len(POLICIES))
    check("no two gyms share a discount ceiling",
          len({p.max_discount_pct for p in POLICIES.values()}) == len(POLICIES))

    for gym in CATALOGUE:
        others = [g.company_name.lower() for g in CATALOGUE if g.key != gym.key]
        mine = "\n".join(d.text for d in docs if d.gym_key == gym.key).lower()
        check(f"{gym.key}: never names another gym", not any(o in mine for o in others))

    # Round trip: what write_all produced is what load_all reads back.
    check("front matter round-trips",
          {(d.gym_key, d.visibility, d.filename) for d in docs}
          == {(d.gym_key, d.visibility, d.filename) for d in build_all()})
    before = {p: p.read_bytes() for p in sorted(DOCS_ROOT.glob("*/*.md"))}
    write_all()
    after = {p: p.read_bytes() for p in sorted(DOCS_ROOT.glob("*/*.md"))}
    check("regenerating produces byte-identical files", before == after)


async def main() -> int:
    conn = await asyncpg.connect(resolve_dsn(None))
    try:
        print("  -- feedback (1.6) --")
        await check_feedback(conn)
    finally:
        await conn.close()
    print("  -- documents (1.7) --")
    check_documents()
    return FAIL


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
