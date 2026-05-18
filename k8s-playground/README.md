# Playground Stack - GitOps Infrastructure

A comprehensive, production-grade but lightweight homelab playground stack using Kubernetes, Argo CD, and Traefik ingress.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Applications](#applications)
- [Prerequisites](#prerequisites)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Worker Node Scheduling](#worker-node-scheduling)
- [Storage](#storage)
- [Networking & Ingress](#networking--ingress)
- [Verification & Troubleshooting](#verification--troubleshooting)
- [Adding New Applications](#adding-new-applications)
- [Scaling & Performance](#scaling--performance)
- [Security Considerations](#security-considerations)

---

## Overview

This playground stack provides a complete self-hosted environment for running containerized applications on a K3s Kubernetes cluster. It leverages:

- **Argo CD** for GitOps-based continuous deployment
- **Traefik** for ingress and routing
- **Kustomize** for templating and overlay management
- **Persistent Volumes** for data persistence
- **Worker Node Scheduling** to keep control-plane clean

The stack is designed to be:
- **Isolated**: Separate namespaces and configurations per application
- **Scalable**: Easy to add new applications following the same pattern
- **Resilient**: Health checks, resource limits, and proper shutdown handling
- **Observable**: Prepared for monitoring and logging integration
- **Production-grade**: Best practices for Kubernetes manifests

---

## Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        ArgoCD                               │
│  (watches github.com/nizamra/nasat:k8s-playground)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │ Traefik    │ │ Kustomize  │ │ Worker     │
    │ (Ingress)  │ │ (Overlays) │ │ Nodes      │
    └────────────┘ └────────────┘ └────────────┘
        │              │
        ▼              ▼
    ┌──────────────────────────────────────┐
    │  Playground Applications             │
    │                                      │
    │  ├─ Linkding (Bookmarks)             │
    │  ├─ n8n (Automation)                 │
    │  ├─ Homepage (Dashboard)             │
    │  ├─ Jellyfin (Media Server)          │
    │  └─ FreshRSS (RSS Reader)            │
    │                                      │
    │  Each with:                          │
    │  ├─ Namespace isolation              │
    │  ├─ StatefulSet/Deployment           │
    │  ├─ PersistentVolumes                │
    │  ├─ Services & Ingress               │
    │  └─ ConfigMaps & Secrets             │
    └──────────────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────┐
    │    Persistent Storage        │
    │  (local-path / default SC)   │
    └──────────────────────────────┘
```

### Folder Structure

```
k8s-playground/
├── kustomization.yaml              # Root kustomization (app-of-apps)
├── README.md                        # This file
│
├── apps/
│   ├── linkding/
│   │   ├── namespace.yaml
│   │   ├── Namespace.yaml          # Existing
│   │   ├── deployment.yaml         # Existing
│   │   ├── service.yaml            # Existing
│   │   ├── PersistentVolumeClaim.yaml  # Existing
│   │   ├── kustomization.yaml
│   │   └── ../ingress/linkding.yaml    # Existing (shared)
│   │
│   ├── n8n/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── serviceaccount.yaml
│   │   ├── pvc.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   │
│   ├── homepage/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── pvc.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   │
│   ├── jellyfin/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── pvc.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   │
│   ├── freshrss/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── pvc.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   │
│   ├── jspwiki/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── pvc.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   │
│   ├── pihole/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── pvc.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   │
│   └── trilium/
│       ├── namespace.yaml
│       ├── configmap.yaml
│       ├── pvc.yaml
│       ├── deployment.yaml
│       ├── service.yaml
│       └── ingress.yaml
│
└── ingress/
    └── (ingress manifests shared by apps)
```

---

## Applications

### 1. **Linkding** - Bookmark Manager
- **Purpose**: Self-hosted bookmark management
- **Image**: `sissbruecker/linkding:latest`
- **Port**: 9090
- **Storage**: 1Gi (configuration & data)
- **Domain**: `bookmarks.nasat.local`
- **Special Notes**: Uses SQLite by default

### 2. **n8n** - Automation Platform
- **Purpose**: Workflow automation and integration
- **Image**: `n8nio/n8n:latest`
- **Port**: 5678
- **Storage**: 5Gi (workflows, execution history)
- **Domain**: `n8n.nasat.local`
- **Special Notes**:
  - Requires strong encryption key in production
  - Can execute long-running workflows
  - Supports webhooks for integrations

### 3. **Homepage** - Dashboard
- **Purpose**: Central dashboard aggregating links to all services
- **Image**: `gethomepage/homepage:latest`
- **Port**: 3000
- **Storage**: 1Gi (configuration)
- **Domain**: `homepage.nasat.local`
- **Special Notes**: Very lightweight, good entry point

### 4. **Jellyfin** - Media Server
- **Purpose**: Self-hosted media streaming (movies, TV, music)
- **Image**: `jellyfin/jellyfin:latest`
- **Port**: 8096
- **Storage**:
  - Config: 5Gi
  - Media: 100Gi (adjust based on your library)
- **Domain**: `jellyfin.nasat.local`
- **Special Notes**:
  - Needs significant storage for media
  - Can transcode videos (CPU intensive)
  - Discovery port 7359/UDP for LAN discovery

### 5. **FreshRSS** - RSS Reader
- **Purpose**: Aggregated news feed reader
- **Image**: `freshrss/freshrss:latest`
- **Port**: 80
- **Storage**: 5Gi (database, cache, feeds)
- **Domain**: `freshrss.nasat.local`
- **Special Notes**: Lightweight, good for knowledge workers

### 6. **JSPWiki** - Wiki Engine
- **Purpose**: Self-hosted wiki for knowledge management
- **Image**: `jspwiki/jspwiki:latest`
- **Port**: 8080
- **Storage**: 2Gi (wiki pages, attachments)
- **Domain**: `jspwiki.nasat.local`
- **Special Notes**: 
  - Lightweight wiki engine
  - File-based storage (no database)
  - Good for documentation and personal knowledge base

### 7. **Pi-hole** - DNS & Ad Blocking
- **Purpose**: Network-wide ad blocking and DNS resolution
- **Image**: `pihole/pihole:latest`
- **Ports**:
  - 53 (DNS - TCP/UDP)
  - 67 (DHCP - UDP)
  - 80/443 (Admin interface)
- **Storage**:
  - Config: 1Gi
  - Dnsmasq: 1Gi
- **Domain**: `pihole.nasat.local`
- **Special Notes**:
  - Requires elevated capabilities (NET_ADMIN, NET_BIND_SERVICE)
  - DNS queries should be routed to this service
  - Headless DNS service available for K8s-internal queries
  - Consider using as cluster DNS server

### 8. **TriliumNext** - Note-Taking Application
- **Purpose**: Hierarchical note-taking and knowledge management
- **Image**: `nyanmisaka/trilium:latest`
- **Port**: 8080 (exposed via ingress on port 80)
- **Storage**: 5Gi (notes, attachments, database)
- **Domain**: `trilium.nasat.local`
- **Special Notes**:
  - Self-hosted note-taking app with powerful organization
  - Built-in synchronization between devices
  - Rich WYSIWYG editor with markdown support
  - Full-text search across all notes
  - Works similar to Notion but self-hosted

---

## Prerequisites

### Cluster Requirements
- Kubernetes 1.20+ (K3s 1.20+)
- Traefik ingress controller (included in K3s by default)
- At least one worker node labeled: `node-role.kubernetes.io/worker: worker`
- Local storage class (e.g., `local-path` for K3s)

### Host Requirements
- DNS resolution for `.nasat.local` domains (configure `/etc/hosts` or DNS server)
- Adequate storage (minimum 145Gi for full stack with Jellyfin media)
- At least 4GB RAM per worker node (recommend 8GB)
- Network connectivity to worker nodes

### ArgoCD Installation
```bash
# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl rollout status deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

---

## Deployment

### 1. Verify Worker Nodes are Labeled

```bash
# Check worker node labels
kubectl get nodes --show-labels

# Output should show nodes with: node-role.kubernetes.io/worker=worker
# If not, apply the label:
kubectl label nodes <worker-node-name> node-role.kubernetes.io/worker=worker
```

### 2. Deploy via ArgoCD (Recommended)

```bash
# Deploy the playground ArgoCD Application
kubectl apply -f argocd/playground.yaml

# Verify deployment
kubectl get application -n argocd
kubectl get application playground -n argocd -o yaml
```

### 3. Deploy Directly with Kustomize (Alternative)

```bash
# Navigate to k8s-playground
cd k8s-playground

# Build the manifests
kustomize build . | kubectl apply -f -

# Wait for deployments
kubectl get deployments -A
```

### 4. Monitor Deployment Progress

```bash
# Watch all namespaces
kubectl get pods -A -w

# Or per namespace
kubectl get pods -n n8n -w
kubectl get pods -n jellyfin -w
```

---

## Configuration

### Changing Domains

All applications use `.nasat.local` domain placeholders. Update them by:

1. Edit each ingress file:
   ```bash
   # Example: n8n
   vim k8s-playground/apps/n8n/ingress.yaml
   # Change: host: n8n.nasat.local → host: n8n.yourdomain.com
   ```

2. Or use kustomize strategic merge patches (advanced):
   ```yaml
   # k8s-playground/apps/n8n/kustomization.yaml
   patchesJson6902:
   - target:
       group: networking.k8s.io
       version: v1
       kind: Ingress
       name: n8n-ingress
     patch: |-
       - op: replace
         path: /spec/rules/0/host
         value: n8n.yourdomain.com
   ```

### Changing Storage Sizes

Edit PVC manifests:

```bash
# Example: Jellyfin media storage
vim k8s-playground/apps/jellyfin/pvc.yaml
# Change: storage: 100Gi → storage: 500Gi
```

### Changing Resource Limits

Edit deployment manifests:

```bash
# Example: n8n
vim k8s-playground/apps/n8n/deployment.yaml
# Adjust resources.requests and resources.limits
```

### Changing Passwords & Secrets

Edit secret files:

```bash
# Example: FreshRSS
vim k8s-playground/apps/freshrss/secret.yaml
# Update: FRESHRSS_ADMIN_PASSWORD

# Apply changes
kubectl apply -f k8s-playground/apps/freshrss/secret.yaml
```

---

## Worker Node Scheduling

### Why Worker Node Scheduling?

This playground stack is configured to run **only on worker nodes**, not the control-plane. This ensures:

1. **Control-Plane Protection**: System services remain unaffected
2. **Workload Isolation**: Apps can't crash the cluster
3. **Scaling Flexibility**: Add workers independently from control-plane
4. **Resource Predictability**: Dedicated resources for workloads

### How It Works

Every Deployment/StatefulSet includes:

```yaml
spec:
  template:
    spec:
      nodeSelector:
        node-role.kubernetes.io/worker: worker
```

This ensures the scheduler only places pods on labeled worker nodes.

### Verifying Node Selection

```bash
# Get pods and their assigned nodes
kubectl get pods -A -o wide

# Output should show worker node names for all playground pods
# Example:
# NAMESPACE       NAME                  READY   STATUS    RESTARTS   AGE   IP          NODE
# n8n             n8n-5d4f8f6b8-xyz     1/1     Running   0          1m    10.42.2.10  worker-1
# jellyfin        jellyfin-9c8f7-abc    1/1     Running   0          2m    10.42.2.11  worker-1

# Verify nodes have correct labels
kubectl get nodes --show-labels | grep worker

# Output should show:
# worker-1   Ready    <none>   10d   ...   node-role.kubernetes.io/worker=worker
```

### Labeling Additional Worker Nodes

```bash
# If a new worker node isn't labeled:
kubectl label nodes <new-worker-node-name> node-role.kubernetes.io/worker=worker

# Verify:
kubectl get nodes --show-labels
```

### Migration to Dedicated Nodes (Advanced)

If you need more granular control later, use affinity rules:

```yaml
# Example: Jellyfin only on high-memory nodes
spec:
  template:
    spec:
      nodeSelector:
        node-role.kubernetes.io/worker: worker
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: workload
                operator: In
                values:
                - high-memory
```

Then label high-memory nodes:

```bash
kubectl label nodes <high-memory-node> workload=high-memory
```

### Taints & Tolerations (For Strict Isolation)

For production-grade isolation:

```bash
# Taint a node for playground workloads only
kubectl taint nodes worker-1 playground=true:NoSchedule

# Applications must tolerate this taint:
```

```yaml
spec:
  template:
    spec:
      tolerations:
      - key: playground
        operator: Equal
        value: "true"
        effect: NoSchedule
```

---

## Storage

### Storage Classes

The playground stack uses the **default storage class** (usually `local-path` in K3s).

Check available storage classes:

```bash
kubectl get storageclass
```

### Storage Architecture

| Application | Volume Name | Mount Path | Size | Purpose |
|---|---|---|---|---|
| **Linkding** | linkding-data | /etc/linkding/data | 1Gi | Bookmarks DB |
| **n8n** | n8n-data | /home/node/.n8n | 5Gi | Workflows, executions |
| **Homepage** | homepage-data | /app/data | 1Gi | Config & cache |
| **Jellyfin** | jellyfin-config | /config | 5Gi | App config |
| **Jellyfin** | jellyfin-media | /media | 100Gi | Media library |
| **FreshRSS** | freshrss-data | /var/www/FreshRSS/data | 5Gi | Feeds, DB |

### Persistent Volume Claims (PVCs)

View PVC usage:

```bash
# All PVCs
kubectl get pvc -A

# Specific namespace
kubectl get pvc -n jellyfin

# PVC details
kubectl describe pvc jellyfin-media -n jellyfin
```

### Backup Strategy

For persistent data:

```bash
# Backup a PVC (example: Jellyfin media)
kubectl exec -it <jellyfin-pod> -n jellyfin -- tar czf - /media | \
  gzip > jellyfin-media-backup.tar.gz

# Or use a backup tool like Velero:
velero create backup playground-backup --include-namespaces 'linkding,n8n,homepage,jellyfin,freshrss'
```

### Expanding Storage

To increase a PVC size:

```bash
# Edit the PVC
kubectl patch pvc jellyfin-media -n jellyfin -p \
  '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'

# Verify expansion (may take time)
kubectl get pvc jellyfin-media -n jellyfin
```

---

## Networking & Ingress

### Ingress Controller

The stack uses **Traefik** (default K3s ingress). All applications are exposed via HTTP on port 80.

### DNS Configuration

Update your DNS or `/etc/hosts`:

```bash
# /etc/hosts (Linux/Mac)
127.0.0.1 localhost
192.168.1.100 n8n.nasat.local
192.168.1.100 homepage.nasat.local
192.168.1.100 jellyfin.nasat.local
192.168.1.100 freshrss.nasat.local
192.168.1.100 bookmarks.nasat.local

# Or use a wildcard (if your cluster IP is 192.168.1.100):
192.168.1.100 *.nasat.local
192.168.1.100 *.nasat.local
```

Or configure DNS server (dnsmasq, Pi-hole, etc.):

```
address=/nasat.local/192.168.1.100
address=/nasat.local/192.168.1.100
```

### Testing Ingress

```bash
# Check ingress resources
kubectl get ingress -A

# Port-forward to test (if DNS not configured)
kubectl port-forward -n n8n svc/n8n 8080:80

# Then visit: http://localhost:8080
```

### HTTPS/TLS (Optional but Recommended)

To enable HTTPS, install cert-manager and add TLS issuer:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create self-signed issuer for .local domains
cat <<EOF | kubectl apply -f -
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

---

## Verification & Troubleshooting

### Basic Verification Steps

```bash
# 1. Check all pods are running
kubectl get pods -A

# 2. Check nodes are labeled correctly
kubectl get nodes --show-labels

# 3. Verify pods are on worker nodes
kubectl get pods -A -o wide | grep -v "control-plane\|master"

# 4. Check service endpoints
kubectl get svc -A

# 5. Check ingress
kubectl get ingress -A
```

### Detailed Pod Inspection

```bash
# Describe a pod (useful for debugging)
kubectl describe pod <pod-name> -n <namespace>

# View logs
kubectl logs <pod-name> -n <namespace>
kubectl logs -f <pod-name> -n <namespace>  # Follow logs

# Execute commands in pod
kubectl exec -it <pod-name> -n <namespace> -- /bin/bash
```

### Common Issues & Solutions

#### Issue: Pods stuck in `Pending`

```bash
# Usually indicates node selector mismatch
kubectl describe pod <pod-name> -n <namespace>
# Look for: "no nodes match selector"

# Solution: Label worker nodes
kubectl label nodes <worker-node> node-role.kubernetes.io/worker=worker
```

#### Issue: Pods `CrashLoopBackOff`

```bash
# Check logs
kubectl logs <pod-name> -n <namespace> --tail=50

# Check resource availability
kubectl describe nodes

# May need to increase node resources or adjust pod limits
```

#### Issue: Ingress not working

```bash
# Verify Traefik is running
kubectl get pod -n kube-system | grep traefik

# Check ingress configuration
kubectl describe ingress <ingress-name> -n <namespace>

# Test from pod
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -qO- http://n8n.n8n.svc.cluster.local:80
```

#### Issue: Storage not accessible

```bash
# Check storage class
kubectl get storageclass

# Verify PVC is bound
kubectl get pvc -A

# Check node storage
kubectl debug node/<node-name> -it --image=busybox
# Then inside: ls -la /var/lib/rancher/k3s/storage/
```

### ArgoCD Verification

```bash
# Check ArgoCD application status
kubectl get application -n argocd playground -o yaml

# View ArgoCD logs
kubectl logs -n argocd deployment/argocd-server -f

# Access ArgoCD UI (port-forward)
kubectl port-forward -n argocd svc/argocd-server 8080:443
# Then visit: https://localhost:8080 (use admin / <password>)
```

---

## Adding New Applications

### Step 1: Create App Directory

```bash
mkdir -p k8s-playground/apps/myapp
cd k8s-playground/apps/myapp
```

### Step 2: Create Required Files

```bash
# Copy template from existing app (e.g., n8n)
cp -r k8s-playground/apps/n8n/* k8s-playground/apps/myapp/

# Rename generics
cd k8s-playground/apps/myapp
sed -i 's/n8n/myapp/g' *.yaml
sed -i 's/N8N_/MYAPP_/g' *.yaml
```

### Step 3: Customize Manifests

Edit each file:

```yaml
# namespace.yaml
metadata:
  name: myapp

# deployment.yaml
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: myapp
        image: myrepo/myapp:latest
        ports:
        - containerPort: 3000

# service.yaml
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 3000

# ingress.yaml
spec:
  rules:
  - host: myapp.nasat.local
```

### Step 4: Update Root Kustomization

Edit `k8s-playground/kustomization.yaml`:

```yaml
resources:
  - apps/linkding/kustomization.yaml
  - apps/n8n/kustomization.yaml
  - apps/myapp/kustomization.yaml  # Add this
```

### Step 5: Test Deployment

```bash
# Test with kustomize
kustomize build k8s-playground/apps/myapp | kubectl apply -f - --dry-run=client

# Deploy if satisfied
kustomize build k8s-playground/apps/myapp | kubectl apply -f -

# Verify
kubectl get pods -n myapp -w
kubectl logs -f deployment/myapp -n myapp
```

### Step 6: Commit to Git

```bash
git add k8s-playground/
git commit -m "add: myapp to playground stack"
git push

# ArgoCD will auto-sync within seconds
```

---

## Scaling & Performance

### CPU & Memory Recommendations

| App | CPU Request | CPU Limit | RAM Request | RAM Limit | Notes |
|---|---|---|---|---|---|
| Linkding | 100m | 500m | 256Mi | 512Mi | Lightweight |
| n8n | 100m | 1000m | 256Mi | 1Gi | Variable based on workflows |
| Homepage | 50m | 200m | 64Mi | 256Mi | Very lightweight |
| Jellyfin | 200m | 2000m | 512Mi | 2Gi | CPU intensive for transcoding |
| FreshRSS | 100m | 500m | 128Mi | 512Mi | Lightweight |

Adjust based on your workload:

```bash
# For high transcoding: Increase Jellyfin CPU limit
vim k8s-playground/apps/jellyfin/deployment.yaml
# resources.limits.cpu: 4000m  (quad-core system)

# For many n8n workflows: Increase memory
vim k8s-playground/apps/n8n/deployment.yaml
# resources.limits.memory: 2Gi
```

### Horizontal Pod Autoscaling

For stateless apps (Homepage, FreshRSS), enable HPA:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: homepage-hpa
  namespace: homepage
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: homepage
  minReplicas: 1
  maxReplicas: 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Multi-Replica Setup

For stateful apps (Jellyfin, n8n), consider StatefulSets for ordered scaling:

```bash
# Convert Deployment to StatefulSet for proper storage mounting
# (Advanced topic - refer to Kubernetes docs)
```

---

## Security Considerations

### Current Configuration

The playground stack follows these security practices:

1. **RBAC**: Default namespace isolation via namespaces
2. **Network Policies**: Can be added per-namespace (not configured by default)
3. **Security Contexts**: Non-root where possible
4. **Resource Limits**: Prevent resource exhaustion
5. **Health Checks**: Automatic pod recovery

### Recommended Hardening

```bash
# 1. Add Network Policy (block inter-namespace traffic)
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: n8n
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF

# 2. Add Pod Security Policy (if K8s < 1.25)
# Or Pod Security Admission (K8s >= 1.25)

# 3. Enable RBAC (already enabled in K3s)
kubectl get clusterrolebinding

# 4. Rotate secrets regularly
kubectl -n freshrss patch secret freshrss-secrets -p \
  '{"stringData":{"FRESHRSS_ADMIN_PASSWORD":"new_strong_password"}}'
```

### Secret Management

For production, use sealed-secrets or external-secrets:

```bash
# Install sealed-secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Seal a secret
kubeseal -f k8s-playground/apps/freshrss/secret.yaml \
  -w k8s-playground/apps/freshrss/sealed-secret.yaml

# Use sealed-secret instead of plaintext secret
```

### Firewall & Network Access

```bash
# Allow only specific IP ranges to ingress
# (Configure at firewall/network level)

# Restrict API server access (K3s)
# Edit /etc/rancher/k3s/k3s.yaml or use --bind 127.0.0.1
```

---

## Maintenance & Updates

### Updating Application Images

```bash
# Option 1: Manual edit
vim k8s-playground/apps/n8n/deployment.yaml
# Change: image: n8nio/n8n:latest → image: n8nio/n8n:v0.x.0

# Option 2: Use ArgoCD Image Updater (advanced)
# Add to ArgoCD Application spec

# Deploy
kubectl apply -f k8s-playground/apps/n8n/deployment.yaml
```

### Checking for Updates

```bash
# Check available image updates
kubectl set image deployment/n8n n8n=n8nio/n8n:latest --record -n n8n --dry-run=client

# Monitor pod rollout
kubectl rollout status deployment/n8n -n n8n
kubectl rollout history deployment/n8n -n n8n
```

### Rolling Back

```bash
# Rollback to previous version
kubectl rollout undo deployment/n8n -n n8n
kubectl rollout undo deployment/n8n -n n8n --to-revision=1
```

### Cluster Maintenance

```bash
# Drain node for maintenance (moves pods to other workers)
kubectl drain worker-1 --ignore-daemonsets

# Perform maintenance...

# Uncordon node to resume scheduling
kubectl uncordon worker-1
```

---

## Monitoring & Logging

### Enable Prometheus Metrics Scraping

The deployments include Prometheus annotations:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "5678"
  prometheus.io/path: "/metrics"
```

Install Prometheus Operator:

```bash
kubectl apply -f https://github.com/prometheus-operator/prometheus-operator/releases/download/v0.60.0/bundle.yaml
```

### View Application Logs

```bash
# Stream logs
kubectl logs -f deployment/n8n -n n8n

# View last 100 lines
kubectl logs deployment/n8n -n n8n --tail=100

# View logs from all pods in namespace
kubectl logs -f -n n8n -l app=n8n
```

### Resource Usage Monitoring

```bash
# Pod resource usage
kubectl top pod -A

# Node resource usage
kubectl top node

# Detailed pod metrics
kubectl describe pod <pod-name> -n <namespace>
```

---

## Reference Commands

### Quick Diagnostics

```bash
# Everything at once
kubectl get all -A

# Specific namespace
kubectl get all -n n8n

# Event logs (useful for debugging)
kubectl get events -n n8n

# Recent issues
kubectl get events -A --sort-by='.lastTimestamp' | tail -20
```

### Port Forwarding (for testing without DNS)

```bash
# n8n
kubectl port-forward -n n8n svc/n8n 8080:80

# Jellyfin
kubectl port-forward -n jellyfin svc/jellyfin 8096:80

# Homepage
kubectl port-forward -n homepage svc/homepage 3000:80

# Then visit: http://localhost:8080 (or respective port)
```

### Cleanup

```bash
# Delete entire playground stack
kubectl delete namespace linkding n8n homepage jellyfin freshrss

# Or use ArgoCD
kubectl delete application playground -n argocd
```

---

## Contributing

To add new applications or improve this stack:

1. Fork the repository
2. Create a new branch: `git checkout -b add/myapp`
3. Add your app following the existing pattern
4. Test on your cluster
5. Create a pull request

---

## Troubleshooting Matrix

| Symptom | Likely Cause | Solution |
|---|---|---|
| Pods in `Pending` | No worker nodes labeled | Label nodes: `kubectl label nodes <node> node-role.kubernetes.io/worker=worker` |
| Pods `CrashLoopBackOff` | Config/resource error | Check logs: `kubectl logs <pod> -n <ns>` |
| No ingress access | DNS/routing issue | Configure DNS, check ingress: `kubectl get ingress -A` |
| Storage full | Large PVC exceeded | Expand PVC: `kubectl patch pvc <name> -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'` |
| High CPU/memory | Resource limits too low | Increase limits in deployment |
| Network unreachable | Firewall/policy | Check network policies, firewall rules |

---

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [K3s Documentation](https://docs.k3s.io/)
- [Argo CD Documentation](https://argoproj.github.io/cd/)
- [Traefik Documentation](https://doc.traefik.io/)
- [Kustomize Documentation](https://kustomize.io/)

---

## License

This playground stack is part of the NASAT project. See LICENSE file for details.

---

**Last Updated**: 2024
**Maintainer**: Platform Engineering Team
