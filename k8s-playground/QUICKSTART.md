# Quick Start Guide - Playground Stack

## Prerequisites Checklist

- [ ] Kubernetes 1.20+ cluster running (K3s)
- [ ] At least one worker node with label `node-role.kubernetes.io/worker: worker`
- [ ] Traefik ingress controller installed (default in K3s)
- [ ] Local storage class available (default-path for K3s)
- [ ] ArgoCD installed in cluster
- [ ] kubectl access to cluster
- [ ] Git repository pushable (github.com/nizamra/nasat)

## Step 1: Label Worker Nodes (One-Time)

```bash
# List all nodes
kubectl get nodes

# Label each worker node
kubectl label nodes worker-node node-role.kubernetes.io/worker=worker

# Verify
kubectl get nodes --show-labels
```

Output should show:
```
NAME               STATUS   ROLES          AGE   VERSION   LABELS
control-plane      Ready    control-plane  10d   v1.27.0   ...
worker           Ready    worker         10d   v1.27.0   ...node-role.kubernetes.io/worker=worker
```

## Step 2: Deploy Playground Stack

### Option A: Via ArgoCD (Recommended)

```bash
# Deploy the ArgoCD Application
kubectl apply -f argocd/playground.yaml

# Monitor deployment
kubectl get application -n argocd playground -w

# Check sync status
kubectl get application playground -n argocd -o yaml
```

### Option B: Via Kustomize (Direct)

```bash
# Deploy all apps at once
kustomize build k8s-playground | kubectl apply -f -

# Or deploy individual apps
kustomize build k8s-playground/apps/n8n | kubectl apply -f -
kustomize build k8s-playground/apps/jellyfin | kubectl apply -f -
```

## Step 3: Verify Deployment

```bash
# Run verification script
bash k8s-playground/verify-deployment.sh

# Manual checks
kubectl get pods -A -l part-of=playground-stack
kubectl get ingress -A
kubectl get pvc -A
```

## Step 4: Configure DNS

Add to `/etc/hosts` (or configure DNS server):

```
192.168.10.22  n8n.nasat.local
192.168.10.22  homepage.nasat.local
192.168.10.22  jellyfin.nasat.local
192.168.10.22  freshrss.nasat.local
192.168.10.22  bookmarks.nasat.local
192.168.10.22  jspwiki.nasat.local
192.168.10.22  pihole.nasat.local
192.168.10.22  trilium.nasat.local
```

## Step 5: Access Applications

| Application | URL |
|---|---|
| Homepage | http://homepage.nasat.local |
| n8n | http://n8n.nasat.local |
| Linkding | http://bookmarks.nasat.local |
| Jellyfin | http://jellyfin.nasat.local |
| FreshRSS | http://freshrss.nasat.local |
| JSPWiki | http://jspwiki.nasat.local |
| Pi-hole | http://pihole.nasat.local |
| TriliumNext | http://trilium.nasat.local |

## Troubleshooting

### Pods not starting?

```bash
# Check pod status
kubectl describe pod <pod-name> -n <namespace>

# View logs
kubectl logs <pod-name> -n <namespace>

# Common issue: Worker nodes not labeled
kubectl label nodes <node> node-role.kubernetes.io/worker=worker
```

### Can't access services via ingress?

```bash
# Verify ingress
kubectl get ingress -A

# Check DNS resolution
nslookup n8n.nasat.local

# Port-forward to test (no DNS needed)
kubectl port-forward -n n8n svc/n8n 8080:80
# Then visit: http://localhost:8080
```

### Storage full?

```bash
# Check PVC usage
kubectl get pvc -A

# Expand a PVC
kubectl patch pvc jellyfin-media -n jellyfin -p \
  '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'
```

## Next Steps

1. **Configure Storage**: Adjust PVC sizes in `k8s-playground/apps/*/pvc.yaml`
2. **Configure Domains**: Update ingress hostnames to your domain
3. **Configure Secrets**: Update passwords in `secret.yaml` files
4. **Customize Resource Limits**: Edit `deployment.yaml` files for your hardware
5. **Add More Apps**: Follow `Adding New Applications` section in main README.md

## Useful Commands

```bash
# Watch all pods starting up
kubectl get pods -A -w

# Follow logs from a pod
kubectl logs -f deployment/n8n -n n8n

# Check cluster health
kubectl get nodes
kubectl top node
kubectl top pod -A

# Restart an app
kubectl rollout restart deployment/n8n -n n8n

# Get all resources in a namespace
kubectl get all -n n8n

# Delete entire namespace
kubectl delete namespace n8n
```

## Documentation

See [README.md](./README.md) for comprehensive documentation including:
- Architecture overview
- Detailed configuration instructions
- Worker node scheduling explanation
- Troubleshooting matrix
- Adding new applications
- Security hardening
- And much more!

---

**Need help?** Check the troubleshooting section in README.md or run `verify-deployment.sh` for diagnostics.
