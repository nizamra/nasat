# Operational Runbook

This document contains operational procedures for managing the playground stack in production.

## Table of Contents

1. [Routine Operations](#routine-operations)
2. [Incident Response](#incident-response)
3. [Scaling Operations](#scaling-operations)
4. [Backup & Recovery](#backup--recovery)
5. [Upgrades](#upgrades)
6. [Common Issues](#common-issues)

---

## Routine Operations

### Daily Health Check

**Frequency**: Once daily (automated or manual)

```bash
#!/bin/bash
# Daily health check

echo "=== Cluster Health ==="
kubectl get nodes

echo ""
echo "=== Playground Pods ==="
kubectl get pods -A -l part-of=playground-stack

echo ""
echo "=== Pod Restarts ==="
kubectl get pods -A -l part-of=playground-stack -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}'

echo ""
echo "=== Storage Usage ==="
kubectl get pvc -A

echo ""
echo "=== Recent Events ==="
kubectl get events -A --sort-by='.lastTimestamp' | tail -10
```

### Weekly Maintenance

**Tasks**:
1. Check for available Kubernetes updates: `kubectl version`
2. Review application logs for errors: `kubectl logs -A -l part-of=playground-stack`
3. Check disk usage: `df -h` on worker nodes
4. Backup critical data (see Backup section)
5. Review ArgoCD sync status: `kubectl get application -n argocd`

```bash
# Weekly cleanup
# Remove failed pods
kubectl delete pod --field-selector=status.phase=Failed -A

# Remove evicted pods
kubectl delete pod --field-selector=status.phase=Failed -A --grace-period=0 --force
```

### Monthly Review

**Tasks**:
1. Review resource utilization trends
2. Analyze PVC growth rates
3. Check certificate expiration (if TLS enabled)
4. Review ArgoCD logs for issues
5. Test disaster recovery procedures

---

## Incident Response

### Pod is in CrashLoopBackOff

**Diagnosis**:
```bash
# Check pod status
kubectl describe pod <pod-name> -n <namespace>

# View recent logs
kubectl logs <pod-name> -n <namespace> --tail=100

# Check previous restart logs
kubectl logs <pod-name> -n <namespace> --previous
```

**Common Causes & Fixes**:

1. **Config error in ConfigMap/Secret**
   ```bash
   # Fix and reapply
   kubectl edit configmap <configmap-name> -n <namespace>
   kubectl rollout restart deployment/<app-name> -n <namespace>
   ```

2. **PVC not accessible**
   ```bash
   # Check PVC status
   kubectl get pvc -n <namespace>
   
   # Verify node storage
   kubectl describe node <node-name>
   ```

3. **Image pull error**
   ```bash
   # Check image availability
   docker pull <image-name>
   
   # Fix and retry
   kubectl set image deployment/<app> app=<new-image> -n <namespace>
   ```

4. **Insufficient resources**
   ```bash
   # Check node resources
   kubectl top nodes
   
   # Drain a node and restart
   kubectl drain <node> --ignore-daemonsets
   ```

### All Pods Evicted

**Diagnosis**:
```bash
# Check node pressure
kubectl describe node <node-name> | grep Conditions -A 5

# Check node disk usage
du -sh /var/lib/rancher/k3s/storage/*

# Check inode usage
df -i
```

**Recovery**:
```bash
# If disk full on node
# 1. SSH into node and free space
# 2. Uncordon node
kubectl uncordon <node-name>

# If inode exhaustion
# 1. Remove old Docker images
docker image prune -a

# 2. Recreate pods
kubectl rollout restart deployment/<app-name> -n <namespace>
```

### Ingress Not Accessible

**Diagnosis**:
```bash
# Verify ingress
kubectl get ingress -A

# Check Traefik
kubectl get pod -n kube-system | grep traefik

# Test from inside cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -qO- http://n8n.n8n.svc.cluster.local:80
```

**Common Fixes**:

1. **DNS not resolving**
   ```bash
   # Update /etc/hosts or DNS server
   echo "192.168.1.100  n8n.nasat.local" >> /etc/hosts
   
   # Test resolution
   nslookup n8n.nasat.local
   ```

2. **Traefik misconfiguration**
   ```bash
   # Restart Traefik
   kubectl rollout restart deployment/traefik -n kube-system
   
   # Check Traefik logs
   kubectl logs -f deployment/traefik -n kube-system
   ```

3. **Service endpoints not ready**
   ```bash
   # Check endpoints
   kubectl get endpoints -A
   
   # Verify pods are running
   kubectl get pods -n n8n
   ```

### Application Data Corruption

**Prevention**:
```bash
# Regular backups
kubectl exec -it <pod-name> -n <namespace> -- \
  tar czf - /data | gzip > backup-$(date +%s).tar.gz
```

**Recovery**:
```bash
# 1. Scale down the app
kubectl scale deployment/<app-name> --replicas=0 -n <namespace>

# 2. Restore from backup
kubectl cp backup.tar.gz <pod-name>:/data/ -n <namespace>

# 3. Scale back up
kubectl scale deployment/<app-name> --replicas=1 -n <namespace>
```

---

## Scaling Operations

### Adding a New Worker Node

**Prerequisites**:
- New node is running Kubernetes
- Network connectivity to cluster
- Sufficient resources (4GB+ RAM, 10GB+ disk)

**Steps**:

```bash
# 1. Verify node is joining
kubectl get nodes

# 2. Label the node
kubectl label nodes <new-node> node-role.kubernetes.io/worker=worker

# 3. Verify label
kubectl get nodes --show-labels

# 4. Check if pods automatically schedule
kubectl get pods -A -o wide | grep <new-node>

# 5. If needed, restart ArgoCD sync
kubectl rollout restart deployment/argocd-application-controller -n argocd
```

### Scaling an Application Replicas

**For stateless apps** (Homepage, FreshRSS, Linkding):

```bash
# 1. Modify kustomization.yaml to increase replicas
vim k8s-playground/apps/homepage/kustomization.yaml

# Add replicas field:
# replicas:
# - name: homepage
#   count: 3

# 2. Apply changes
kubectl apply -f k8s-playground/apps/homepage/deployment.yaml

# Or use kubectl directly:
kubectl scale deployment/homepage --replicas=3 -n homepage
```

**For stateful apps** (n8n, Jellyfin):

**Note**: Multi-replica stateful apps require:
- Shared storage (not local-path)
- Session/state management
- Database coordination

For now, keep as single replica. To enable multi-replica later:

```bash
# Convert to StatefulSet with shared NFS
# Update PVC to use NFS storage class
vim k8s-playground/apps/n8n/pvc.yaml
# Set storageClassName: nfs
```

### Vertical Scaling (Increase Resources)

```bash
# 1. Update deployment resource limits
vim k8s-playground/apps/jellyfin/deployment.yaml

# 2. Increase resources section
# resources:
#   requests:
#     cpu: 500m
#     memory: 1Gi
#   limits:
#     cpu: 4000m
#     memory: 4Gi

# 3. Apply changes
kubectl apply -f k8s-playground/apps/jellyfin/deployment.yaml

# 4. Restart pods to pick up changes
kubectl rollout restart deployment/jellyfin -n jellyfin
```

---

## Backup & Recovery

### Backup Strategy (3-2-1 Rule)

**3 Copies**:
1. Production data (PVCs on worker nodes)
2. Backup on different node/storage
3. Backup offsite (cloud, external drive)

**2 Different Media**:
1. Local disk on primary node
2. External USB/NAS
3. Cloud storage (S3, etc.)

**1 Offsite**:
- Weekly upload to cloud storage
- Stored in geographically different location

### Application Data Backup

**Automated Backup Script**:

```bash
#!/bin/bash
# backup-playground.sh

BACKUP_DIR="/mnt/backups/playground"
DATE=$(date +%Y%m%d-%H%M%S)
APPS=("linkding" "n8n" "homepage" "jellyfin" "freshrss")

for app in "${APPS[@]}"; do
  echo "Backing up $app..."
  mkdir -p "$BACKUP_DIR/$app/$DATE"
  
  # Backup PVC data
  pvc_count=$(kubectl get pvc -n $app 2>/dev/null | wc -l)
  if [ "$pvc_count" -gt 1 ]; then
    kubectl get pvc -n $app -o jsonpath='{.items[*].metadata.name}' | \
    while read pvc; do
      echo "  Backing up PVC: $pvc"
      kubectl exec -it "$(kubectl get pod -n $app -o jsonpath='{.items[0].metadata.name}')" \
        -n $app -- tar czf - /data | gzip > "$BACKUP_DIR/$app/$DATE/$pvc.tar.gz"
    done
  fi
  
  # Backup manifests
  kustomize build k8s-playground/apps/$app > "$BACKUP_DIR/$app/$DATE/manifests.yaml"
done

echo "Backup complete: $BACKUP_DIR"
```

**Schedule with cron**:

```bash
# Run backup daily at 2 AM
0 2 * * * /path/to/backup-playground.sh >> /var/log/backup-playground.log 2>&1
```

### Restore from Backup

**Scenario: Jellyfin database corrupted**

```bash
# 1. Find backup
ls -la /mnt/backups/playground/jellyfin/

# 2. Scale down Jellyfin
kubectl scale deployment/jellyfin --replicas=0 -n jellyfin

# 3. Copy backup to pod temp directory
kubectl cp /mnt/backups/playground/jellyfin/20240101-020000/jellyfin-config.tar.gz \
  <pod-id>:/tmp/ -n jellyfin

# 4. Wait for pod to spin up
kubectl scale deployment/jellyfin --replicas=1 -n jellyfin
kubectl wait --for=condition=ready pod -l app=jellyfin -n jellyfin --timeout=300s

# 5. Extract backup
kubectl exec -it deployment/jellyfin -n jellyfin -- \
  tar xzf /tmp/jellyfin-config.tar.gz -C /config --strip-components=1

# 6. Restart pod
kubectl delete pod -l app=jellyfin -n jellyfin
```

### Disaster Recovery (Full Cluster)

**If entire cluster is lost**:

```bash
# 1. Reinstall K3s on new cluster
curl -sfL https://get.k3s.io | sh -

# 2. Restore ArgoCD Application
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Deploy playground (ArgoCD will auto-sync)
kubectl apply -f argocd/playground.yaml

# 4. Restore PVC data
# (See specific restore procedures above)

# 5. Verify all pods are running
kubectl get pods -A -l part-of=playground-stack
```

---

## Upgrades

### Kubernetes Cluster Upgrade

**K3s specific**:

```bash
# Check current version
kubectl version

# Plan upgrade (maintenance window required)
# 1. Notify users
# 2. Schedule downtime window

# Backup entire cluster
kubectl get all -A -o yaml > backup-pre-upgrade.yaml

# Perform upgrade
# For K3s, use distribution's upgrade method (Rancher, systemd, etc.)
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.28.0 sh -

# Verify upgrade
kubectl version
kubectl get nodes

# Monitor pods
kubectl get pods -A -w
```

### Application Image Upgrade

**Update Strategy**:

```bash
# 1. Update deployment image
kubectl set image deployment/n8n n8n=n8nio/n8n:v1.x.0 -n n8n

# 2. Monitor rollout
kubectl rollout status deployment/n8n -n n8n

# 3. Verify new version
kubectl exec -it deployment/n8n -n n8n -- n8n --version

# 4. Check for issues
kubectl logs -f deployment/n8n -n n8n

# 5. If issues, rollback
kubectl rollout undo deployment/n8n -n n8n
```

### Database Schema Migrations

**Before upgrading applications that use databases**:

```bash
# 1. Backup database
kubectl exec deployment/freshrss -n freshrss -- \
  sqlite3 /data/db.sqlite ".backup '/data/db.backup.sqlite'"

# 2. Note current schema version
kubectl exec deployment/freshrss -n freshrss -- \
  sqlite3 /data/db.sqlite "PRAGMA user_version;"

# 3. Upgrade application (triggers auto-migrations)
kubectl set image deployment/freshrss freshrss=freshrss/freshrss:v1.x.0 -n freshrss

# 4. Monitor migration process
kubectl logs -f deployment/freshrss -n freshrss

# 5. Verify schema upgrade
kubectl exec deployment/freshrss -n freshrss -- \
  sqlite3 /data/db.sqlite "PRAGMA user_version;"

# 6. If failed, restore from backup
kubectl exec deployment/freshrss -n freshrss -- \
  sqlite3 /data/db.sqlite ".restore '/data/db.backup.sqlite'"
```

---

## Common Issues

### Issue: Slow Application Performance

**Diagnosis**:

```bash
# Check resource utilization
kubectl top pod -n <namespace>
kubectl top node

# Check for OOMKilled events
kubectl get events -n <namespace> | grep OOMKilled

# Check disk I/O
kubectl exec node/<node-name> -- iostat -x 1 5

# Check network latency
kubectl exec <pod-name> -n <namespace> -- ping -c 5 kubernetes.default.svc
```

**Solutions**:

1. **Memory pressure**: Increase pod memory limit or reduce apps
2. **CPU throttling**: Increase CPU limit or reduce replica count
3. **Disk I/O**: Migrate to faster storage class, add SSD
4. **Network**: Check latency, consider local-path storage instead of NFS

### Issue: PVC Stuck in Pending

**Diagnosis**:
```bash
kubectl describe pvc <pvc-name> -n <namespace>
```

**Causes & Fixes**:

1. **No available storage on node**
   ```bash
   # Check node disk space
   kubectl describe node <node-name> | grep Allocatable
   
   # Add new node with available space
   ```

2. **Storage class doesn't exist**
   ```bash
   kubectl get storageclass
   
   # If missing, check K3s installation
   kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
   ```

3. **Node selector mismatch**
   ```bash
   # Remove node selector if app not running there
   kubectl patch pvc <pvc-name> -p '{"spec":{"nodeSelector": null}}'
   ```

### Issue: Pods Not Scheduling on Worker Nodes

**Diagnosis**:
```bash
# Check node labels
kubectl get nodes --show-labels

# Check pod node selector
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 "Node-Selectors"
```

**Fix**:
```bash
# Label worker nodes if missing
kubectl label nodes <node-name> node-role.kubernetes.io/worker=worker

# Or temporarily allow scheduling on control-plane (not recommended)
kubectl patch deployment/<app> -n <namespace> -p \
  '{"spec":{"template":{"spec":{"nodeSelector":null}}}}'
```

### Issue: Application Configuration Lost After Pod Restart

**Cause**: Configuration stored in container filesystem, not persisted.

**Solution**: Ensure ConfigMaps and volumes are properly mounted:

```bash
# Verify ConfigMap mount
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 "Mounts"

# If missing, update deployment
kubectl set env deployment/<app> CONFIG_PATH=/config/app.yaml -n <namespace>
```

### Issue: Database Lock Errors in Logs

**Cause**: SQLite database being accessed by multiple processes simultaneously.

**Solution**: Reduce replica count to 1:

```bash
# Check current replicas
kubectl get deployment <app> -n <namespace> -o jsonpath='{.spec.replicas}'

# Reduce to 1
kubectl scale deployment/<app> --replicas=1 -n <namespace>
```

---

## Emergency Procedures

### Force Delete a Stuck Pod

```bash
# Graceful deletion first
kubectl delete pod <pod-name> -n <namespace> --grace-period=30

# If still stuck, force delete
kubectl delete pod <pod-name> -n <namespace> --grace-period=0 --force
```

### Recover Node from NotReady State

```bash
# 1. Check node status
kubectl get nodes

# 2. Drain node if workers available
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data

# 3. SSH into node and check kubelet
systemctl status k3s

# 4. Restart kubelet
systemctl restart k3s

# 5. Uncordon node
kubectl uncordon <node>
```

### Emergency Cluster Shutdown

```bash
# 1. Drain all nodes
kubectl drain --all --ignore-daemonsets --delete-emptydir-data

# 2. Stop K3s on each node
systemctl stop k3s

# 3. When restarting, verify node status
kubectl get nodes
```

---

**Document Version**: 1.0
**Last Updated**: 2024
**For Questions**: Refer to README.md and ARCHITECTURE.md
