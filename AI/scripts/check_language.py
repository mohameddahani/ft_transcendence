"""Task 2.6 acceptance checks: language detection.

Runs on the HOST, not in the container:

    .venv/bin/python -m scripts.check_language

It imports `seeder/feedback.py`, which is deliberately kept out of the image -- and
that import is the point. The generator labels every comment with the language it
wrote it in, so there is a **labelled corpus of real sentences** sitting in the
repository for free, and the detector can be measured against it rather than against
six examples somebody thought of.
"""

from __future__ import annotations

import random
import sys
from collections import Counter
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.agents.language import Language, detect, instruction  # noqa: E402
from seeder.feedback import build_feedback  # noqa: E402

FAIL = 0

# The generator's labels, in this module's vocabulary.
#
# **`"ar"` in the seeder is Darija in Latin script, not Arabic script** -- "Bezzaf
# dyal nas f l3chiya, katsenna 3la kola makina." The bucket is named for the language
# the words come from; the rows are what a Moroccan member actually types. This test
# asserted `ARABIC` first and failed on all fourteen of them, which is how the
# mismatch was found. Arabic script has its own case in the unit list above.
_EXPECTED = {"en": Language.ENGLISH, "fr": Language.FRENCH, "ar": Language.DARIJA}


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<54} {detail}")
    if not cond:
        FAIL = 1


def corpus():
    """Comments generated the way the seeder generates them, with their labels."""
    rng = random.Random(2406)
    now = datetime.now(UTC).replace(tzinfo=None)
    windows = [(now - timedelta(days=300), now - timedelta(days=1))]
    rows = []
    for index in range(600):
        rows.extend(build_feedback(f"m{index}", windows, visits=40, rng=rng, now=now))
    return rows


def main() -> int:
    print("\n\033[1m  the four cases that matter\033[0m")

    cases = [
        ("how many members expire this week?", Language.ENGLISH),
        ("Combien de membres expirent cette semaine ?", Language.FRENCH),
        ("Quels sont les abonnements qui se terminent bientot ?", Language.FRENCH),
        ("كم عدد الأعضاء النشطين اليوم؟", Language.ARABIC),
        ("chhal 3ndna men membre daba?", Language.DARIJA),
        ("wach kayn chi promo dyal l'abonnement?", Language.DARIJA),
    ]
    for text, expected in cases:
        got = detect(text)
        check(f"{expected!s:16} {text[:32]!r}", got is expected, f"got {got}")

    # Darija borrows French freely ("le coach mzyan"), so the French score is inflated
    # by exactly the sentences that are *not* French. Nothing borrows `bghit` the
    # other way, which is why Darija wins a tie.
    check("a Darija sentence full of French words is still Darija",
          detect("le coach mzyan bzaf walakin bghit nchouf chi haja") is Language.DARIJA)

    print("\n\033[1m  it is allowed to abstain\033[0m")

    # Forcing French onto an English question is worse than not detecting at all, so
    # the bar to speak is deliberately higher than the bar to shrug.
    for quiet in ("", "   ", "ok", "?", "234", "gym"):
        got = detect(quiet)
        check(f"no guess from {quiet!r:8}", got is Language.UNKNOWN, str(got))
    check("...and abstaining keeps the generic rule",
          instruction(Language.UNKNOWN)
          == "- Reply in the language the question was asked in.")
    check("a confident detection names the language",
          "French" in instruction(Language.FRENCH))
    # Darija is spoken, not written formally: answering it word for word reads as
    # mockery, so the instruction offers French as the fallback.
    check("...and Darija gets its own instruction",
          "Darija" in instruction(Language.DARIJA)
          and "French" in instruction(Language.DARIJA))

    print("\n\033[1m  measured against the seeded corpus\033[0m")

    comments = corpus()
    by_language: Counter[str] = Counter(c.language for c in comments)
    check("the corpus really is multilingual", len(by_language) >= 3,
          " ".join(f"{k}={v}" for k, v in sorted(by_language.items())))

    named: Counter[str] = Counter()
    misread: list[tuple[str, str, str]] = []
    for comment in comments:
        expected = _EXPECTED[comment.language]
        got = detect(comment.content)
        if got is expected:
            named[comment.language] += 1
        elif got is not Language.UNKNOWN:
            misread.append((comment.language, str(got), comment.content[:60]))

    for code, language in _EXPECTED.items():
        total = by_language[code]
        if not total:
            continue
        wrong = sum(1 for row in misread if row[0] == code)
        abstained = total - named[code] - wrong
        # The bar is on being *wrong*, not on being confident. Abstaining on a short
        # comment costs nothing -- the model gets the generic rule and handles it.
        # Claiming Arabic for a French sentence costs an answer in the wrong language.
        check(f"{language!s:16} is never misread", wrong == 0,
              f"{named[code]}/{total} named, {abstained} abstained")

    total_named = sum(named[code] for code in _EXPECTED)
    check("most of the corpus is named outright, not abstained on",
          total_named >= len(comments) * 0.6,
          f"{total_named}/{len(comments)}")

    for language, got, text in misread[:3]:
        print(f"      {language} read as {got}: {text!r}")

    return FAIL


if __name__ == "__main__":
    sys.exit(main())
