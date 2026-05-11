# Installation & Deployment Checklist

Use this checklist to ensure all prerequisites are met and deployment is successful.

## Pre-Deployment Checklist

### Cluster Infrastructure
- [ ] Kubernetes 1.20+ cluster installed (K3s recommended)
- [ ] At least 1 worker node with 4GB+ RAM
- [ ] At least 50GB free disk space (100GB+ if deploying Jellyfin with media)
- [ ] Network connectivity between nodes
- [ ] Container runtime installed (containerd for K3s)

### Cluster Configuration
- [ ] kubectl installed and configured
- [ ] kubectl can connect to cluster: `kubectl cluster-info`
- [ ] Traefik ingress controller installed (check: `kubectl get deployment -n kube-system traefik`)
- [ ] Storage class available: `kubectl get storageclass`
- [ ] RBAC enabled: `kubectl get clusterrolebinding`

### ArgoCD Installation
- [ ] ArgoCD namespace exists: `kubectl get namespace argocd`
- [ ] ArgoCD server running: `kubectl get deployment -n argocd argocd-server`
- [ ] ArgoCD initial admin password retrieved
- [ ] ArgoCD accessible via port-forward: `kubectl port-forward -n argocd svc/argocd-server 8080:443`

### Worker Node Labeling
- [ ] All worker nodes labeled: `node-role.kubernetes.io/worker: worker`
  ```bash
  # Check labels
  kubectl get nodes --show-labels
  
  # Label if needed
  kubectl label nodes <worker-node> node-role.kubernetes.io/worker=worker
  ```

### Repository & Git
- [ ] Repository cloned locally: `/path/to/nasat`
- [ ] Git remote configured: `git remote -v`
- [ ] Branch is master or correct deployment branch
- [ ] Write access to repository (for pushes if modifying configs)

### DNS & Network
- [ ] DNS/hosts file will be configured: `/etc/hosts` or DNS server
- [ ] Network can reach cluster nodes on target port (80 for ingress)
- [ ] Firewall allows ingress traffic
- [ ] No conflicting local services on ports needed

## Deployment Checklist

### Step 1: Clone Repository
- [ ] Repository cloned: `git clone https://github.com/nizamra/nasat.git`
- [ ] Navigate to k8s-playground: `cd nasat/k8s-playground`
- [ ] Verify directory structure: `ls -la`

### Step 2: Pre-Deployment Verification
- [ ] Run verification script (if available): `bash verify-deployment.sh`
- [ ] Check worker node labels: `kubectl get nodes --show-labels`
- [ ] Check storage availability: `kubectl get storageclass && kubectl describe storageclass default`
- [ ] Verify ingress controller: `kubectl get deployment -n kube-system traefik`

### Step 3: Deploy ArgoCD Application
- [ ] Apply playground application manifest: `kubectl apply -f argocd/playground.yaml`
- [ ] Verify application created: `kubectl get application -n argocd playground`
- [ ] Check sync status: `kubectl get application playground -n argocd -o yaml | grep -A 10 "status"`
- [ ] Wait for syncing to complete (usually 2-5 minutes)

### Step 4: Monitor Deployment
- [ ] Watch pod deployment: `kubectl get pods -A -w -l part-of=playground-stack`
- [ ] Monitor all namespaces: `kubectl get pods -A`
- [ ] Check for errors: `kubectl get events -A --sort-by='.lastTimestamp'`
- [ ] Verify no CrashLoopBackOff pods: `kubectl get pods -A | grep -i crash`

### Step 5: Verify All Pods Running
- [ ] Linkding pod running: `kubectl get pod -n linkding`
- [ ] n8n pod running: `kubectl get pod -n n8n`
- [ ] Homepage pod running: `kubectl get pod -n homepage`
- [ ] Jellyfin pod running: `kubectl get pod -n jellyfin`
- [ ] FreshRSS pod running: `kubectl get pod -n freshrss`

### Step 6: Verify PVCs Created
- [ ] Check all PVCs bound: `kubectl get pvc -A`
- [ ] Verify no pending PVCs: `kubectl get pvc -A | grep -i pending`
- [ ] Check storage is available: `kubectl describe pvc jellyfin-media -n jellyfin`

### Step 7: Verify Ingress Resources
- [ ] Check ingress created: `kubectl get ingress -A`
- [ ] Verify all hosts configured: `kubectl describe ingress -n n8n`
- [ ] Check backend services: `kubectl get svc -A`

### Step 8: Configure DNS
- [ ] Add entries to /etc/hosts or configure DNS server:
  ```
  192.168.1.100  n8n.nasat.local
  192.168.1.100  homepage.nasat.local
  192.168.1.100  jellyfin.nasat.local
  192.168.1.100  freshrss.nasat.local
  192.168.1.100  bookmarks.nasat.local
  ```
  **Note**: Replace 192.168.1.100 with your actual cluster/ingress IP
- [ ] Test DNS resolution: `nslookup n8n.nasat.local`
- [ ] Verify all domains resolve correctly

### Step 9: Test Application Access
- [ ] Access Homepage: `curl http://homepage.nasat.local`
- [ ] Access n8n: `curl http://n8n.nasat.local`
- [ ] Access Linkding: `curl http://bookmarks.nasat.local`
- [ ] Access Jellyfin: `curl http://jellyfin.nasat.local`
- [ ] Access FreshRSS: `curl http://freshrss.nasat.local`

### Step 10: Verify Application Health
- [ ] Check pod logs for errors: `kubectl logs deployment/n8n -n n8n`
- [ ] Verify liveness probes passing: `kubectl describe pod <pod-name> -n <namespace>`
- [ ] Check resource usage: `kubectl top pod -A`
- [ ] Monitor events for warnings: `kubectl get events -A`

## Post-Deployment Checklist

### Configuration
- [ ] Update application passwords from default values
  - [ ] FreshRSS admin password changed
  - [ ] Linkding password secured
  - [ ] n8n encryption key configured
- [ ] Update domain names if not using nasat.local
- [ ] Adjust resource limits based on hardware
- [ ] Configure storage sizes appropriately

### Backup Configuration
- [ ] Create backup directory: `mkdir -p /mnt/backups/playground`
- [ ] Test backup script: `bash backup-playground.sh`
- [ ] Schedule automated backups: `crontab -e`
- [ ] Verify backup location has adequate space

### Monitoring & Alerts
- [ ] Set up monitoring (Prometheus/Grafana) - optional
- [ ] Configure log aggregation (Loki) - optional
- [ ] Set up alerts for pod crashes - optional
- [ ] Test notification channels - optional

### Documentation
- [ ] Review README.md for your configuration
- [ ] Document any customizations made
- [ ] Create runbook for your specific setup
- [ ] Share access and documentation with team

### Security
- [ ] Review RBAC permissions - optional
- [ ] Configure network policies if needed - optional
- [ ] Enable TLS/HTTPS - optional
- [ ] Audit ingress access patterns - optional

## Verification Tests

### Test 1: Pod Scheduling on Worker Nodes
```bash
# All pods should show worker node names, not control-plane
kubectl get pods -A -o wide | grep -v "kube-system\|argocd" | grep -v control-plane
# ✓ PASS: All pods on worker nodes
# ✗ FAIL: Some pods on control-plane nodes
```

### Test 2: All Services Have Endpoints
```bash
# Endpoints should not be empty
kubectl get endpoints -A -l part-of=playground-stack
# ✓ PASS: All services have endpoints
# ✗ FAIL: Some services have no endpoints
```

### Test 3: All PVCs Are Bound
```bash
# All should show status "Bound"
kubectl get pvc -A
# ✓ PASS: All PVCs are Bound
# ✗ FAIL: Some PVCs are Pending
```

### Test 4: Applications Respond to Health Checks
```bash
# Run health checks for each app
for ns in linkding n8n homepage jellyfin freshrss; do
  kubectl exec -it deployment/$ns -n $ns -- curl -f http://localhost:*/healthz 2>/dev/null && echo "$ns: ✓" || echo "$ns: ✗"
done
```

### Test 5: Ingress Routes Traffic Correctly
```bash
# Test each ingress endpoint
for domain in n8n.nasat.local homepage.nasat.local jellyfin.nasat.local freshrss.nasat.local bookmarks.nasat.local; do
  curl -f http://$domain 2>/dev/null && echo "$domain: ✓" || echo "$domain: ✗"
done
```

### Test 6: Worker Node Isolation Verified
```bash
# Count pods on each node type
echo "Pods on control-plane:"
kubectl get pods -A -o wide | grep control-plane | wc -l

echo "Pods on worker nodes:"
kubectl get pods -A -o wide | grep worker | wc -l

# ✓ PASS: Zero pods on control-plane (except system pods)
# ✗ FAIL: Non-system pods found on control-plane
```

## Troubleshooting During Deployment

| Symptom | Diagnostic Command | Likely Cause | Fix |
|---|---|---|---|
| Pods in Pending | `kubectl describe pod <pod>` | Node selector mismatch | Label worker nodes |
| CrashLoopBackOff | `kubectl logs <pod>` | Config/startup error | Check logs, fix config |
| ImagePullBackOff | `kubectl describe pod <pod>` | Image not available | Verify image name and registry |
| No ingress endpoints | `kubectl get endpoints -n n8n` | Service has no pods | Check pod status |
| DNS not resolving | `nslookup <domain>` | DNS not configured | Add to /etc/hosts or DNS server |
| High memory usage | `kubectl top pod -n <ns>` | Pod limit too low | Increase memory limit |
| Storage full | `kubectl get pvc -A` | PVC too small | Expand PVC |

## Rollback Plan

If deployment fails at any point:

```bash
# 1. Check current status
kubectl get application -n argocd playground -o yaml

# 2. Pause ArgoCD sync
kubectl patch application playground -n argocd --type merge \
  -p '{"spec":{"syncPolicy":{"automated":null}}}'

# 3. Fix issues
# (address configuration, resource, or manifest issues)

# 4. Test with dry-run
kustomize build k8s-playground | kubectl apply -f - --dry-run=client

# 5. Resume sync
kubectl patch application playground -n argocd --type merge \
  -p '{"spec":{"syncPolicy":{"automated":{"prune":true,"selfHeal":true}}}}'

# 6. Or delete entire deployment and restart
kubectl delete application playground -n argocd
# Fix issues...
kubectl apply -f argocd/playground.yaml
```

## Sign-Off

- [ ] Deployment date: _______________
- [ ] Deployed by: _______________
- [ ] All checklist items completed: _______________
- [ ] All tests passed: _______________
- [ ] Ready for production: _______________

---

**Deployment Time**: Typically 5-15 minutes from `kubectl apply -f argocd/playground.yaml` to fully ready
**Support**: See README.md for comprehensive documentation
