from __future__ import annotations

import unicodedata

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

DISTRICTS: dict[str, tuple[str, ...]] = {
    "Agadir": ("Talborjt", "Founty", "Dakhla", "Hay Mohammadi", "Charaf", "Tikiouine"),
    "Marrakech": ("Gueliz", "Hivernage", "Daoudiate", "Massira", "Targa", "Semlalia"),
    "Casablanca": ("Maarif", "Ain Diab", "Gauthier", "Oasis", "Bourgogne", "Hay Hassani"),
    "Fes": ("Agdal", "Saiss", "Narjiss", "Ville Nouvelle", "Zouagha", "Montfleuri"),
}

EMAIL_PROVIDERS: tuple[tuple[str, int], ...] = (
    ("gmail.com", 60), ("hotmail.com", 15), ("yahoo.fr", 12),
    ("outlook.com", 8), ("menara.ma", 5),
)


# usernames and emails must be plain ASCII: "Aïcha El Amrani" -> "aichaelamrani"
def slug(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_only = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return "".join(ch for ch in ascii_only.lower() if ch.isalnum())
