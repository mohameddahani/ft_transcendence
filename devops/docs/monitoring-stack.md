# GymFlow Monitoring Stack

Oct 12, 2026 · @hi claude

How Prometheus, Grafana, and Alertmanager work together to observe and alert on GymFlow services.

## What each tool is

**Prometheus** is a time-series database and monitoring engine. It works by *pulling* (scraping) metrics from your services on a schedule — every 15 seconds by default. It stores those numbers over time and lets you query them with its own language (PromQL). Think of it as the brain that collects and stores all your numbers.

**Grafana** is a visualization tool. It has no data of its own — it connects to Prometheus as a datasource and turns the numbers into graphs and dashboards. Think of it as the screen that shows you what Prometheus collected.

**Alertmanager** receives firing alerts from Prometheus (not metrics — just "this rule crossed its threshold") and decides where to send them: Discord, email, Slack, PagerDuty, etc. It also handles grouping, silencing, and repeat intervals so you don't get flooded. Think of it as the notification router.

**Exporters** are small adapter processes that sit next to a service and translate its internal state into the Prometheus metrics format (`/metrics` HTTP endpoint). Redis doesn't speak Prometheus — `redis_exporter` does. Postgres doesn't either — `postgres_exporter` does. Without an exporter, Prometheus has nothing to scrape for that service.

## The full flow — step by step

1. **A service runs** — Redis, Postgres, nginx, node-exporter are all up inside Docker on the `internal` network.
2. **An exporter translates** — `redis_exporter` connects to Redis and exposes its internal stats at `http://redis-exporter:9121/metrics` in Prometheus format.
3. **Prometheus scrapes** — every 15 seconds, Prometheus sends an HTTP GET to each target listed in `prometheus.yml`. It receives a text file of metrics and stores the values with a timestamp.
4. **Prometheus evaluates rules** — every 15 seconds, it also evaluates your alert rules (e.g. `redis_up == 0`). If a rule is true, the alert enters **pending** state.
5. **Alert becomes firing** — if the rule stays true for the full `for:` duration (e.g. 30 seconds), the alert moves to **firing** state and Prometheus pushes it to Alertmanager.
6. **Alertmanager receives the alert** — it groups it, waits `group_wait` (10–30s) in case more alerts arrive at the same time, then routes it to the configured receiver.
7. **Discord gets the notification** — Alertmanager sends an HTTP POST to your Discord webhook URL with the formatted message. A red alert appears in your channel.
8. **Service comes back up** — `redis_up` returns to 1, Prometheus marks the alert as resolved, sends a resolved notification to Alertmanager, and a green message appears in Discord.
9. **Grafana shows it all** — at any point you can open Grafana, pick the Prometheus datasource, and graph any of these metrics over time. It is purely a viewer — it never writes to Prometheus or changes anything.

## How scraping works

Prometheus uses a **pull model**: it goes out and fetches metrics, rather than services pushing data to it. This is intentional — if a service goes silent, Prometheus notices immediately because the scrape fails.

Every service that Prometheus monitors must expose an HTTP endpoint (by convention `/metrics`) that returns a plain-text file like this:

```
redis_up 1
redis_connected_clients 3
redis_memory_used_bytes 876544
```

The `scrape_interval: 15s` in `prometheus.yml` means Prometheus hits every target every 15 seconds and stores the values as a time series. Each data point is: metric name + labels + value + timestamp.

Targets are defined under `scrape_configs`. Each `job_name` groups related targets (all Redis instances, all Postgres instances, etc.) and `targets` lists the `host:port` addresses Prometheus should scrape. Because all exporters are on the Docker `internal` network, Prometheus can reach them by container name.

## How alerting works

Alert rules live in `.yml` files under `prometheus/alerts/`. Prometheus evaluates them on every `evaluation_interval` (also 15s by default). Each rule has three key parts:

| Field | What it does | Example |
| --- | --- | --- |
| `expr` | The PromQL condition that must be true | `redis_up == 0` |
| `for` | How long it must stay true before firing | `30s` |
| `labels` | Tags attached to the alert (used for routing) | `severity: critical` |

**Pending vs Firing** — this two-step design filters out flapping. When `expr` first becomes true, the alert enters **pending**. It stays pending until `for` duration passes without the condition resolving. Only then does it become **firing** and get sent to Alertmanager. This prevents a service that crashes and restarts in 5 seconds from sending a notification.

**Alertmanager routing** — once Prometheus pushes a firing alert, Alertmanager applies its `route` config:

- `group_wait` (10–30s): waits before sending, in case more alerts arrive at the same time so they can be batched into one message.
- `group_interval` (5m): if a group is already active and a new alert joins it, wait this long before sending an update.
- `repeat_interval` (4h): if an alert is still firing after this time, re-send the notification as a reminder.

When the condition resolves, Prometheus sends a resolved signal to Alertmanager, which sends the green resolved notification (because `send_resolved: true`).

## How Grafana fits in

Grafana is **read-only** against Prometheus. It never writes metrics, never triggers alerts, and never touches Alertmanager. Its only job is to query Prometheus and draw the results.

The connection is set up through a **datasource** — in GymFlow this is auto-provisioned from `grafana/provisioning/datasources/prometheus.yml` so Grafana knows to talk to `http://prometheus:9090` on startup, with no manual clicking required.

**Dashboards** are collections of panels, each panel running a PromQL query against Prometheus. You can build them in the UI and export them as JSON, or import community dashboards by ID (e.g. `1860` for Node Exporter Full).

Grafana is exposed to the browser through nginx at `/grafana/`, but Prometheus and Alertmanager are **not** exposed to the browser — they stay internal and are only reachable via `docker compose exec` for debugging. This is intentional: Prometheus has no authentication by default, so you never expose it publicly.

## The exporter pattern

Most services (Redis, Postgres, nginx) were not built with Prometheus in mind. An **exporter** is a small sidecar process that bridges that gap: it speaks the service's native protocol on one side, and speaks Prometheus on the other.

```
Prometheus ---scrapes---> redis_exporter:9121/metrics ---queries---> Redis:6379
```

This creates an important distinction between two types of `down` alerts:

| Situation | Metric | What it means |
| --- | --- | --- |
| Exporter container is stopped | `up == 0` | Prometheus can't reach the exporter at all |
| Redis is down, exporter is still running | `redis_up == 0` | Exporter is up but reports Redis unreachable |

The `up` metric is automatically set by Prometheus itself for every scrape target — it is `1` when the scrape succeeds, `0` when it fails. The `redis_up` (or `pg_up`, `nginx_up`) metric is published by the exporter itself, specifically to report whether it can reach its upstream service.

This is why stopping the exporter triggers `ServiceDown` (via `up == 0`) but stopping Redis without stopping its exporter requires a separate rule on `redis_up == 0`.

## File structure reference

```
devops/monitoring/
├── prometheus/
│   ├── prometheus.yml          # Scrape targets, alertmanager address, rule file paths
│   └── alerts/
│       └── infra.rules.yml     # Alert rules: ServiceDown, HighMemory, RedisDown, NginxDown, PostgresDown
├── alertmanager/
│   ├── alertmanager.yml        # Routing config + Discord receiver (webhook uses PLACEHOLDER, not real URL)
│   └── entrypoint.sh           # sed-replaces PLACEHOLDER with $DISCORD_WEBHOOK_URL, then starts alertmanager
└── grafana/
    └── provisioning/
        └── datasources/
            └── prometheus.yml  # Auto-wires Prometheus as default datasource on first boot
```

The whole `prometheus/` directory is volume-mounted into the container (not just `prometheus.yml`). If you mount only the top-level file, the `alerts/` subfolder is invisible inside the container and no rules ever load.

## Quick commands

**Check scrape targets and whether they are up:**

```sh
docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets \
  | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
```

**Check active alerts (pending and firing):**

```sh
docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/alerts \
  | jq '.data.alerts[] | {name: .labels.alertname, state: .state}'
```

**Check what Alertmanager currently holds:**

```sh
docker compose exec alertmanager wget -qO- http://localhost:9093/api/v2/alerts \
  | jq '.[].labels.alertname'
```

**Send a test alert to Discord manually:**

```sh
docker compose exec alertmanager wget -qO- \
  --post-data='[{"labels":{"alertname":"TestAlert","severity":"critical"}}]' \
  --header='Content-Type: application/json' \
  http://localhost:9093/api/v2/alerts
```

**Reload Prometheus config without restarting (picks up new rules):**

```sh
docker compose exec prometheus wget -qO- --post-data='' http://localhost:9090/-/reload
```

**Reload Alertmanager config without restarting:**

```sh
docker compose exec alertmanager wget -qO- --post-data='' http://localhost:9093/-/reload
```

**Query a metric directly:**

```sh
docker compose exec prometheus wget -qO- \
  'http://localhost:9090/api/v1/query?query=redis_up' | jq '.data.result'
```

**Tail all monitoring logs at once:**

```sh
docker compose logs -f prometheus alertmanager grafana
```
