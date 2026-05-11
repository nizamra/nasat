# Architecture & Design Decisions

This document explains the architectural decisions, patterns, and reasoning behind the playground stack.

## Table of Contents

1. [Overall Architecture](#overall-architecture)
2. [Design Patterns](#design-patterns)
3. [Scheduling Strategy](#scheduling-strategy)
4. [Storage Architecture](#storage-architecture)
5. [Networking Strategy](#networking-strategy)
6. [Deployment Patterns](#deployment-patterns)
7. [Application Selection](#application-selection)
8. [Resource Optimization](#resource-optimization)

---

## Overall Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│      User Access Layer                  │
│  (Browser → DNS → Ingress)              │
└────────────────┬────────────────────────┘
                 │
┌─────────────────┴────────────────────────┐
│      Control Plane                      │
│  (ArgoCD watching git repo)             │
└────────────────┬────────────────────────┘
                 │
┌─────────────────┴────────────────────────┐
│    Routing & Load Balancing Layer       │
│  (Traefik Ingress Controller)           │
└────────────────┬────────────────────────┘
                 │
┌─────────────────┴────────────────────────┐
│    Application Pods Layer               │
│  (Running on worker nodes)              │
│  - n8n, Jellyfin, etc.                  │
└────────────────┬────────────────────────┘
                 │
┌─────────────────┴────────────────────────┐
│    Storage & Persistence Layer          │
│  (PVCs → local-path storage class)      │
└─────────────────────────────────────────┘
```

### Components & Responsibilities

| Component | Purpose | Location |
|---|---|---|
| **ArgoCD** | GitOps orchestration | `argocd-namespace` (external to playground) |
| **Traefik** | HTTP routing & ingress | `kube-system` (included in K3s) |
| **Applications** | Business logic | `linkding`, `n8n`, `homepage`, `jellyfin`, `freshrss` namespaces |
| **Storage** | Data persistence | Worker nodes (local-path storage class) |
| **Kustomize** | Config templating | Git repository (`k8s-playground/`) |

---

## Design Patterns

### 1. GitOps Pattern (App-of-Apps)

**Problem**: Managing multiple applications through manual kubectl commands is error-prone and hard to version control.

**Solution**: Use Argo CD with kustomize overlays to define the entire stack as code.

**Implementation**:
- Single ArgoCD Application (`argocd/playground.yaml`) watches `k8s-playground` directory
- Each app has its own namespace and kustomization
- Root `k8s-playground/kustomization.yaml` aggregates all apps
- Git is the source of truth

**Benefits**:
- Declarative infrastructure
- Version control for all changes
- Automatic rollback capabilities
- Team visibility and audit trail

**Trade-offs**:
- Requires understanding of GitOps workflows
- Slightly higher learning curve for operators

### 2. Namespace Isolation Pattern

**Problem**: Multiple applications sharing a cluster need isolation for security, resource management, and debugging.

**Solution**: Each application runs in its own Kubernetes namespace.

**Implementation**:
```yaml
# Each app has its own namespace
apiVersion: v1
kind: Namespace
metadata:
  name: n8n
  labels:
    app: n8n
    environment: playground
```

**Benefits**:
- **Resource Boundaries**: RBAC, network policies per namespace
- **Deployment Independence**: Apps can be deployed/destroyed independently
- **Debugging**: Easy to filter logs/pods per app
- **Multi-tenancy**: Easy to extend to multiple environments

**Trade-offs**:
- Cross-namespace communication slightly more complex (DNS: `svc.namespace.svc.cluster.local`)
- More Kubernetes objects to manage

### 3. Infrastructure-as-Code (IaC) Pattern

**Problem**: Manual configuration is hard to reproduce and maintain.

**Solution**: All infrastructure defined in YAML manifests using Kustomize for DRY principle.

**Implementation**:
- Base manifests in each app directory
- Kustomization.yaml for common labels/annotations
- Strategic merge patches for overlays (could be extended)

**Benefits**:
- Reproducible deployments
- Easy testing and staging
- Code review before production changes
- Disaster recovery via git history

**Trade-offs**:
- YAML complexity can be daunting
- Requires discipline to keep manifests clean

### 4. Health Check Pattern

**Problem**: Applications can start but be unhealthy, or take time to initialize.

**Solution**: Multi-phase health checking strategy.

**Implementation**:
```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        startupProbe:        # Long grace period for initialization
          httpGet:
            path: /healthz
            port: 3000
          failureThreshold: 30
          periodSeconds: 10
        
        livenessProbe:       # Restart if unhealthy
          httpGet:
            path: /healthz
            port: 3000
          periodSeconds: 30
        
        readinessProbe:      # Don't send traffic if not ready
          httpGet:
            path: /healthz
            port: 3000
          periodSeconds: 10
```

**Benefits**:
- Automatic pod recovery
- No traffic to unhealthy pods
- Better application reliability

**Trade-offs**:
- Requires apps to expose health endpoints
- Can cause thrashing if probes are too aggressive

### 5. Resource Limits Pattern

**Problem**: Without limits, one misbehaving app can crash the entire cluster (noisy neighbor problem).

**Solution**: Define requests (guaranteed) and limits (maximum) for all apps.

**Implementation**:
```yaml
resources:
  requests:
    cpu: 100m      # Guaranteed allocation
    memory: 256Mi
  limits:
    cpu: 500m      # Maximum allocation
    memory: 512Mi
```

**Benefits**:
- Prevents resource starvation
- Better predictability
- Graceful degradation under load

**Trade-offs**:
- Requires accurate tuning per app
- May need adjustment over time

---

## Scheduling Strategy

### Why Worker Node Isolation?

**Architectural Decision**: All playground workloads run ONLY on worker nodes, not control-plane.

**Reasoning**:

1. **Fault Isolation**: A misbehaving app can't crash the API server
2. **Performance**: System services get dedicated control-plane resources
3. **Scalability**: Easier to add/remove workers without cluster stability concerns
4. **Resource Predictability**: Control-plane doesn't compete with user workloads

### Implementation

**NodeSelector Method** (Current):

```yaml
spec:
  template:
    spec:
      nodeSelector:
        node-role.kubernetes.io/worker: worker
```

**Advantages**:
- Simple, easy to verify
- No complex affinity rules
- Works with any number of worker nodes

**Disadvantages**:
- Less flexible for advanced scheduling
- All workers treated equally

### Migration Path to Advanced Scheduling

For future scaling, consider these patterns:

**Option 1: Node Affinity** (Prefer high-memory nodes)
```yaml
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      preference:
        matchExpressions:
        - key: workload-type
          operator: In
          values:
          - high-memory
```

**Option 2: Taints & Tolerations** (Strict isolation)
```bash
# Taint worker-1 for Jellyfin only
kubectl taint nodes worker-1 app=jellyfin:NoSchedule
```

```yaml
tolerations:
- key: app
  operator: Equal
  value: jellyfin
  effect: NoSchedule
```

**Option 3: Pod Priority & Preemption** (Ensure critical apps run)
```yaml
priorityClassName: playground-critical
```

---

## Storage Architecture

### Current Strategy: Local-Path Storage

**Implementation**: Uses K3s default storage class (local-path)

**Why This Choice**:
- **Simplicity**: No external NFS, storage clusters, or complex setup
- **Cost-Effective**: Uses existing node storage
- **Suitable for Homelab**: Acceptable for single-node or small clusters
- **K3s Native**: Included by default, requires no additional installation

### Storage Classes Available

```bash
# View available storage classes
kubectl get storageclass
```

For K3s:
- `local-path` - Local node storage (default)
- Could integrate with NFS, Ceph, or other backends

### PVC Design per Application

| App | Purpose | Size | Reclaim Policy | Notes |
|---|---|---|---|---|
| **Linkding** | SQLite DB | 1Gi | Retain | Small data, daily backups sufficient |
| **n8n** | Workflows, executions | 5Gi | Retain | Growing with executions |
| **Homepage** | Config, cache | 1Gi | Retain | Static content |
| **Jellyfin** | Config | 5Gi | Retain | Metadata database |
| **Jellyfin** | Media | 100Gi | Retain | Primary storage - adjust for your library |
| **FreshRSS** | Feeds, DB | 5Gi | Retain | Growing with feeds |

### Storage Expansion

For Jellyfin media to grow beyond 100Gi:

**Option 1: Increase PVC Size**
```bash
kubectl patch pvc jellyfin-media -n jellyfin -p \
  '{"spec":{"resources":{"requests":{"storage":"500Gi"}}}}'
```

**Option 2: NFS Backend** (Advanced)
```bash
# Point local-path provisioner to NFS mount
# Edit /etc/rancher/k3s/k3s.yaml
# Set --local-path to NFS mounted directory
```

### Data Protection Strategy

**Backup**:
```bash
# Simple tar backup
kubectl exec -it jellyfin-xxx -n jellyfin -- \
  tar czf - /media | gzip > jellyfin-backup.tar.gz

# Or use Velero
velero backup create playground-backup \
  --include-namespaces 'linkding,n8n,homepage,jellyfin,freshrss'
```

**Disaster Recovery**:
- Entire infrastructure is code (git)
- PVCs must be backed up separately
- Consider 3-2-1 backup rule: 3 copies, 2 different media, 1 offsite

---

## Networking Strategy

### Ingress Architecture

```
Internet/LAN
    │
    └──► DNS (nasat.local)
         │
         └──► Traefik Ingress Controller
              │
    ┌─────────┼─────────┬──────────┬──────────┐
    │         │         │          │          │
   n8n    Homepage  Jellyfin   FreshRSS   Linkding
  svc:80  svc:80    svc:80     svc:80    svc:80
```

### Domain Resolution

**Current Setup**: Use local DNS (nasat.local)

```
bookmarks.nasat.local       → Linkding (existing)
n8n.nasat.local           → n8n
homepage.nasat.local      → Homepage
jellyfin.nasat.local      → Jellyfin
freshrss.nasat.local      → FreshRSS
```

**DNS Methods**:

1. **Local /etc/hosts** (single machine):
   ```
   192.168.1.100  n8n.nasat.local homepage.nasat.local ...
   ```

2. **Wildcard DNS** (dnsmasq/Pi-hole):
   ```
   address=/nasat.local/192.168.1.100
   address=/nasat.local/192.168.1.100
   ```

3. **External DNS** (advanced):
   ```bash
   # Install external-dns to auto-update DNS records
   # from ingress manifests
   ```

### Traefik Configuration

Traefik is configured via:
- Ingress resources (current method)
- IngressRoute CRDs (alternative)
- ConfigMap (global settings)

**Current Ingress Manifest Pattern**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: n8n-ingress
  namespace: n8n
spec:
  ingressClassName: traefik
  rules:
  - host: n8n.nasat.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: n8n
            port:
              number: 80
```

### HTTPS/TLS Strategy

**Current**: HTTP only (suitable for homelab/local network)

**Future Enhancement**: Add cert-manager for HTTPS

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/.../bundle.yaml

# Create issuer for self-signed certs
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
EOF
```

Then update ingress:
```yaml
spec:
  tls:
  - hosts:
    - n8n.nasat.local
    secretName: n8n-tls
  rules:
  - host: n8n.nasat.local
```

---

## Deployment Patterns

### Deployment vs. StatefulSet

**Decision**: Use Deployments for all apps (no StatefulSets)

**Reasoning**:
- Playground apps are mostly stateless (state in PVCs)
- Simpler scaling and updates
- Suitable for single-replica homelab setup
- StatefulSets add complexity for limited benefit here

**If Changing to StatefulSets** (future):
- n8n, Jellyfin, FreshRSS could become StatefulSets for better ordering guarantees
- Would require ordered startup/shutdown
- Persistent hostnames useful for integrations

### Replica Strategy

**Current**: Single replica per app (replicas: 1)

**Reasoning**:
- PVCs are ReadWriteOnce (can't be shared between replicas)
- Homelab typically has limited hardware
- Stateful apps need coordination for multi-replica

**If Scaling Up** (multiple workers):
- Homepage, FreshRSS could scale to 3+ replicas
- Requires persistent session storage (Redis)
- Load balancing would need session affinity

### Update Strategy

**Current**: Recreate strategy for stateful apps
```yaml
strategy:
  type: Recreate
```

**Alternative**: RollingUpdate for stateless apps
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

---

## Application Selection

### Why These Five Apps?

| App | Purpose | Category | Selection Rationale |
|---|---|---|---|
| **Linkding** | Bookmarks | Productivity | Lightweight, self-hosted bookmark manager. Already in existing setup. |
| **n8n** | Automation | Orchestration | FOSS workflow automation. Similar to Zapier/Make. Self-hosted. |
| **Homepage** | Dashboard | UI/UX | Aggregates links to all services. Good entry point to stack. |
| **Jellyfin** | Media Server | Entertainment | FOSS media server. Alternative to Plex/Emby. Self-contained. |
| **FreshRSS** | RSS Reader | Productivity | FOSS feed aggregator. Useful for knowledge workers. Lightweight. |

### Alternative Application Recommendations

**If Adding More Apps**:

- **Monitoring**: Prometheus + Grafana
- **Logging**: Loki + Promtail
- **Git**: Gitea or Gitlab
- **CI/CD**: Drone CI
- **Docs**: Wiki.js or MkDocs
- **Chat**: Mattermost or Rocket.Chat
- **Email**: Mailcow
- **Database UI**: pgAdmin

All follow the same pattern:
```
apps/
├── newapp/
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── pvc.yaml (if needed)
│   ├── configmap.yaml (if needed)
│   ├── ingress.yaml
│   └── kustomization.yaml
```

---

## Resource Optimization

### Memory Optimization Strategy

Total memory for full stack at idle: ~1.5Gi
- Linkding: 256Mi limit
- n8n: 1Gi limit
- Homepage: 256Mi limit
- Jellyfin: 2Gi limit (can transcoding spike to 4Gi+)
- FreshRSS: 512Mi limit

**Optimization Techniques**:

1. **Alpine-based images** (where available)
2. **Reduced replicas** (1 per app)
3. **EmptyDir for temp storage** (doesn't count against node storage)
4. **QoS Classes** (Burstable - can exceed requests under pressure)

### CPU Optimization Strategy

Most playground apps are I/O bound (networking, storage), not CPU bound.

**Except**: Jellyfin transcoding can be very CPU intensive

**Tuning**:
```yaml
# For Jellyfin with hardware acceleration
env:
- name: JELLYFIN_FFmpeg__HardwareAcceleration
  value: "vaapi"  # or qsv, nvenc depending on GPU

# Resource limits for transcoding
resources:
  limits:
    cpu: 4000m  # Full quad-core CPU
```

### Network Optimization

**Current**: All traffic goes through Traefik ingress

**Optimization**: Could add network policies to restrict inter-pod traffic:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: n8n
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: traefik  # Only allow from ingress
    ports:
    - port: 5678
```

---

## Monitoring & Observability Strategy

### Current State

Minimal monitoring built-in. Applications have prometheus scrape annotations but no scraper configured.

### Adding Observability

**Step 1**: Install Prometheus Operator
```bash
kubectl apply -f https://github.com/prometheus-operator/prometheus-operator/releases/.../bundle.yaml
```

**Step 2**: Create ServiceMonitor resources
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: n8n-monitor
  namespace: n8n
spec:
  selector:
    matchLabels:
      app: n8n
  endpoints:
  - port: metrics
    interval: 30s
```

**Step 3**: Install Grafana and import dashboards

---

## Conclusion

This architecture balances:
- **Simplicity** for homelab deployment
- **Production-readiness** for reliability
- **Extensibility** for future growth
- **Efficiency** for resource-constrained environments

Each design decision includes documented rationale and migration paths for future changes.

---

**Document Version**: 1.0
**Last Updated**: 2024
**Maintained By**: Platform Engineering Team
