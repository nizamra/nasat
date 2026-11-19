# NASAT Homelab: DevOps and SRE Maturity Roadmap

**Repository:** https://github.com/nizamra/nasat (branch `master`; `staging` exists but is not the focus)
**Document date:** 2026-11-19 (work started about 2026-10-19)
**Repository head at last update (2026-11-19):** `c002c2f` ("return Trivy exit-code to 0", 2026-10-28; unchanged since)
**Author's role:** senior DevOps/SRE architect and mentor (Claude). Claude has read-only access to the repo; every change is delivered as a patch file that the owner applies, commits and pushes. Argo CD then deploys it.

This document records what has been done, what was learned, what is pending, and what comes next, in phases, with enough detail to continue the work without the original conversation.

**Status tags used throughout**

| Tag | Meaning |
|---|---|
| `[DONE]` | Applied on the cluster and verified with evidence from the owner's own output |
| `[APPLIED]` | Applied, but one or more checks are still unconfirmed (stated next to it) |
| `[DELIVERED]` | Patch sent to the owner, not yet applied or confirmed |
| `[TODO]` | Planned, not started |
| `[DECIDE]` | Needs a decision from the owner |
| `VERIFIED` / `INFERRED` / `ASSUMED` | How sure a statement is. Only VERIFIED statements come from command output or files that were actually read |

---

## Table of contents

1. [Where we are (executive summary)](#1-where-we-are-executive-summary)
2. [Owner constraints and standing rules](#2-owner-constraints-and-standing-rules)
3. [The system as it is today](#3-the-system-as-it-is-today)
4. [What has been done, phase by phase](#4-what-has-been-done-phase-by-phase)
5. [The first real power cut (2026-10-26) and what it taught us](#5-the-first-real-power-cut-2026-10-26-and-what-it-taught-us)
6. [Do next: immediate actions](#6-do-next-immediate-actions)
7. [Roadmap ahead, phase by phase](#7-roadmap-ahead-phase-by-phase)
8. [Security backlog](#8-security-backlog)
9. [Verification debt and open questions](#9-verification-debt-and-open-questions)
10. [Runbooks](#10-runbooks)
11. [Decision log](#11-decision-log)
12. [Mistakes and corrections (for honesty and learning)](#12-mistakes-and-corrections-for-honesty-and-learning)
13. [Appendices](#13-appendices)

---

## 1. Where we are (executive summary)

**The platform:** a two-node K3s cluster on two old laptops, managed by GitOps (Argo CD app-of-apps), with Helm and Kustomize for packaging, Terraform and Ansible for bootstrap, Infisical for secrets, Longhorn for storage, and kube-prometheus-stack for monitoring. The application ("nasat", a social profiling app) is a Django backend, an nginx frontend, PostgreSQL and MinIO.

**Main risk profile:** the **worker laptop has no battery and the electricity fails often**. The master is the more stable node. There are **no backups** (a deliberate owner decision), and every Longhorn volume has a **single replica**.

**Progress in one table**

| Phase | Topic | Status |
|---|---|---|
| 0 | Discovery, baseline, findings | `[DONE]` |
| 1 | Requests/limits on the core app | `[DONE]` (functional post+image test still unconfirmed) |
| 1b | VPA in recommend-only mode | `[APPLIED]` (recommendations not yet re-checked) |
| 2a | API-server scraping and core alert rules | `[DONE]` |
| 2b | Alertmanager, Telegram, Healthchecks heartbeat, worker-down alert, secrets pipeline | `[DONE]`: worked in a real power cut; noise fix applied (`acd18b7`, Argo green); the fix is proven only by the next real outage |
| (side) | Production postgres and MinIO pinned to master | `[DONE]` |
| (side) | Longhorn CSI sidecars cut from 3 replicas to 1 | `[APPLIED]` (result not yet measured) |
| (side) | README corrected, heartbeat badge added | `[DONE]` |
| 2c | Blackbox probes and 1 to 2 SLOs | `[TODO]` |
| 2d | Gotify bridge and alert test | `[TODO]` |
| 3 | HPA and load test | `[TODO]` |
| 4 | Storage consolidation on Longhorn and secrets cleanup | `[TODO]` |
| 5 | NetworkPolicy and Traefik hardening | `[TODO]` |
| 6a | CI validation: yamllint, kubeconform plus Helm render, Terraform, ansible-lint, Gitleaks, Trivy | `[APPLIED]`: built by the owner (`validate.yaml`), reviewed by Claude; tuning patch `phase-6a-ci-tuning.patch` delivered 2026-11-19 (not yet applied); the Helm-render and Terraform jobs are not yet confirmed green |
| 6b | CI gating, action SHA pinning, image scans | `[TODO]` |

**What matters most right now**

1. **Phase 2b is finished.** It was proven by a real power cut: one worker-down message, a working heartbeat (`nasat-watchdog` online, confirmed by the owner), and the noisy "failed to send" alerts are now muted (`acd18b7`).
2. **Phase 6a (CI validation) is built and green where I could check it.** The owner's pipeline passes yamllint and ansible-lint (production profile) on `c002c2f`; Claude's tuning patch is delivered. Then choose the next phase; the recommended one is 2c (see [section 7](#7-roadmap-ahead-phase-by-phase)).
3. **Security items are listed for awareness only** ([section 8](#8-security-backlog)). The owner treats this as a small home learning project and has decided not to prioritize them (for example, the Telegram bot token will not be rotated).

---

## 2. Owner constraints and standing rules

These come from the owner and from the original spec. They are the rules every future step must respect.

### 2.1 Constraints from the owner

| Constraint | Consequence |
|---|---|
| Backups are out of scope for now | Do not add backup targets; remove or fix the failing nightly backup job later |
| Work on `master` only; `staging` is later derived from `master` | Every patch targets `master`. Merging `master` into `staging` later needs the node-pinning exception (see 4.4) |
| Immich off; only Gotify and n8n will be enabled soon (Gotify is deployed, n8n is parked) | Other parked apps are ignored |
| **No Docker or experiments on the owner's PC** | The PC is only for editing code and viewing Grafana and Argo CD. Validation runs in GitHub Actions or in throwaway namespaces on the cluster |
| Nothing depends on uptime | Maintenance windows need no notice |
| `*.nasat.local` via the laptop hosts file, no domain | No public DNS or certificates to plan for |
| Zero budget, about 6 hours a day | Prefer free tools; mix production patterns with learning experiments; minimize resource use |
| Move every `local-path` volume to Longhorn | Phase 4 |
| The Longhorn backup-secret in Git is unused | Move to Infisical or delete (Phase 4) |
| Telegram is the primary alert channel; Gotify is for app notifications and n8n, plus a few test alerts | Phase 2d |
| Worker-down alert: **one** notification per outage, no repeats, no "resolved" message, no new probe or pod (use node-exporter), check every minute or faster | Implemented in 2b |
| `nasat-staging` must **not** get a null route | Staging alerts reach Telegram |
| Pin postgres and MinIO to master for the `nasat` app but **not** for `nasat-staging` | Done for `nasat` |
| Terraform runs from the Ansible playbook `ansible-k3s/playbooks/10-infisical-bootstrap.yaml` | All Terraform changes must fit that flow |

### 2.2 Standards from the spec (how Claude works)

- Inspect first, never assume; separate verified facts from assumptions.
- Show exact diffs with explanations; ask before anything destructive; preserve workloads and data.
- Least privilege, no hardcoded secrets, no unnecessary admin exposure, pinned versions.
- Verify outcomes: a healthy pod is not proof the system works.
- One validated phase at a time; do not move on until the current phase is validated or the owner defers it.
- Never claim a component is installed just because a manifest exists in Git.

### 2.3 Security handling (owner preference, 2026-10-27)

This is a small home project for learning and testing, so security is **not a priority**. Claude mentions a security issue in **one short line**, only so the owner is aware, and **never insists, repeats it or holds up work** because of it. Open items stay listed in section 8 as an awareness list.

Claude's own habits continue regardless: it does not repeat secrets it sees, and it does not add new hardcoded secrets.

Optional good practice (a hint, not a requirement): keep secrets out of chat and redact logs before pasting (runbook R6).

---

## 3. The system as it is today

### 3.1 Hardware and cluster (VERIFIED)

| Item | master | worker |
|---|---|---|
| Role | Control plane, schedulable | Agent |
| IP | 192.168.10.30 | 192.168.10.20 |
| CPU | i7-2620M | i5 M560 |
| RAM | 15Gi | 5.7Gi |
| Power | Stable | **No battery, frequent power loss** |
| Reboots in the 7 days before 2026-10-24 | 0 | 2 |

K3s v1.35.4+k3s1, Ubuntu 24.04.5, containerd 2.2.3-k3s1, flannel, Traefik (HTTP only), Longhorn v1.12.1, kube-prometheus-stack 84.5.0 (Prometheus v3.11.3, Alertmanager v0.32.1), Infisical operator 0.11.11.

K3s runs the control-plane components inside one process, so scheduler, kubelet and controller metrics show up under the API-server scrape (`job="apiserver"`).

### 3.2 GitOps flow

```
developer PC --git push--> GitHub (master) --poll/refresh--> Argo CD --sync--> cluster
                                    ^
                       patches produced by Claude, applied by the owner
```

- Argo CD app-of-apps (`argocd/app-of-apps.yaml`) with automated sync, prune and selfHeal.
- Sync waves: Longhorn **-30**, Infisical operator **-25**, Prometheus stack **-20**, Infisical server **-10**, everything else **0** (nasat-master, nasat-staging, argocd-self, playground, vpa).
- Argo applications in `argocd/`: app-of-apps, argocd-self, infisical-operator, infisical, loki-stack, longhorn, nasat-master, nasat-staging, playground, prometheus-stack, vpa.
- The Prometheus application is multi-source: the chart, a `$values` reference, `infrastructure/monitoring/dashboards-configmaps`, and `infrastructure/monitoring/alerting` (the Infisical resources for Alertmanager).

### 3.3 Repository map

| Path | Contents |
|---|---|
| `argocd/` | Argo CD Application manifests |
| `k8s/` | The core app: backend, frontend, ingress, minio, postgres |
| `k8s-playground/` | gotify, homepage, immich (immich is off) |
| `k8s-disabled-apps/` | Nine parked apps: freshrss, jellyfin, jspwiki, linkding, n8n, paperless, pihole, trilium, uptime-kuma |
| `infrastructure/` | argocd, infisical-operator, longhorn, monitoring, vpa |
| `terraform/infisical/` | Infisical projects, identities, Kubernetes auth, secrets |
| `ansible-k3s/` | Playbooks 00 to 10 (base, firewall, ssh, K3s, tailscale, Argo bootstrap, Infisical bootstrap) |
| `.github/workflows/` | Docker build and push workflows and `validate.yaml` (CI validation since 2026-10-27). The old-image cleanup is fully commented out; the 6a patch moves it to `.github/workflows-disabled/` |
| `nuke-cluster.ps1` | Wipes Argo-managed workloads (destructive, owner use only) |

### 3.4 Where things run (VERIFIED 2026-10-25/26)

| Node | Workloads |
|---|---|
| master | Argo CD, Infisical (server, postgres, redis, operator), Gotify, Homepage, Prometheus, Alertmanager, Grafana, kube-state-metrics, operator, VPA recommender, CoreDNS, Traefik, metrics-server, Longhorn managers/UI/CSI, **production postgres-0 and minio**, staging MinIO |
| worker | Production **backend and frontend**, most of staging (backend, frontend, postgres-0), DaemonSets (node-exporter, Longhorn, etc.) |

### 3.5 Storage (VERIFIED)

- 7 Longhorn volumes, every one with **1 replica**, and **all replicas on master**. The one volume attached to the worker has its replica on master. A worker power cut therefore does not take volume data with it.
- Production `pgdata-postgres-0` is on StorageClass `longhorn`; `minio-pvc-longhorn` on `longhorn-critical`.
- Two default StorageClasses exist (Longhorn and the built-in `local-path`). Prometheus (10Gi) and Grafana (2Gi) still use `local-path` (Phase 4 migrates them).
- Replica placement was chosen by the scheduler, not by policy; future volumes could land on the worker.
- No backups. A master disk failure would lose everything.
- A recurring Longhorn job `daily-backup` (01:00) runs every night against an empty backup target and cannot succeed.

### 3.6 Secrets pipeline for Alertmanager (VERIFIED from master `6c1cddf` and cluster output)

```
ansible-k3s/kubeconfig/secrets.yaml  (gitignored, on the owner's PC)
   keys: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, HEALTHCHECKS_PING_URL
        |  playbook 10 asserts they exist, builds a map, passes it as TF_VAR_monitoring_secrets
        v
Terraform (run by playbook 10)  -> project "Monitoring", env "prod": three infisical_secret resources
        |  (values also live in the local Terraform state)
        v
Infisical operator: InfisicalAuth + InfisicalStaticSecret "alertmanager-static-secret" (refresh 60s)
        v
Kubernetes Secret "alertmanager-secrets" (namespace monitoring, 3 keys)
        v
Alertmanager mounts it at /etc/alertmanager/secrets/alertmanager-secrets/
        reads: bot_token_file, chat_id_file (Telegram), url_file (Healthchecks webhook)
```

Notes:
- Terraform owns those three secrets: editing them in the Infisical UI would be overwritten on the next apply. **Change values in `secrets.yaml` and re-run playbook 10.**
- The Infisical operator only watches namespaces listed in `infrastructure/infisical-operator/values.yaml` (`scopedNamespaces`: infisical, gotify, nasat, nasat-staging, monitoring). Any new namespace using Infisical resources must be added there.

### 3.7 Monitoring and alerting configuration (VERIFIED, `infrastructure/monitoring/prometheus-values.yaml`)

| Setting | Value |
|---|---|
| Prometheus scrape / evaluation interval | 40s / 60s |
| Retention | 7d or 6GB, GOGC 50 |
| Prometheus resources | requests 50m / 512Mi, limits 500m / 1280Mi (measured use about 470MB) |
| API-server `sampleLimit` | 28000 (measured 20542 post-relabel) |
| Alertmanager | 1 replica, pinned to master, requests 10m / 32Mi, limits 100m / 128Mi |
| Rule groups on | alertmanager, general, kubernetesApps, kubernetesResources, kubernetesStorage, kubernetesSystem, prometheus, prometheusOperator |
| Rule groups off | API-server availability, SLO and burn-rate groups, network, scheduler, controller-manager, proxy, etcd (not needed on K3s here, or they depend on API-server histograms that were trimmed) |

**Alert routing (Alertmanager)**

| Match | Receiver | Timing | Sends "resolved"? |
|---|---|---|---|
| `alertname = Watchdog` | `healthchecks` (webhook ping) | group_wait 0s, group_interval 2m, repeat 1m (a ping about every 2 minutes) | no |
| `alertname = WorkerUnreachable` | `telegram-once` | group_wait 0s, repeat_interval 8760h | **no** |
| `AlertmanagerFailedToSendAlerts` or `AlertmanagerClusterFailedToSendAlerts` | `null` | applied in `acd18b7` | n/a |
| `severity` is `info` or `none` | `null` | n/a | n/a |
| everything else (default) | `telegram` | group_by alertname+namespace; 30s / 5m / 12h | yes |

**Inhibition**

- While `WorkerUnreachable` fires, all `severity = warning` alerts are muted (the cascade of not-ready pods, target-down and mismatches). Critical alerts still get through.
- A critical alert mutes warning and info alerts with the same alertname and namespace.

**Worker rules (`additionalPrometheusRulesMap.nasat-worker`)**

| Alert | Expression | For | Notes |
|---|---|---|---|
| `WorkerUnreachable` (critical) | `up{job="node-exporter",instance="192.168.10.20:9100"} == 0` | 1m, `keep_firing_for` 10m | evaluated every 30s; expected detection about 1.5 to 2 minutes; text says "probably power" |
| `WorkerTargetMissing` (warning) | `absent(up{...same...})` | 10m | catches a changed worker IP |

`keep_firing_for: 10m` stops a flapping power supply from sending a second message and keeps the cascade inhibited while the node recovers.

**Heartbeat:** Healthchecks.io check `nasat-watchdog` (period 5m, grace 10m) with the Telegram integration. It is the external "dead man's switch": if the pings stop (master down, power or internet gone for over 15 minutes), Healthchecks messages the Telegram group by itself.

### 3.8 Application (VERIFIED)

- Backend: Django on gunicorn with the default single sync worker; probes hit `/admin/login/`; no Django cache and no `CONN_MAX_AGE` (safe to scale horizontally).
- Frontend: nginx; forwards `/media/` to MinIO with no method restriction (see security backlog).
- Postgres 16 StatefulSet with a 5Gi Longhorn volume; MinIO with a 14Gi `longhorn-critical` volume and `Recreate` strategy.
- Core-app pods are QoS Burstable. 7-day idle baseline: memory max backend 86Mi, frontend 12.5Mi, minio 154Mi, postgres 31.6Mi; CPU p95 backend 4.4m, frontend 0.1m, minio 2.8m, postgres 11.3m.

---

## 4. What has been done, phase by phase

Commit hashes refer to `origin/master`.

### 4.0 Phase 0: discovery and baseline `[DONE]`

**Goal:** understand the real system before changing anything.

What was found (the findings that shaped everything else):

1. **The production app was running on the unreliable worker.** The `nodeSelector` blocks in `k8s/backend`, `k8s/frontend` and `k8s/minio` were commented out and postgres had none, so the scheduler placed backend, frontend, postgres-0 and minio on the worker.
2. The README was stale in many places (topology, sync waves, resource tables, a broken code fence).
3. Longhorn's CSI sidecars (attacher, provisioner, resizer, snapshotter) each ran **3 replicas** on a 2-node cluster.
4. A nightly Longhorn backup job ran against an empty backup target.
5. Grafana's admin password is committed in plaintext in `prometheus-values.yaml`; MinIO root credentials are `minioadmin/minioadmin` in Git.
6. `terraform.tfvars.example` is tracked and contains token-shaped values despite saying "Placeholders only".
7. Unexplained restart bursts around 2026-10-19 01:00 to 06:00 local (API server, Longhorn CSI, kube-state-metrics 88 restarts, node-exporter exits). Root cause still unknown.

### 4.1 Phase 1: requests and limits on the core app `[DONE]`

- **What:** resource requests and limits on backend, frontend, postgres and MinIO (commit `3093128`), plus `strategy: Recreate` on MinIO (a ReadWriteOnce volume with RollingUpdate can deadlock).
- **Why:** HPA and VPA both need requests to compute anything meaningful; limits protect a 5.7Gi worker.
- **Acceptance (2026-10-23):** all core pods Burstable, 0 restarts, no OOMKilled. Master allocation then: CPU requests 1740m (43%), limits 4900m (122%); memory requests 2876Mi (18%), limits 7132Mi (44%). No "before" snapshot exists, so the exact saving cannot be proven.
- **Still open:** the functional test (create a post with an image through the UI) has not been confirmed. Postgres and MinIO were restarted onto master on 2026-10-25; backend and frontend ran 4+ days afterwards with 0 restarts.

### 4.2 Phase 1b: Vertical Pod Autoscaler (recommend-only) `[APPLIED]`

- **What:** Argo application `vpa` (commit `82793db`), recommender running on master, four VPA objects in `updateMode: Off`.
- **Why:** get data-driven request recommendations without letting anything evict pods.
- **Status:** the first `describe` was seconds after creation (empty). Recommendations must be re-read and will reflect idle load until a load test is run (Phase 3).

### 4.3 Phase 2a: API-server scraping and core alert rules `[DONE]`

- **What:** scrape the API server, enable selected default rule groups, disable groups that make no sense on K3s (scheduler, controller-manager, proxy, etcd, API-server SLO/burn-rate).
- **Commits:** `4fcfbcd` (initial), `fdf53c8` (sampleLimit 50000), `de81799` (drop unused histograms).
- **The sampleLimit story (a lesson):** the first value (20000) was a guess. The real series count was 32586, so the whole scrape was rejected and `up{job="apiserver"}` fell to 0. It was raised to 50000, then histogram buckets nobody uses were dropped (60755 raw samples to 20542 after relabeling), and the limit was later set to 28000 as a tight safety net in 2b.
- **Result (2026-10-24):** `up{job="apiserver"} = 1`, Prometheus memory about 470MB (35% of its limit), expected alerts only (`PrometheusNotConnectedToAlertmanagers` until 2b, `Watchdog`, `InfoInhibitor`).
- **Top remaining series families:** `etcd_request_duration_seconds_bucket` 3600, `apiserver_request_sli_duration_seconds_bucket` 2888, `apiserver_request_total` 665; further trimming saves little.

### 4.4 Production database and object store pinned to master `[DONE]`

- **What:** `nodeSelector node-role.kubernetes.io/master: master` on the postgres StatefulSet and the MinIO Deployment (`k8s/` only; backend and frontend remain free to run on either node so they can scale out later).
- **Gate that was checked first:** the postgres volume had no `storageClassName` in Git, so it could have been on node-bound `local-path`. Output showed it on `longhorn`, so the pin was safe.
- **Result (VERIFIED):** `postgres-0` and `minio` Running on master, and all 7 Longhorn replicas on master.
- **Staging:** not pinned, by decision. When `master` is merged into `staging`, revert these two hunks on the staging branch.
- **Caveat:** pinning pods does not move Longhorn replicas by itself; it worked here because every replica already lived on master.

### 4.5 Longhorn CSI sidecars: 3 replicas to 1 `[APPLIED]`

- **What:** `csi.{attacher,provisioner,resizer,snapshotter}ReplicaCount: 1` in `infrastructure/longhorn/longhorn-values.yaml` (commit `beb935c`). The Longhorn driver-deployer updates the existing CSI Deployments when the counts change.
- **Expected:** 12 CSI pods become 4 and some memory is freed.
- **Not yet verified:** the live pod count and a before/after `kubectl -n longhorn-system top pods --sort-by=memory`. Fallback if the Deployments stayed at 3: `kubectl -n longhorn-system rollout restart deploy/longhorn-driver-deployer`.
- **Note:** the owner's phrase "three replicas in Longhorn" was interpreted as these sidecars; the volume replica count was already 1 in Git and is now confirmed 1 on all 7 volumes.

### 4.6 README `[DONE]`

Commit `beb935c`: heartbeat badge (renders correctly on GitHub, confirmed) plus corrections to argocd file names, sync waves, topology and placement table, resource budget, CI section, missing API resources and a broken code fence.

### 4.7 Phase 2b: Alertmanager, Telegram, heartbeat, worker-down alert `[DONE]`

Delivered in several patches, applied by the owner (commits `b458a98` and `6c1cddf`):

| Piece | What it does |
|---|---|
| Infisical identity plumbing | Terraform project "Monitoring" and identity; `InfisicalAuth`, `InfisicalStaticSecret` and a ServiceAccount in `infrastructure/monitoring/alerting/`; extra Argo source on the Prometheus app |
| Operator scope fix | `monitoring` added to `scopedNamespaces` (it had been missed in the first patch; without it the operator never synced and the Alertmanager pod waited for a missing Secret) |
| Secrets pipeline | Owner-built: `secrets.yaml` to playbook 10 to Terraform to Infisical (section 3.6) |
| Worker rules | `WorkerUnreachable`, `WorkerTargetMissing` (section 3.7) |
| Alertmanager | Single replica on master, Telegram receivers, Healthchecks heartbeat, routes, inhibition |
| `sampleLimit` | Lowered to 28000 |

**Validation done before delivery (in Claude's sandbox)**

- promtool unit tests for the worker rules.
- `amtool check-config` and routing tests on the effective merged configuration.
- An end-to-end test with the real Alertmanager v0.32.1 binary and a mock Telegram and Healthchecks server (timers shortened, structure identical), with explicit assertions: normal warnings notify; info alerts are silent; the heartbeat repeats; `WorkerUnreachable` sends exactly one message per outage, no repeats, no "resolved"; a second outage after recovery sends exactly one new message; critical alerts still pass the inhibition.

**Acceptance on the real cluster (2026-10-26)** `VERIFIED` from the owner's output:

- Alertmanager Running 2/2 on master; `alertmanager-secrets` has 3 keys; the Infisical sync reports `SYNCED True`.
- `prometheus_notifications_alertmanagers_discovered = 1`; the worker's `up` is 1; no worker or "not connected" alerts firing; the worker rule group is loaded and evaluating.
- A manual test alert (`TelegramTest`, warning) arrived in the Telegram group: real delivery works.
- Confirmed by the owner on 2026-10-27: the `nasat-watchdog` check is online.

### 4.8 Phase 6a: CI validation `[APPLIED]`

Built by the owner in `.github/workflows/validate.yaml` (2026-10-27/28, commits up to `c002c2f`); reviewed and tuned by Claude. Full explanation, options and decisions: `claude/phase-6a-ci-validation.md`.

| Job | Tool (pinned) | State on `c002c2f` |
|---|---|---|
| YAML lint | yamllint 1.37.1, `.yamllint` (line length 132) | 0 findings (VERIFIED) |
| Ansible lint | ansible-lint 26.10.1, collections from `ansible-k3s/requirements.yml` | 0 failures, profile `production` (VERIFIED). The log the owner pasted (2 `no-changed-when` failures) was from an older commit; `c002c2f` fixed it |
| Kubernetes | kubeconform v0.6.7, Kubernetes 1.35.4, CRD catalog; Helm 3.17.3 render of 4 charts, plus the Longhorn Kustomize app | raw manifests: 135 valid, 3 skipped (VERIFIED); Helm render NOT confirmed |
| Terraform | terraform 1.16.5: fmt, init, validate | fmt clean; init/validate NOT confirmed |
| Gitleaks | gitleaks-action v3, gitleaks 8.30.1 | push runs scan only the pushed commits (0 findings); a manual run scans all branches (32 findings, accepted by the baseline in the patch) |
| Trivy | v0.76.1 config scan | 59 HIGH/CRITICAL: 36 real HIGH (pod `securityContext`, root Dockerfiles) plus 23 noise (vendored Argo CD, a Longhorn patch fragment, Immich) |

Tuning patch (`phase-6a-ci-tuning.patch`): Trivy skips with reasons in `trivy.yaml`, a second Trivy step that fails on CRITICAL, the Trivy action pinned to a commit SHA (its tags were hijacked in March 2026), a `.gitleaksignore` baseline, an actionlint job, `*.yml` restored to the YAML lint, `ansible-core` pinned, and the stale "report-only" step names fixed.

---

## 5. The first real power cut (2026-10-26) and what it taught us

**Timeline (local time; UTC+2)**

| Time | Event |
|---|---|
| about 22:43 | The worker lost power. Alertmanager's log shows DNS lookups for both `hc-ping.com` and `api.telegram.org` failing in the same second, from the cluster DNS, with "server misbehaving" |
| 22:50 | Telegram: `AlertmanagerClusterFailedToSendAlerts` (critical, integration webhook) |
| 22:51 | Telegram: `WorkerUnreachable`, the one wanted message |
| 22:55, 23:05, 23:10 | The same "failed to send" alert updating (webhook and telegram, failure rate decaying, then resolved) |

**What happened**

- **The designed behavior worked:** `WorkerUnreachable` produced exactly one message, no repeats and no "resolved". No cascade warnings arrived.
- **The message was late (about 8 minutes)** because the internet was down at the same time. CoreDNS (alive on master) returned SERVFAIL, which means it could not reach its upstream resolver. The owner confirmed on 2026-10-27 that the internet was briefly lost during the power cut, which matches the DNS failures (`VERIFIED` by the owner).
- **Four of five messages were noise.** `AlertmanagerClusterFailedToSendAlerts` is a built-in alert that came in with `defaultRules.rules.alertmanager: true`. It reports the notification failures of the outage itself, can only fire after connectivity returns, and keeps changing for about 15 minutes while its failure-rate window drains.

**The fix:** `alertmanager-mute-send-failure-alerts.patch` `[APPLIED]` (commit `acd18b7`, 2026-10-27, Argo green). Six lines in `prometheus-values.yaml` route `AlertmanagerFailedToSendAlerts` and `AlertmanagerClusterFailedToSendAlerts` to the `null` receiver. They stay visible in Prometheus.

- Validated with amtool (check-config plus 9 routing cases) and an end-to-end replay of the incident with assertions.
- **Negative control:** the same test fails on the old configuration (11 messages instead of 8), so the test can detect the problem.
- The route is confirmed present on `master`. It will be proven by the next real outage; an optional live check is `amtool config routes --alertmanager.url=http://localhost:9093` inside the Alertmanager pod.

**Trade-offs of the fix**

- If Telegram itself fails while the internet is up (for example a revoked token), nobody is told through Telegram. The heartbeat only covers "no internet or Alertmanager down". This is acceptable for a homelab.
- If the router stays down for more than about 15 minutes, Healthchecks messages the Telegram group on its own. A 7-minute outage stays below that threshold.

**Optional improvement (not applied, untested):** `group_interval: 1m` on the worker route would make Alertmanager retry about 5 minutes sooner after the connection returns.

**A security finding from the same incident:** the pasted log contained the live Telegram bot token, because the Telegram client prints the full API URL (which embeds the token) in error text. Alertmanager redacts the Healthchecks URL but not the Telegram one.

---

## 6. Do next: immediate actions

Do these in order. Each has a check so the step is proven before the next one.

### A1. Apply the mute patch `[DONE]` (pushed in `acd18b7`, Argo green, 2026-10-27)

```bash
git apply alertmanager-mute-send-failure-alerts.patch
git add infrastructure/monitoring/prometheus-values.yaml
git commit -m "alertmanager: do not message Telegram about its own send failures"
git push
kubectl -n argocd annotate application prometheus argocd.argoproj.io/refresh=hard --overwrite
```

Check (after about two minutes): the Alertmanager pod restarted or reloaded without errors, and the configuration contains the new route:

```bash
kubectl -n monitoring get pods -l app.kubernetes.io/name=alertmanager
kubectl -n monitoring exec alertmanager-prometheus-kube-prometheus-alertmanager-0 -c alertmanager -- \
  amtool config routes --alertmanager.url=http://localhost:9093 2>/dev/null | head -20
```

### A2. Rotate the Telegram bot token (security) `[SKIPPED by the owner, 2026-10-27]`

*The owner decided not to rotate it (small learning project); noted as an accepted risk. The steps below stay for later.*

Use the runbook in section 10 (R4). The correct path is **`secrets.yaml`, then playbook 10, then restart Alertmanager**; do not edit the value in the Infisical UI, because Terraform owns it. If the token in the owner's 2026-10-26 14:16 chat message was also a real bot token, revoke that one too.

### A3. Confirm the heartbeat `[DONE]` (owner confirmed `nasat-watchdog` is online)

Open Healthchecks.io: `nasat-watchdog` should be green with a last ping under 3 minutes ago and no gap since Alertmanager started (outside the outage window).

### A4. Answer one diagnostic question `[DONE]` (the internet was briefly lost with the power cut)

Did the router/modem also lose power around 22:43 on 2026-10-26? This confirms or rejects the DNS explanation in section 5.

### A5. Fix `terraform.tfvars.example`

Replace every value with an obvious placeholder (`REPLACE_ME`), delete the stale `bootstrap_client_*` keys, and if the client secret in it was ever live, rotate that machine-identity secret in Infisical. The file is tracked in a public repo since commit `82793db`.

### A6. Close the small open verifications (5 minutes each)

| Item | How |
|---|---|
| Phase 1 functional test | Create a post with an image through the UI |
| VPA recommendations | `kubectl describe vpa -n nasat` (expect idle-load numbers) |
| Longhorn CSI result | `kubectl -n longhorn-system get pods \| grep csi` (expect 4 CSI pods) and `kubectl -n longhorn-system top pods --sort-by=memory` |
| 24-hour series review (the owner asked for a reminder) | In Prometheus: `sort_desc(count by (__name__) ({__name__=~".+"}))` and look for large families |

### A7. Choose the next phase

See the recommended order in section 7.

---

## 7. Roadmap ahead, phase by phase

### 7.0 Recommended order from here `[DECIDE]`

| Step | Phase | Why this position |
|---|---|---|
| 1 | Finish 2b (done, except the optional A5 clean-up) | Noise fix applied; heartbeat and a real outage confirmed |
| 2 | **Phase 6a: CI validation (read-only checks)** `[APPLIED]` | It changes nothing on the cluster, runs in GitHub Actions (respecting "nothing on my PC"), and would have caught the `terraform.tfvars.example` problem and YAML mistakes before they reach Argo. It is a safety net for the riskier phases |
| 3 | 2c: blackbox probes and 1 to 2 SLOs | Small, and teaches SLO thinking |
| 4 | 3: HPA and load test | Needs the SLOs and VPA data |
| 5 | 4: storage consolidation and secrets cleanup | Biggest and most destructive step; do it with CI in place and one maintenance window |
| 6 | 2d: Gotify bridge | Independent; do it when n8n is enabled |
| 7 | 5: NetworkPolicy and Traefik hardening | Do after storage, because it touches every namespace |

The original order was 1, 2, 3, 4, 5, 6. The change is only to pull the non-invasive part of CI forward. The owner decides.

Effort estimates are Claude's, at about 6 hours a day, and assume things go roughly to plan.

---

### 7.1 Phase 6a: CI validation (pulled forward) `[APPLIED]`

**Goal:** every push and pull request is checked automatically in GitHub Actions. Nothing runs on the owner's PC.

**Status (2026-11-19):** the jobs exist and block on failure (Trivy: report plus a CRITICAL gate once the patch is applied); see section 4.8 and `claude/phase-6a-ci-validation.md`. The tuning patch is delivered and waiting for the owner to apply it.

**Done**

- yamllint, kubeconform (raw manifests and rendered charts), Terraform fmt/init/validate, ansible-lint (with pinned collections), Gitleaks, Trivy config scan.
- `continue-on-error` removed once each check was clean.

**Remaining (6a-2, small)**

1. Apply `phase-6a-ci-tuning.patch` (Trivy skips and CRITICAL gate, Trivy action SHA pin, Gitleaks baseline, actionlint job, `*.yml` in the lint glob, ansible-core pin, step names).
2. Confirm the Kubernetes (Helm render) and Terraform (init, validate) jobs are green on GitHub. Claude cannot run them from its sandbox.
3. Trivy backlog: 36 HIGH findings (pod `securityContext`, root Dockerfiles). Scheduled as a separate pod-hardening step, one workload at a time in a throwaway namespace; widen the Trivy gate to HIGH when it reaches zero.
4. Phase 6b: pin the build workflows' actions to SHAs (they hold Docker Hub credentials) and add Dependabot for `github-actions`.
5. Optional: `trivy image` on the built images (a commented-out step already exists in `build-docker-push-bk.yaml`; use the SHA form of the action when enabling it); weekly `schedule:` run; `--kube-version 1.35.4` on the `helm template` calls.

**Acceptance:** a deliberately broken YAML file and a deliberately fake secret both fail their jobs; the main branch passes. (Fake-secret test done in Claude's sandbox: Gitleaks still fails on a new secret with the baseline in place; the Trivy gate fails on an injected wildcard ClusterRole.)

**Risks:** the Helm render in CI is close to, not identical to, Argo's render (the Infisical operator release name differs: `secrets-operator` in CI, `infisical-operator` in Argo); `-ignore-missing-schemas` hides kinds that are missing from the CRD catalog; a cosmetic edit to a line that holds a baselined secret is reported again by Gitleaks (add the new fingerprint to `.gitleaksignore`).

---

### 7.2 Phase 2c: blackbox probes and 1 to 2 SLOs `[TODO]`  (about 3 to 4 hours)

**Goal:** measure what users experience, not just whether pods are running, and learn SLO and burn-rate alerting.

**Steps**

1. Deploy the Prometheus **blackbox exporter** (a small pod, about 20Mi) in `monitoring`, pinned to master so probes keep running when the worker is down.
2. Add `Probe` resources for: the frontend ingress host of the `nasat` app (see `k8s/ingress`), the backend health path (`/admin/login/`), and MinIO's health endpoint.
3. Define one or two SLOs, for example "99% of backend probes succeed over 28 days" and "99% of frontend probes succeed over 28 days". Keep targets modest; the app runs partly on a node with no battery.
4. Write recording rules for the success ratio and **multi-window burn-rate alerts** (fast burn 1h/5m and slow burn 6h/30m), or use a generator such as Sloth or Pyrra if the owner wants to learn one.
5. **Inhibit probe alerts while `WorkerUnreachable` fires** (extend the inhibition rule), otherwise every power cut sends probe alerts too. This is the lesson from section 5.
6. Add a small Grafana dashboard (ConfigMap with the `grafana_dashboard` label, as the existing dashboards use).

**Acceptance:** probes report success; turning the backend off in a throwaway test shows the SLO burning in Grafana; probe alerts route to Telegram and are muted by the worker alert during a real or simulated worker outage.

**Risks:** probes against the worker-hosted app are expected to fail during outages; that is correct, but the SLO will show it. Decide whether the SLO should count worker outages (honest) or exclude them (pretty).

---

### 7.3 Phase 3: HPA and load testing `[TODO]`  (about 6 to 8 hours)

**Goal:** the app scales out under load and back in afterward; learn how autoscaling interacts with requests, probes and a small cluster.

**Prerequisites:** Phase 1 requests in place (done), metrics-server (running), VPA recommendations read (A6), and the SLOs from 2c as the success criterion.

**Steps**

1. **Decide the gunicorn worker count first.** The backend runs one sync worker, so one pod handles one request at a time. Set `GUNICORN_CMD_ARGS` (workers and threads) through the Deployment environment, with no image rebuild. Re-measure memory (it grows per worker) and adjust requests and limits.
2. **Retune requests from data** (VPA recommendations plus the load test), because CPU requests are currently over-reserved (backend request 100m against a p95 of 4.4m). HPA utilization is computed against the request, so a request that is too high prevents scale-out and one that is too low causes thrashing.
3. Create HPAs for backend and frontend (CPU target about 60 to 70%, `minReplicas: 1`, `maxReplicas: 3` to fit a 2-node cluster), with scale-down stabilization (for example 5 minutes) so a short dip does not cause flapping.
4. Add **PodDisruptionBudgets** and `topologySpreadConstraints` or preferred anti-affinity so replicas can use both nodes while staying off the worker when the master has room (the worker is the unreliable one; a preferred, not required, rule keeps scale-out possible).
5. **Load test from inside the cluster** with a throwaway Job (for example `k6` or `hey`) in a throwaway namespace. Nothing runs on the owner's PC. Ramp from low to high, hold, then ramp down.
6. Observe in Grafana: replica count, CPU, latency, error rate and the SLO burn.

**Acceptance:** under load the backend goes from 1 to at least 2 replicas within a few minutes, error rate stays within the SLO, replicas scale back in after the stabilization window; a rollback (`kubectl delete hpa`) returns to the previous state.

**Risks:** postgres connection limits (check `max_connections` against replicas times workers); Django `CONN_MAX_AGE` is unset so each request opens a connection (acceptable at this scale, mention it in the report); a scaled-out pod landing on the worker disappears during a power cut (that is what the HPA and SLO should then show).

---

### 7.4 Phase 4: storage consolidation, Longhorn tuning and secrets cleanup `[TODO]`  (about 8 to 12 hours, one maintenance window)

This is the only phase that deletes data, so it needs the owner's **explicit approval** before the destructive step.

**4a. Longhorn housekeeping (safe, do first)**

1. Remove the unused backup credential (`infrastructure/longhorn/resources/backup-secret.yaml`) from Git, or move it to Infisical when a backup target exists.
2. Remove the nightly `daily-backup` RecurringJob (or give it a real target later). Keep the local `weekly-snapshot`.
3. **Keep volume replicas off the worker by policy**, not luck: disable scheduling on the worker's Longhorn disk or use node tags and a StorageClass `nodeSelector`. Verify with the replica command in section 10.
4. Tuning for a small cluster (evaluate each, measure before and after): keep `defaultReplicaCount: 1`, keep CSI sidecars at 1, review which Longhorn components are needed (the UI can run with one replica on master only), and check the engine-image and instance-manager resource requests.
5. Fix the inert top-level `nodeSelector` in the Longhorn values (not a v1.12.1 chart key; only `longhornUI.nodeSelector` works), so master-only placement of managers is real if desired.

**4b. Move Prometheus and Grafana from `local-path` to Longhorn (destructive)**

1. Record a baseline first (the Prometheus queries from Phase 1 and the top-series list) because the TSDB will be recreated empty.
2. Export anything in Grafana that is not provisioned from ConfigMaps (dashboards are provisioned, so usually nothing).
3. Change `storageSpec` and the Grafana persistence `storageClassName` to a Longhorn class, delete the old PVCs during a window, let Argo recreate them, and confirm the data directories fill.
4. Make **Longhorn the only default StorageClass** (remove the default annotation from `local-path`), so a missing `storageClassName` can never silently create a node-bound volume again.
5. Only after all `local-path` PVCs are gone, add `--disable=local-storage` to the K3s configuration. **Warning:** `ansible-k3s/playbooks/08-k3s-tailscale.yaml` overwrites the whole `/etc/rancher/k3s/config.yaml`, so the setting must go there (or into a `config.yaml.d` drop-in), and K3s actively uninstalls a disabled add-on.

**4c. Secrets cleanup (each item removes a known exposure)**

| Item | Fix |
|---|---|
| Grafana admin password in `prometheus-values.yaml` | Use `grafana.admin.existingSecret` fed by Infisical; **rotate the password** (treat the old one as exposed) |
| MinIO `minioadmin/minioadmin` | Credentials into Infisical (new project or the app project), referenced by env `secretKeyRef` in MinIO and the backend |
| nginx `/media/` has no method restriction | `limit_except GET { deny all; }` (needs a frontend image rebuild) |
| `infisical/redis.yaml` RWO PVC with RollingUpdate | Add `strategy: {type: Recreate}` |

**Acceptance:** `kubectl get pvc -A` shows no `local-path` volumes; Prometheus and Grafana come back healthy with data on Longhorn; the replica command shows no replica on the worker; no plaintext credentials remain in Git (confirmed by the Phase 6a secret scan).

**Risks and rollback:** the PVC deletion loses 7 days of metrics (accepted, baseline recorded first); K3s `--disable=local-storage` can break pods that still use local-path (hence the order); rollback for config changes is `git revert`; data loss cannot be rolled back, which is why this needs explicit approval.

---

### 7.5 Phase 2d: Gotify bridge and alert test `[TODO]`  (about 3 to 5 hours)

**Goal:** keep Gotify useful for app notifications and n8n, and verify whether it can also carry a few alerts to the owner's iPhone.

**Steps**

1. Deploy a bridge such as **alertmanager_gotify_bridge** (a tiny pod) in a namespace that Infisical already watches; its Gotify application token comes from Infisical through an `InfisicalStaticSecret` (add the namespace to `scopedNamespaces` if it is new).
2. Add a **label-matched route** to Alertmanager (for example only alerts labeled `notify = gotify`) to a webhook receiver pointing at the bridge, so Gotify never receives the full alert stream.
3. Fire a test alert with `amtool`.
4. **Test iOS background delivery honestly:** the official Gotify client is Android and keeps a WebSocket open. Behavior of the iPhone app with the screen off is unverified, so the owner should test with the phone locked for 10 to 15 minutes and report whether the alert arrived.
5. If iOS delivery is unreliable, Gotify stays an app-notification channel (n8n) and Telegram remains the alert channel.

**Acceptance:** a labeled test alert appears in Gotify; the iOS background result is recorded in the roadmap as verified or not.

**n8n (parked):** when it is enabled, give it a Longhorn PVC, Infisical-managed credentials, a namespace added to the operator scope, a resource request/limit and a Traefik ingress with the `*.nasat.local` hosts entry.

---

### 7.6 Phase 5: NetworkPolicy and Traefik hardening `[TODO]`  (about 8 to 10 hours)

**Goal:** limit what can talk to what, and reduce the exposure of the ingress.

**Background:** K3s embeds the kube-router network-policy controller, so `NetworkPolicy` objects are enforced without installing a CNI plugin (flannel handles networking; kube-router handles policy).

**Steps**

1. **Test first in a throwaway namespace** with a client pod and a server pod: prove a default-deny policy blocks traffic and an allow policy restores it. Nothing is applied to real namespaces until this is understood.
2. Start with the `nasat` namespace: default-deny ingress and egress, then allow:
   - Traefik (in `kube-system`) to frontend and backend ingress ports.
   - Frontend to backend; backend to postgres (5432) and MinIO (9000).
   - Egress to CoreDNS (UDP/TCP 53) from every pod.
   - Prometheus (in `monitoring`) to scrape ports if the apps expose metrics.
3. Repeat for `nasat-staging`, then `gotify`, then `monitoring` (Prometheus needs to scrape every namespace and the nodes; Alertmanager needs egress to the internet for Telegram and Healthchecks).
4. Leave `kube-system`, `argocd`, `longhorn-system` and `infisical` for last and treat them cautiously: Longhorn and the Infisical operator need cluster-wide access, and a wrong policy there can stop storage or secret sync.
5. **Traefik hardening:** disable or protect the dashboard, add security-header and rate-limit middlewares, keep the entrypoints HTTP-only on the LAN (no public exposure), and review the access log setting.
6. Add the Trivy and kubeconform checks from 6a to guard the new manifests.

**Acceptance:** from a test pod in another namespace, connections to postgres are refused; the app still works through the ingress; Prometheus targets stay up; Alertmanager still reaches Telegram; ArgoCD and Longhorn are unaffected.

**Rollback:** delete the NetworkPolicy objects (traffic reopens immediately).

**Risks:** locking out DNS, Prometheus scraping, Longhorn or the Infisical operator. That is why each namespace is done separately with verification commands.

---

### 7.7 Phase 6b: CI gating and image supply chain `[TODO]`  (about 3 to 4 hours, after 6a has run for a while)

- Make the stable checks required, add Dependabot or Renovate for pinned action SHAs, chart versions and image tags, and add `trivy image` results to the image-build workflows (fail on critical, new vulnerabilities with a fix available).
- Add `cosign` signing only if the owner wants to learn it (optional, low value at this scale).

---

### 7.8 Items classified in the spec

| Decision | Items |
|---|---|
| **Implement** | Trivy in CI, Alertmanager, VPA (recommend-only), HPA after Phase 1, Traefik hardening |
| **Defer** | KEDA, Kubecost/OpenCost, Molecule |
| **Avoid** | Istio (too heavy for two laptops), cluster autoscaler (no cloud), Terratest |

---

## 8. Security backlog

*Awareness list. The owner treats security as low priority for this learning project (2026-10-27); items are kept for reference, not as tasks to chase.*

| # | Item | Severity | Action | Status |
|---|---|---|---|---|
| 1 | Live Telegram bot token pasted in chat (Alertmanager prints it in error logs) | High | Rotate (runbook R4); redact logs (R6) | accepted by owner 2026-10-27 (not rotating) |
| 2 | A second, different token-shaped value, the group chat id and the Healthchecks ping URL were pasted in chat on 2026-10-26 14:16 | Medium | If that token was a real bot, revoke it; the ping URL lets anyone fake heartbeats (low impact; create a new check to replace it if desired) | accepted by owner 2026-10-27 |
| 3 | `terraform.tfvars.example` tracked in a public repo with token-shaped values | Medium | Replace with placeholders; rotate the client secret if it was ever live | pending |
| 4 | Grafana admin password in plaintext in Git | High | Phase 4c; rotate | pending |
| 5 | MinIO root credentials `minioadmin/minioadmin` in Git; `/media/` forwarded without method restriction | High (LAN only) | Phase 4c | pending |
| 6 | Terraform state holds the Monitoring secret values (local state, gitignored) | Low | Keep the state file private; never commit; consider an encrypted backend later | accepted |
| 7 | Single replica, no backups, master is a single point of failure for all data | High (by design) | Owner decision: no backups for now; revisit if the data becomes valuable | accepted |
| 8 | No NetworkPolicy; any pod can reach postgres | Medium | Phase 5 | pending |
| 9 | CI scanning (config, secrets) | Medium | Phase 6a built; image scanning in 6b | partly done |
| 10 | Telegram messages use HTML parse mode; an alert text with `<` could be rejected (HTTP 400) | Low | Watch real alerts; switch parse mode or escape if it happens | watching |
| 11 | Git history holds credential-looking values (a deleted `terraform.tfstate.backup`, `terraform.tfvars.example`, old Grafana password revisions); 32 Gitleaks findings across all branches, accepted by a baseline | Low (awareness) | None planned; see items 3 and 4 | accepted |

---

## 9. Verification debt and open questions

**Unverified claims (do not treat as facts yet)**

| Claim | How to verify |
|---|---|
| The `nasat-watchdog` check is online | **Confirmed by the owner 2026-10-27** |
| The internet was lost during the 2026-10-26 power cut (the DNS-failure explanation) | **Confirmed by the owner 2026-10-27** |
| Longhorn CSI sidecars are now 4 pods and memory dropped | Section 6, A6 |
| Alertmanager re-reads the bot-token file without a restart | Not verified; restart is the safe path |
| Gotify works on the iPhone with the screen off | Phase 2d test |
| The mute patch behaves on the real cluster | Applied in `acd18b7`; proven by the next real outage (optional: `amtool config routes` in the Alertmanager pod) |
| The cause of the 2026-10-19 restart bursts | Unknown; the worker causing the master burst was never proven |
| Phase 1 end-to-end app test | A6 |
| The Kubernetes (Helm render) and Terraform (init, validate) jobs in `validate.yaml` are green | Owner: open the latest run on GitHub, or paste the two job logs |
| The tuning patch's Trivy and actionlint steps run on a real runner | Apply the patch and open the run |

**Open questions for the owner**

1. *(answered 2026-10-27)* The mute patch is applied (`acd18b7`); the owner chose not to rotate the token; the internet was briefly lost with the power cut.
3. Is the `terraform.tfvars.example` client secret, or any value in it, ever live?
4. Which next phase after 2b is finished (recommended: 6a, then 2c)?
5. Should the SLO count worker outages (honest) or exclude them (pretty)?
6. How are the worker's long outages handled, if the owner wants to be told sooner than the Healthchecks 15-minute threshold? (An option is to shorten the check's grace period; a shorter grace means more false alarms during short router reboots.)

---

## 10. Runbooks

### R1. Apply a patch from Claude

```bash
cd <repo>                       # on the PC, in the WSL checkout
git apply --check <patch>       # dry run; stop if it fails
git apply <patch>
git add -A && git commit -m "<message>" && git push
kubectl -n argocd annotate application <app> argocd.argoproj.io/refresh=hard --overwrite
kubectl -n argocd get applications          # wait for Synced and Healthy
```

### R2. Check Alertmanager health

```bash
kubectl -n monitoring get pods -l app.kubernetes.io/name=alertmanager -o wide
kubectl -n monitoring get secret alertmanager-secrets -o go-template='{{range $k,$v := .data}}{{$k}}{{"\n"}}{{end}}'   # key names only
kubectl -n monitoring get infisicalstaticsecrets
# errors since start (redacted, see R6); empty output is good
kubectl -n monitoring logs alertmanager-prometheus-kube-prometheus-alertmanager-0 -c alertmanager \
  | sed -E 's#bot[0-9]+:[A-Za-z0-9_-]+#bot<redacted>#g' | grep -iE "level=(error|warn)" | grep -v repeat_interval | tail -20
```

In the Prometheus UI:

- `prometheus_notifications_alertmanagers_discovered` should return `1`
- `up{job="node-exporter",instance="192.168.10.20:9100"}` should return `1`
- `prometheus_rule_group_last_evaluation_timestamp_seconds{rule_group=~".*nasat-worker.*"}` should return one series

### R3. Send a safe test alert to Telegram

```bash
kubectl -n monitoring exec alertmanager-prometheus-kube-prometheus-alertmanager-0 -c alertmanager -- \
  amtool alert add TelegramTest severity=warning namespace=test \
  --annotation=summary="Telegram path test" \
  --annotation=description="Manual test, safe to ignore" \
  --end=$(date -u -d '+5 minutes' +%Y-%m-%dT%H:%M:%SZ) \
  --alertmanager.url=http://localhost:9093
```

Expect a "Firing" message in about 30 seconds and a "Resolved" message a few minutes after the 5-minute window ends. If nothing arrives, check R2 and the WSL clock (the end time comes from it). The `amtool` parser prints harmless warnings about label syntax.

### R4. Rotate the Telegram bot token

1. In Telegram, message **@BotFather**, send `/revoke`, and choose the alert bot. The old token stops working immediately, so notifications fail until step 4 completes (the Healthchecks heartbeat is unaffected).
2. Edit `TELEGRAM_BOT_TOKEN` in `ansible-k3s/kubeconfig/secrets.yaml` on the PC (gitignored). Type it there; do not paste it in chat.
3. Re-run playbook 10 the way you normally do. Terraform updates the Infisical secret in place; the operator syncs within about a minute.
4. Restart Alertmanager so it loads the new token:
   ```bash
   kubectl -n monitoring rollout restart statefulset alertmanager-prometheus-kube-prometheus-alertmanager
   ```
5. Verify with R2 (secret has 3 keys, pod Running 2/2) and R3 (a test message arrives).
6. If the same token was ever stored elsewhere (notes, shell history), clean it up.

The same flow (edit `secrets.yaml`, re-run playbook 10, restart Alertmanager) applies to `TELEGRAM_CHAT_ID` and `HEALTHCHECKS_PING_URL`. The chat id must be the **group** id (a negative number), and the bot must be a member of the group.

### R5. What to expect when the worker loses power

1. About 1.5 to 2 minutes later `WorkerUnreachable` fires; the Telegram message may be delayed if the internet is also down.
2. Exactly one message; no repeats; no "resolved" message.
3. While it is down: backend and frontend are unavailable if they ran on the worker (the app is down); postgres and MinIO are unaffected (master); staging's postgres cannot be rescheduled until the worker returns.
4. When it returns: wait for node-exporter and pods to recover, then check `kubectl get pods -A -o wide` and `up{job="node-exporter"}`. Warnings stay muted for 10 more minutes (`keep_firing_for`).
5. If it does not come back, check power first, then the node's K3s agent (`journalctl -u k3s-agent`).

### R6. Redact before pasting logs

```bash
... | sed -E 's#bot[0-9]+:[A-Za-z0-9_-]+#bot<redacted>#g'
```

Also remove chat ids and Healthchecks URLs. If a secret was pasted anyway, rotate it (R4 for the Telegram token).

### R7. Verify where Longhorn replicas live

```bash
kubectl -n nasat get pvc -o custom-columns=NAME:.metadata.name,CLASS:.spec.storageClassName,VOLUME:.spec.volumeName
kubectl -n longhorn-system get volumes.longhorn.io -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.numberOfReplicas,NODE:.status.currentNodeID,STATE:.status.state,ROBUST:.status.robustness
kubectl -n longhorn-system get replicas.longhorn.io -o custom-columns=NAME:.metadata.name,VOL:.spec.volumeName,NODE:.spec.nodeID
```

Every replica should be on `master`.

### R8. Add a namespace that uses Infisical secrets

1. Add the namespace to `scopedNamespaces` in `infrastructure/infisical-operator/values.yaml`.
2. Add it to `app_namespaces` in playbook 10 so it exists before Terraform creates the identity Secret.
3. Add a Terraform file modeled on `terraform/infisical/monitoring.tf` (project, identity, Kubernetes auth with `allowed_namespaces` and `allowed_service_account_names`, viewer role, identity Secret).
4. Add the `InfisicalAuth`, `InfisicalStaticSecret` and ServiceAccount manifests (see `infrastructure/monitoring/alerting/`).

---

## 11. Decision log

| Date | Decision | By |
|---|---|---|
| 2026-10-19 to 2026-10-23 | Early requests: backups out of scope; master branch only; Immich off; the worker has no battery and loses power often (the owner believes this explains the restarts and failures) | Owner |
| 2026-10-19 | No Docker or experiments on the owner's PC; CI and throwaway namespaces only | Owner |
| 2026-10-22 | Add VPA in recommend-only mode | Owner and Claude |
| 2026-10-23 | Telegram is the primary alert channel; Gotify for app notifications | Owner |
| 2026-10-24 | Worker-down alert: one message per outage, node-exporter detection, no new probe, no "resolved" | Owner |
| 2026-10-24 | Cut Longhorn sidecars from 3 to 1 replica to save resources | Owner |
| 2026-10-25 | No null route for `nasat-staging` | Owner |
| 2026-10-25 | Pin postgres and MinIO to master for `nasat` only | Owner |
| 2026-10-25 | Terraform runs through playbook 10 | Owner |
| 2026-10-26 | Secrets for Alertmanager are provisioned by Ansible and Terraform from `secrets.yaml`, never typed by hand | Owner (implemented in `6c1cddf`) |
| 2026-10-26 | After the first real outage: only one worker-down message wanted; mute the "failed to send" meta-alerts | Owner and Claude |
| 2026-10-27 | Comprehensive roadmap document requested; recommended order puts CI validation (6a) before further changes | Owner / Claude (proposal) |
| 2026-10-27 | Telegram bot token will **not** be rotated (small home learning project); security issues are to be mentioned briefly for awareness and never insisted on | Owner |
| 2026-10-27 | Mute patch applied (`acd18b7`); internet loss during the power cut confirmed; `nasat-watchdog` confirmed online | Owner |
| 2026-10-27/28 | Owner built the CI pipeline (`validate.yaml`) and removed `continue-on-error` from the jobs as they became clean; Trivy stayed report-only (`exit-code: 0`) | Owner |
| 2026-11-19 | Phase 6a tuning delivered: Trivy gates on CRITICAL only (HIGH stays a report until the hardening backlog is fixed); Trivy action pinned by SHA; Gitleaks baseline instead of a path allowlist; `.ansible-lint` and a yamllint compat change deliberately not added | Claude (proposal) |

---

## 12. Mistakes and corrections (for honesty and learning)

| When | Mistake | Correction and lesson |
|---|---|---|
| Phase 2a | Guessed `sampleLimit: 20000`; the real series count was 32586, so the whole API-server scrape failed | Measure first, then set limits; a limit is all-or-nothing |
| Phase 2a | Early validation errors (an inert `kubeScheduler` key; a dropped histogram bucket that another rule needed) | Validate rule dependencies against the chart's own rules |
| Phase 2b-1 | Forgot that the Infisical operator only watches listed namespaces, so `monitoring` never synced | Added to `scopedNamespaces`; check operator scope for every new namespace (runbook R8) |
| Phase 2b | First end-to-end run looked inconclusive: a leftover Alertmanager process held the port, so the test hit an old instance | Always check for stale processes; added a negative control and explicit assertions to the test harness |
| Phase 2b-2 | Enabled the built-in `alertmanager` rule group without anticipating its failure-rate alert on a flaky network | Review each default alert against the real failure mode; tune after every real incident |
| 2026-10-26 | After my session hit its limit, my unfinished Terraform-secrets edits were never delivered | The owner built it independently (`6c1cddf`); my obsolete scratch commit is unused |
| 2026-10-26 | On the last turn I said rotation was "manual in the Infisical UI" and that the Terraform-managed secrets were unfinished. That was wrong: I had not fetched `origin/master` since `b458a98` and missed `6c1cddf` | Corrected in this document: **rotate through `secrets.yaml` and playbook 10** (R4). Lesson: fetch the repo before claiming what is or is not implemented |
| Throughout | Claude cannot render Helm, run Terraform or reach most sites from its sandbox | Charts are validated by reading source and values; Argo's first sync is the real test; Phase 6a now adds that validation in CI (its Helm and Terraform results still have to be read by the owner) |
| 2026-10-27 | Started tuning the CI pipeline against `dd73ec9` while the owner was already fixing the same findings on `master` | Dropped my patch, fetched, and rebuilt on `c002c2f`. Lesson: fetch `origin/master` before every patch and again before delivering it |
| 2026-10-27 | Reported 10 Gitleaks findings as the history count; that was a scan of the current files only (history: 28 on master, 32 across all branches) | Corrected in the Phase 6a write-up. Lesson: say which scope a scan covers |

---

## 13. Appendices

### 13.1 Commit timeline on `master`

| Date | Commit | Message | Phase |
|---|---|---|---|
| 2026-10-22 | `82793db` | adding vpa | 1b |
| 2026-10-23 | `4fcfbcd` | monitoring: scrape API server, enable core alert rules | 2a |
| 2026-10-24 | `fdf53c8` | samplelimit raises the limit to 50000 | 2a |
| 2026-10-24 | `de81799` | trim histograms | 2a |
| 2026-10-24 | `beb935c` | one replica for longhorn, update Readme with healthcheck badge | CSI and README |
| 2026-10-25 | `b458a98` | enabling monitoring Alertmanager | 2b (with the pin and operator scope) |
| 2026-10-26 | `6c1cddf` | secrets for telegram got into Infisical | 2b secrets pipeline |

### 13.2 Patches delivered by Claude

| Patch | Purpose | State |
|---|---|---|
| `phase1-resources.patch` | requests and limits | applied |
| `vpa-phase1b.patch` | VPA | applied |
| `phase2a-apiserver-rules.patch`, `phase2a-fix-samplelimit.patch`, `phase2a-trim-histograms.patch` | Phase 2a | applied |
| `longhorn-csi-single-replica.patch`, `readme-badge-and-fixes.patch` | CSI and README | applied |
| `pin-postgres-minio-to-master.patch` | pin to master | applied |
| `phase2b-1-secrets-and-worker-rule.patch`, `phase2b-2-alertmanager.patch` | Phase 2b | applied |
| `operator-watch-monitoring.patch` | operator scope | applied |
| `alertmanager-mute-send-failure-alerts.patch` | mute the "failed to send" meta-alerts | applied (`acd18b7`) |
| `phase-6a-ci-tuning.patch` | Trivy skips and CRITICAL gate, Trivy action SHA pin, Gitleaks baseline, actionlint, lint scope and step names | delivered 2026-11-19, not yet applied |

### 13.3 Useful PromQL

```
# worker reachable (expect 1)
up{job="node-exporter",instance="192.168.10.20:9100"}

# reboots in the last 7 days per node
changes(node_boot_time_seconds[7d])

# Alertmanager notification health
sum by (integration) (rate(alertmanager_notifications_failed_total[15m]))
sum by (integration) (rate(alertmanager_notifications_total[15m]))

# Prometheus memory and scrape size
container_memory_working_set_bytes{namespace="monitoring",pod=~"prometheus-prometheus.*",container="prometheus"}
scrape_samples_post_metric_relabeling{job="apiserver"}

# largest metric families (cardinality review)
topk(15, count by (__name__) ({__name__=~".+"}))
```

### 13.4 How a worker outage flows through the alerting design

```
worker loses power
  -> node-exporter target on the worker stops answering (scrape interval 40s)
  -> rule WorkerUnreachable: up == 0 for 1m  (evaluated every 30s)  -> alert FIRING
  -> Alertmanager: matches route "telegram-once", group_wait 0s -> ONE Telegram message
  -> inhibition: all warning-severity alerts muted while it fires (and for 10m after, keep_firing_for)
  -> repeat_interval 8760h and send_resolved false -> no repeats, no "resolved" message
  -> worker returns -> alert resolves after keep_firing_for -> a later outage is a new notification

in parallel:
  Watchdog (always firing) -> webhook ping to Healthchecks about every 2 minutes
  -> if pings stop for more than 15 minutes, Healthchecks messages the Telegram group itself
```

### 13.5 Glossary

| Term | Meaning |
|---|---|
| Argo CD sync wave | Ordering of resources during a sync (lower numbers first) |
| HPA / VPA | Horizontal / Vertical Pod Autoscaler |
| QoS Burstable | A pod with requests lower than limits |
| `keep_firing_for` | Prometheus rule option that keeps an alert firing for a period after its condition clears |
| Inhibition | An Alertmanager rule that mutes some alerts while another is firing |
| `null` receiver | An Alertmanager receiver that discards notifications (the alert still exists in Prometheus) |
| Dead man's switch / heartbeat | An always-firing alert whose absence means the alerting pipeline or the site is down |
| SLO / burn rate | A reliability target and how fast the error budget is being consumed |
| InfisicalStaticSecret | Operator resource that copies Infisical secrets into a Kubernetes Secret |
| `scopedNamespaces` | The list of namespaces the Infisical operator is allowed to watch |
