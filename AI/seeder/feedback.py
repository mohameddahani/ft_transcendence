from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

POLARITY_WEIGHTS = {"positive": 55, "negative": 20, "mixed": 25}

# some comments are left without a sentiment, like feedback the AI hasn't scored yet
UNSCORED_RATE = 0.14

# "ar" is Darija written in Latin letters, the way members actually type it
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

# a good point then a complaint: a keyword classifier reads the first half and gets it wrong
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

# the star rating follows the sentiment only roughly, so it can't be used to cheat
RATINGS = {"positive": (4, 4, 5, 5, 5), "negative": (1, 1, 2, 2, 3), "mixed": (2, 3, 3, 4, 4)}

SENTIMENT_BY_POLARITY = {"positive": "POSITIVE", "negative": "NEGATIVE", "mixed": "NEUTRAL"}
SCORE_BANDS = {"positive": (0.78, 0.98), "negative": (0.74, 0.97), "mixed": (0.45, 0.72)}

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
    intended: str
    language: str


def _pick(rng: random.Random, table: dict[str, tuple[str, ...]], language: str) -> str:
    options = table.get(language) or table["en"]
    return rng.choice(options)


def _join(opener: str, core: str) -> str:
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
