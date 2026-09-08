"""Feedback comments spanning positive, negative and mixed (task 1.6).

Three things this corpus has to do, and each one shapes the generator:

**Give the sentiment module something to be graded on.** A module that scores 500
five-star "great gym!" comments has demonstrated nothing. Roughly a fifth of these
are complaints and a quarter are genuinely mixed -- "the new machines are great, but
the changing rooms are never clean" -- which is the case a naive keyword classifier
gets wrong and a real one gets right.

**Give the owner something worth asking about.** "What are people complaining about?"
should return a theme, not a list. So complaints cluster on a few real subjects --
crowding at 19:00, broken treadmills, cold showers -- rather than being scattered.

**Look like a Moroccan gym's inbox.** Mostly English, because that is the corpus
language the retrieval pipeline rewrites queries into, but a fifth in French and a
few lines of Darija: that is what these boxes actually contain, and a monolingual
corpus would hide every encoding and language-detection bug until the demo.

`sentiment` and `sentiment_score` are filled in here for most rows, as though
Dahani's backend had already called `POST /internal/sentiment`. About one in seven
is left unscored on purpose -- a real backlog exists at any moment, `is_scored` needs
both states in real data, and task 5.1 needs rows to actually work on.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

# Positive, negative, mixed. Neutral is not a fourth bucket: a comment nobody felt
# strongly enough about to shade one way is rare, and a mixed comment is what people
# actually mean when they say "neutral".
POLARITY_WEIGHTS = {"positive": 55, "negative": 20, "mixed": 25}

UNSCORED_RATE = 0.14  # the backlog task 5.1 will work through

LANGUAGE_WEIGHTS = {"en": 75, "fr": 20, "ar": 5}

POSITIVE = {
    "en": (
        "The coaches actually correct your form instead of standing on their phones.",
        "New machines arrived last month and everything works.",
        "Place is spotless every time I come, even late.",
        "Good energy in the evenings and nobody makes you feel out of place.",
        "Best value in town for what you get.",
        "Reception remember your name after two visits, which is a small thing but it matters.",
        "Free weights area is well stocked and the plates are always racked.",
        "Signed up my brother too. No complaints from either of us.",
        "The 19:00 class is the reason I still come three times a week.",
        "Showers are hot and the changing room is clean. Low bar, but plenty of places miss it.",
    ),
    "fr": (
        "Tres bonne salle, les coachs sont a l'ecoute et corrigent les postures.",
        "Materiel neuf et bien entretenu, rien a redire.",
        "Propre, bien eclaire, et l'ambiance est agreable le soir.",
        "Rapport qualite prix imbattable dans le quartier.",
        "L'accueil est chaleureux, on se sent bien des le premier jour.",
    ),
    "ar": (
        "Salle nadya bzaf, l coach kayhtam b nas.",
        "Lmakina jdida w kolchi khedam, safi ana radi.",
    ),
}

NEGATIVE = {
    "en": (
        "Impossible to get a bench between 19:00 and 20:00. You queue for everything.",
        "Two treadmills have been out of order for three weeks and nobody says anything.",
        "Changing rooms smell and half the showers run cold.",
        "Nobody answers the phone. I called four times about my membership.",
        "Price went up and nothing about the gym changed.",
        "Music is so loud you cannot hear the coach two metres away.",
        "Weights are never racked and staff do not say anything about it.",
        "I was charged twice and it took a month to sort out.",
        "The air conditioning has not worked all summer.",
        "Too crowded after work. I have started going elsewhere.",
    ),
    "fr": (
        "Beaucoup trop de monde entre 19h et 20h, on attend pour chaque machine.",
        "Deux tapis de course en panne depuis des semaines, personne ne fait rien.",
        "Les vestiaires ne sont pas propres et l'eau est froide.",
        "Impossible de joindre quelqu'un par telephone.",
        "Les prix ont augmente sans aucune amelioration.",
    ),
    "ar": (
        "Bezzaf dyal nas f l3chiya, katsenna 3la kola makina.",
    ),
}

# The interesting case: praise and a complaint in one comment. A keyword classifier
# reads the first half and calls it positive; that is the failure task 5.1 is graded
# on avoiding.
MIXED = {
    "en": (
        "{p} That said, {n}",
        "{p} My only complaint is that {n}",
        "Honestly mixed. {p} But {n}",
        "{p} It would be a five if not for one thing: {n}",
    ),
    "fr": (
        "{p} Par contre, {n}",
        "{p} Le seul point negatif: {n}",
    ),
    "ar": (
        "{p} Walakin, {n}",
    ),
}

MIXED_POSITIVE = {
    "en": (
        "The coaching is genuinely good.",
        "Equipment is new and well maintained.",
        "The staff are friendly.",
        "The location is perfect for me.",
    ),
    "fr": ("Les coachs sont competents.", "Le materiel est recent."),
    "ar": ("L coach mzyan bzaf.",),
}

MIXED_NEGATIVE = {
    "en": (
        "it is unusable between 19:00 and 20:00.",
        "the changing rooms need serious attention.",
        "half the cardio machines have been broken for weeks.",
        "the music is far too loud.",
        "the price is high for what you get outside peak hours.",
    ),
    "fr": ("il y a beaucoup trop de monde le soir.", "les vestiaires sont mal entretenus."),
    "ar": ("l vestiaire machi nqi.",),
}

# Ratings agree with the polarity but not perfectly: people leave four stars with a
# complaint attached, and a corpus where rating predicts sentiment exactly would let
# task 5.1 cheat by reading the number.
RATINGS = {"positive": (4, 4, 5, 5, 5), "negative": (1, 1, 2, 2, 3), "mixed": (2, 3, 3, 4, 4)}

SENTIMENT_BY_POLARITY = {"positive": "POSITIVE", "negative": "NEGATIVE", "mixed": "NEUTRAL"}
# Confidence bands. Mixed comments are genuinely harder, and a model that claimed
# 0.95 on them would be miscalibrated -- so the seeded scores say so.
SCORE_BANDS = {"positive": (0.78, 0.98), "negative": (0.74, 0.97), "mixed": (0.45, 0.72)}

# A fixed sentence repeated forty times is a corpus a classifier can memorise rather
# than read, and an owner scrolling the feedback panel would see the same line over
# and over. Wrapping each core sentence in an optional opener and closer multiplies
# the variety roughly tenfold for the cost of twenty more strings.
OPENERS = {
    "en": ("", "", "", "Been coming here for a few months now. ", "Honestly? ",
           "First review, so: ", "Quick note. ", "Long-time member. "),
    "fr": ("", "", "", "Je viens depuis six mois. ", "Franchement, ", "Petit retour: "),
    "ar": ("", "", "Ana jay hna men chi 6 chhor. "),
}
CLOSERS = {
    "positive": {
        "en": ("", "", "", " Recommended.", " Would recommend it to a friend.",
               " Renewing without thinking about it.", " Keep it up."),
        "fr": ("", "", " Je recommande.", " Je renouvelle sans hesiter."),
        "ar": ("", " Nsahkom bih."),
    },
    "negative": {
        "en": ("", "", "", " Sort it out please.", " Not what I signed up for.",
               " I am considering cancelling.", " Disappointing for the price."),
        "fr": ("", "", " A corriger.", " Decevant pour le prix."),
        "ar": ("", " Khass islah."),
    },
    "mixed": {
        "en": ("", "", "", " Still worth it overall.", " On balance I am staying.",
               " Three stars for now."),
        "fr": ("", "", " Dans l'ensemble ca reste correct."),
        "ar": ("", " Walakin bqit hna."),
    },
}

# Not everyone writes in. The ones who do are either engaged or annoyed.
COMMENT_RATE_ENGAGED, COMMENT_RATE_QUIET = 0.22, 0.06
MAX_COMMENTS_PER_MEMBER = 3


@dataclass(frozen=True)
class FeedbackRow:
    member_id: str
    content: str
    rating: int
    sentiment: str | None
    sentiment_score: Decimal | None
    created_at: datetime
    # Kept out of the database: the label the generator intended, so a future
    # sentiment eval set can be built without re-deriving it.
    intended: str
    language: str


def _pick(rng: random.Random, table: dict[str, tuple[str, ...]], language: str) -> str:
    options = table.get(language) or table["en"]
    return rng.choice(options)


def _join(opener: str, core: str) -> str:
    """`Franchement, ` + `Les vestiaires...` is `Franchement, les vestiaires...`.

    An opener that ends mid-sentence has to lowercase what follows it. Small, but a
    corpus full of "Franchement, Les" reads as machine-assembled at a glance, and
    this text is going in front of an evaluator.
    """
    if opener.endswith((", ", ": ")) and core[:1].isupper():
        return opener + core[0].lower() + core[1:]
    return opener + core


def build_feedback(
    member_id: str,
    windows: list[tuple[datetime, datetime]],
    visits: int,
    rng: random.Random,
    now: datetime,
) -> list[FeedbackRow]:
    """Comments one member left, dated inside a membership they actually held."""
    rate = COMMENT_RATE_ENGAGED if visits >= 20 else COMMENT_RATE_QUIET
    if not windows or rng.random() > rate:
        return []

    rows: list[FeedbackRow] = []
    for _ in range(rng.randint(1, MAX_COMMENTS_PER_MEMBER)):
        start, end = rng.choice(windows)
        end = min(end, now)
        if end <= start:
            continue

        polarity = rng.choices(list(POLARITY_WEIGHTS), weights=list(POLARITY_WEIGHTS.values()))[0]
        language = rng.choices(list(LANGUAGE_WEIGHTS), weights=list(LANGUAGE_WEIGHTS.values()))[0]

        if polarity == "mixed":
            core = _pick(rng, MIXED, language).format(
                p=_pick(rng, MIXED_POSITIVE, language), n=_pick(rng, MIXED_NEGATIVE, language))
        else:
            core = _pick(rng, POSITIVE if polarity == "positive" else NEGATIVE, language)
        content = (_join(_pick(rng, OPENERS, language), core)
                   + _pick(rng, CLOSERS[polarity], language))

        scored = rng.random() > UNSCORED_RATE
        low, high = SCORE_BANDS[polarity]
        rows.append(FeedbackRow(
            member_id=member_id,
            content=content,
            rating=rng.choice(RATINGS[polarity]),
            sentiment=SENTIMENT_BY_POLARITY[polarity] if scored else None,
            sentiment_score=(Decimal(f"{rng.uniform(low, high):.3f}") if scored else None),
            created_at=start + timedelta(seconds=rng.randint(0, int((end - start).total_seconds()))),
            intended=polarity,
            language=language,
        ))
    return rows
