"""Moroccan name and place data for the seeder.

Realism here is not decoration. The assistant will be asked "who is Fatima
Zerouali?" and "who hasn't come since Ramadan?" in front of an evaluator, and a
database full of `Test User 041` makes every answer look like a toy. Names also
have to survive being turned into usernames and email addresses, so the accented
forms below are transliterated by `slug()` rather than stored twice.
"""

from __future__ import annotations

import unicodedata

# Gendered, because `members.gender` is NOT NULL and a name that disagrees with it
# is the kind of detail that makes seeded data feel generated.
MALE_FIRST_NAMES: tuple[str, ...] = (
    "Mohamed", "Ahmed", "Youssef", "Omar", "Hamza", "Ayoub", "Anas", "Bilal",
    "Yassine", "Reda", "Mehdi", "Amine", "Ilyas", "Zakaria", "Othmane", "Soufiane",
    "Khalid", "Rachid", "Karim", "Said", "Abdellah", "Hicham", "Nabil", "Tarik",
    "Jalal", "Marouane", "Badr", "Younes", "Ismail", "Adil", "Mustapha", "Driss",
    "Aziz", "Hassan", "Noureddine", "Walid", "Achraf", "Ayman", "Mounir", "Samir",
    "Yahya", "Zouhair", "Abderrahim", "Fouad", "Jamal", "Brahim", "Redouane",
    "Salaheddine", "Lahcen", "Taha",
)

FEMALE_FIRST_NAMES: tuple[str, ...] = (
    "Fatima", "Khadija", "Aicha", "Zineb", "Salma", "Imane", "Sara", "Meryem",
    "Nadia", "Siham", "Hajar", "Amina", "Latifa", "Hind", "Ghita", "Soukaina",
    "Yasmine", "Kaoutar", "Chaimae", "Oumaima", "Btissam", "Loubna", "Naima",
    "Rachida", "Samira", "Karima", "Wafaa", "Malika", "Souad", "Ilham", "Assia",
    "Nawal", "Houda", "Sanaa", "Hanane", "Fadwa", "Basma", "Doha", "Rim", "Lamia",
    "Zahra", "Bouchra", "Saida", "Nezha", "Widad", "Asmae", "Ikram", "Manal",
    "Nisrine", "Safaa",
)

SURNAMES: tuple[str, ...] = (
    "Alami", "Bennani", "Idrissi", "Tazi", "Ouali", "Sabri", "El Amrani",
    "Benjelloun", "Chraibi", "Fassi", "Berrada", "Lahlou", "Sekkat", "Tahiri",
    "Bouzidi", "Naciri", "Kabbaj", "Belkacem", "Zerouali", "Ait Ali", "Ouazzani",
    "Skalli", "Mansouri", "Rifai", "Slaoui", "Cherkaoui", "Hakimi", "Boukhris",
    "El Malki", "Benali", "Ziani", "Haddad", "Moujahid", "Sbai", "Guessous",
    "Lamrani", "Benkirane", "Daoudi", "Aouad", "Errami", "Bennis", "Filali",
    "Kettani", "Squalli", "Tounsi", "Zaidi", "Bahri", "El Ghazi", "Nejjar", "Raji",
)

# Real districts, so an address column reads like an address.
DISTRICTS: dict[str, tuple[str, ...]] = {
    "Agadir": ("Talborjt", "Founty", "Dakhla", "Hay Mohammadi", "Charaf", "Tikiouine"),
    "Marrakech": ("Gueliz", "Hivernage", "Daoudiate", "Massira", "Targa", "Semlalia"),
    "Casablanca": ("Maarif", "Ain Diab", "Gauthier", "Oasis", "Bourgogne", "Hay Hassani"),
    "Fes": ("Agdal", "Saiss", "Narjiss", "Ville Nouvelle", "Zouagha", "Montfleuri"),
}

# Weighted by what people in Morocco actually use, menara.ma included.
EMAIL_PROVIDERS: tuple[tuple[str, int], ...] = (
    ("gmail.com", 60), ("hotmail.com", 15), ("yahoo.fr", 12),
    ("outlook.com", 8), ("menara.ma", 5),
)


def slug(value: str) -> str:
    """`El Amrani` -> `elamrani`, `Fes` -> `fes`.

    NFKD splits an accented character into its base letter plus a combining mark;
    dropping the marks leaves ASCII. Usernames and email local parts have to be
    ASCII, and doing this once here is better than keeping a second, deaccented
    copy of every name in sync with the first.
    """
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_only = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return "".join(ch for ch in ascii_only.lower() if ch.isalnum())
