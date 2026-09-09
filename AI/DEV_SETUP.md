# AI Service — Local Dev Environment

What is installed and how to bring it up. Owned by Oussama; set up 2026-09-03.

## Installed

| Tool | Version | Notes |
|---|---|---|
| colima | 0.10.3 | Container runtime VM. Apple Virtualization + virtiofs. 4 CPU / 6 GB / 60 GB |
| docker | 29.7.2 | CLI only — no Docker Desktop |
| docker compose | 5.5.0 | Homebrew plugin, wired via `~/.docker/config.json` → `cliPluginsExtraDirs` |
| uv | 0.11.31 | Python version + venv + dependency manager |
| Python | 3.12.13 | Pinned in `AI/.python-version` |
| Node | 20.20.2 | Only needed to run Prisma migrations |

## Daily start

```bash
colima start                 # only if `colima status` says it is not running
cd AI && source .venv/bin/activate
docker compose up -d         # once AI/docker-compose.yml exists (task 1.1)
```

`colima stop` when you are done — it holds 6 GB of RAM.

## When a change does not take effect

Four different things look identical from the outside — the code you just edited is not
the code that is running — and each needs a different command. All four cost real time
during D14–D17 before they were written down.

| You changed | Do this | Why `restart` is not enough |
|---|---|---|
| `requirements.txt`, `Dockerfile` | `docker compose up -d --build` | Packages live in the image. `restart` reuses it, so the import fails or the old version answers. |
| `.env` | `docker compose up -d` | Environment is fixed when the **container** is created. `restart` keeps the old values — a wrong model id will look like it was ignored. |
| `app/**.py` | usually nothing — the override bind-mounts `app/` and uvicorn `--reload` picks it up | **But `--reload` misses edits often enough to matter.** Before *measuring* anything (a prompt change, a timing), `docker compose restart ai` and be sure. |
| anything, for production | `docker compose -f docker-compose.yml up -d --build` | Without `-f`, compose loads `docker-compose.override.yml` and you are testing the dev topology. |

The tell is always the same: run the check twice and get the same wrong answer, then
inspect the running container directly —
`docker compose exec -T ai printenv GEMINI_CHAT_MODEL`,
`docker compose exec -T ai pip show langgraph`,
`docker compose exec -T ai python -c "import app.main as m; print(sorted({r.path for r in m.app.routes}))"`.
A container recreate (`up -d`) also wipes `/tmp`, so any script copied in with
`docker compose cp` has to be copied again.

## Layout

```
AI/
  .python-version   3.12
  .venv/            gitignored
  data/             gitignored — Chroma + SQLite state live here
  .gitignore
```

## Git

Working branch is **`ai-work`**, created from `origin/backend` — not from `origin/ai`, which is
stale (last commit 2026-07-03) and has none of Dahani's schema. `ai-work` therefore contains the
current backend, including `backend/prisma/` with **24 migrations**, which D1 needs.

**Confirm the branching strategy with Dahani** before the first push — how the AI work merges back
is a team decision, not one to make alone.

## SSH / GitHub

The key `~/.ssh/id_ed25519` is valid and authenticates as `oussamars`. It is **passphrase
protected**, which is why non-interactive shells could not use it — not a broken key.

`~/.ssh/config` now has:

```
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

Run once so macOS Keychain stores the passphrase:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

After that, `git fetch` / `git push` stop prompting and survive reboots.
Previous config backed up alongside as `config.bak.<timestamp>`.
