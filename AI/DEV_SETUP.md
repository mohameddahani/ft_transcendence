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
