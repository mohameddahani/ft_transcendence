"""What language the question is in (task 2.6).

**Not a model call.** Asking Gemini to classify the language before answering it
doubles the round trips on every turn to decide something a hundred lines of Python
gets right, and it makes the behaviour unassertable without a network: a detector
that is a function can be measured against the corpus, and this one is -- against the
`seeder/feedback.py` text, which carries the language it was generated in.

**The output is advice, not a command.** When the detector is confident, the prompt
says so; when it is not, the prompt keeps the generic "reply in the language the
question was asked in" and lets the model decide. That asymmetry is deliberate: a
wrong detection that *forces* French onto an English question is worse than no
detection at all, so the detector is allowed to abstain and does so by default.

The four cases that matter here: English (the corpus language), French (about a fifth
of it), Arabic script, and Darija written in Latin letters -- which is what Moroccan
members actually type and which no off-the-shelf detector handles, because to a
language identifier it looks like badly spelled French.
"""

from __future__ import annotations

import re
from enum import StrEnum
from typing import Final


class Language(StrEnum):
    ENGLISH = "English"
    FRENCH = "French"
    ARABIC = "Arabic"
    DARIJA = "Moroccan Darija"
    UNKNOWN = "unknown"


# U+0600-U+06FF is the Arabic block. One letter of it settles the question -- no
# amount of Latin-script scoring competes with a different script.
_ARABIC = re.compile(r"[؀-ۿ]")
_WORDS = re.compile(r"[a-zA-Zàâäéèêëîïôöùûüç0-9']+")

# Marker words, not a dictionary. These are the closed-class words that carry a
# language even in a one-line question: articles, pronouns, question words.
_FRENCH: Final[frozenset[str]] = frozenset("""
    le la les un une des du de au aux et ou mais donc car ne pas plus moins
    est sont était sera ai as avons avez ont être avoir faire
    je tu il elle nous vous ils elles on me te se lui leur mon ma mes ton ta notre nos
    ce cet cette ces qui que quoi dont où quel quelle quels quelles
    combien pourquoi comment quand
    pour avec sans sous sur dans chez vers entre depuis pendant
    salle membres abonnement abonnements seance seances mois annee cours coach
    merci bonjour bien tres tout tous toute toutes aussi encore
""".split())

# Darija in Latin script. The digits are letters: 3 is ع, 7 is ح, 9 is ق -- so a
# "word" like `3ndi` or `l7al` is a strong signal that nothing else produces.
_DARIJA: Final[frozenset[str]] = frozenset("""
    chhal ch7al wach wash bghit bghina bghiti kayn kayna kaynin makayn makaynch
    mzyan mzyana zwin bzaf bzzaf wakha safi daba chwiya swiya
    dyal dial ديال hadi hada hadchi dakchi
    ghadi ghadya khass khassni 3ndi 3andi 3la 3lach 3afak l7al lhal
    mochkil moshkil salam salamou choukran chokran labas
    nta nti ana hna houma smiti fin imta kifach kifash
""".split())

# Present so a French-looking English sentence ("the coach is competent") is not
# dragged across by one shared token.
_ENGLISH: Final[frozenset[str]] = frozenset("""
    the a an and or but is are was were be been have has had do does did
    i you he she we they me him her them my your our their this that these those
    who what which where when why how many much
    for with without under over in on at from to into
    gym member members membership plan month year class coach staff
    thanks hello please very all also still
""".split())

# Two markers, or one marker and nothing pulling the other way. A single "la" in an
# English sentence must not make it French, and a three-word question must still be
# classifiable.
_MIN_HITS: Final = 2
_MIN_MARGIN: Final = 2


def detect(text: str) -> Language:
    """The language of a message, or `UNKNOWN` when it is not clear enough to act on."""
    if not text or not text.strip():
        return Language.UNKNOWN

    if _ARABIC.search(text):
        return Language.ARABIC

    words = [word.lower() for word in _WORDS.findall(text)]
    if not words:
        return Language.UNKNOWN

    scores = {
        Language.FRENCH: sum(word in _FRENCH for word in words),
        Language.DARIJA: sum(word in _DARIJA for word in words),
        Language.ENGLISH: sum(word in _ENGLISH for word in words),
    }
    # French accents are a signal of their own: "réservé", "problème". Darija in
    # Latin script does not use them, English does not either.
    if re.search(r"[àâäéèêëîïôöùûüç]", text.lower()):
        scores[Language.FRENCH] += 2

    # Darija wins outright, not on a tie-break, and it does not have to beat the
    # French score. A Darija sentence borrows French and English freely -- "le coach
    # mzyan bzaf" scores two of each -- so requiring a margin would abstain on exactly
    # the sentences that are most obviously Darija. The asymmetry is safe because the
    # markers are asymmetric: `bghit`, `mzyan` and `bzaf` are words in no other
    # language here, while `le` and `the` are words in this one.
    if scores[Language.DARIJA] >= _MIN_HITS:
        return Language.DARIJA

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    best, best_score = ranked[0]
    runner_up_score = ranked[1][1]

    if best_score < _MIN_HITS or best_score - runner_up_score < _MIN_MARGIN:
        return Language.UNKNOWN
    return best


def instruction(language: Language) -> str:
    """The line the system prompt carries about language.

    Abstention is a real answer: with no confident detection the model gets the same
    generic rule it had before 2.6, which it follows well for anything the detector
    would have got right anyway.
    """
    if language is Language.UNKNOWN:
        return "- Reply in the language the question was asked in."
    if language is Language.DARIJA:
        # Darija is spoken, not written formally. Answering in it word for word reads
        # as mockery; answering in the language it is closest to reads as helpful.
        return ("- The question is in Moroccan Darija. Reply in Darija if you can do it\n"
                "  naturally, otherwise in French, and keep it short and plain.")
    return f"- The question is in {language}. Reply in {language}."
