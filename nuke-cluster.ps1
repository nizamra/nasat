# nuke-cluster.ps1 — Wipe all Argo-managed workloads from a K3s cluster.
# Keeps: default, kube-node-lease, kube-public, kube-system
# Requires: kubectl on PATH.
# Usage: powershell -ExecutionPolicy Bypass -File .\nuke-cluster.ps1

$ErrorActionPreference = "Continue"

# Patch file used everywhere (PowerShell mangles inline JSON)
$patchFile = Join-Path $env:TEMP "finalizer-null.json"
'{"metadata":{"finalizers":null}}' | Out-File -Encoding ascii $patchFile

$namespaces = @(
  "argocd",
  "infisical",
  "infisical-operator",
  "longhorn-system",
  "monitoring",
  "playground",
  "gotify",
  "homepage",
  "nasat",
  "nasat-staging"
)

# ---------------------------------------------------------------- 1. Argo Applications
# Must happen BEFORE deleting namespaces, otherwise cleanup hooks fail because the
# namespace they need is already gone and the Application stays stuck with a
# pre-delete-finalizer forever.

Write-Host "==> Deleting Argo Applications"
kubectl -n argocd delete applications --all --ignore-not-found 2>$null | Out-Null

# Strip finalizers from any Application that refuses to go away (pre-delete-finalizer
# cleanup hook fails when the target namespace is gone).
Write-Host "==> Stripping finalizers from stuck Argo Applications"
$apps = kubectl -n argocd get applications -o json 2>$null | ConvertFrom-Json
if ($apps -and $apps.items) {
  foreach ($app in $apps.items) {
    kubectl -n argocd patch application $app.metadata.name --type=merge --patch-file $patchFile 2>$null | Out-Null
  }
}

# Wait for Argo Applications to actually disappear (max 3 minutes)
Write-Host "==> Waiting for Argo Applications to disappear..."
$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline) {
  $out = kubectl -n argocd get applications 2>$null
  if (-not $out -or $out -match "No resources found") { break }
  Start-Sleep 5
}

# ---------------------------------------------------------------- 2. Namespaces
Write-Host "==> Deleting user namespaces"
foreach ($ns in $namespaces) {
  kubectl delete ns $ns --ignore-not-found 2>$null | Out-Null
}

# ---------------------------------------------------------------- 3. Webhooks
# Longhorn's admission webhooks block CR/CRD deletion once the service is gone.
Write-Host "==> Killing Longhorn admission webhooks"
kubectl delete validatingwebhookconfiguration longhorn-webhook-validator --ignore-not-found 2>$null | Out-Null
kubectl delete mutatingwebhookconfiguration  longhorn-webhook-mutator   --ignore-not-found 2>$null | Out-Null

# ---------------------------------------------------------------- 4. Longhorn CRs
Write-Host "==> Stripping finalizers from Longhorn CRs"
$longhornCRDs = @(
  "nodes.longhorn.io","replicas.longhorn.io","volumes.longhorn.io",
  "engines.longhorn.io","volumeattachments.longhorn.io","orphans.longhorn.io",
  "settings.longhorn.io","shards.longhorn.io","shardgroups.longhorn.io",
  "sharemanagers.longhorn.io","snapshots.longhorn.io","supportbundles.longhorn.io",
  "systembackups.longhorn.io","systemrestores.longhorn.io","recurringjobs.longhorn.io",
  "engineimages.longhorn.io","enginefrontends.longhorn.io","backuptargets.longhorn.io",
  "backupvolumes.longhorn.io"
)
foreach ($crd in $longhornCRDs) {
  $items = kubectl get $crd -A -o json 2>$null | ConvertFrom-Json
  if ($items -and $items.items) {
    foreach ($item in $items.items) {
      kubectl patch $crd $item.metadata.name -n $item.metadata.namespace `
        --type=merge --patch-file $patchFile 2>$null | Out-Null
    }
  }
}

# ---------------------------------------------------------------- 5. PVCs / PVs
Write-Host "==> Stripping finalizers from PVCs and PVs"
$pvcs = kubectl get pvc -A -o json 2>$null | ConvertFrom-Json
if ($pvcs -and $pvcs.items) {
  foreach ($pvc in $pvcs.items) {
    kubectl patch pvc $pvc.metadata.name -n $pvc.metadata.namespace `
      --type=merge --patch-file $patchFile 2>$null | Out-Null
  }
}
$pvs = kubectl get pv -o json 2>$null | ConvertFrom-Json
if ($pvs -and $pvs.items) {
  foreach ($pv in $pvs.items) {
    kubectl patch pv $pv.metadata.name --type=merge --patch-file $patchFile 2>$null | Out-Null
  }
}

# ---------------------------------------------------------------- 6. CRDs
Write-Host "==> Stripping finalizers and deleting CRDs"
$crdMatches = kubectl get crd -o name 2>$null | Select-String "argoproj|longhorn|infisical|monitoring.coreos"
foreach ($crd in $crdMatches) {
  $name = $crd.ToString().Split("/")[-1]
  kubectl patch crd $name --type=merge --patch-file $patchFile 2>$null | Out-Null
}
foreach ($crd in $crdMatches) {
  kubectl delete $crd.ToString() --ignore-not-found 2>$null | Out-Null
}

# ---------------------------------------------------------------- 7. Namespace finalizers
Write-Host "==> Force-finalizing stuck namespaces"
foreach ($ns in $namespaces) {
  $exists = kubectl get ns $ns 2>$null
  if ($LASTEXITCODE -eq 0) {
    kubectl get ns $ns -o json 2>$null `
      | ForEach-Object { $_ -replace '"finalizers":\[.*?\]','"finalizers":[]' } `
      | kubectl replace --raw "/api/v1/namespaces/$ns/finalize" -f - 2>$null | Out-Null
  }
}

# ---------------------------------------------------------------- 8. Leftovers
Write-Host "==> Deleting PVs, PVCs, ingresses"
kubectl delete pv --all --force --grace-period=0 --ignore-not-found 2>$null | Out-Null
kubectl delete pvc -A --all --force --grace-period=0 --ignore-not-found 2>$null | Out-Null
kubectl delete ingress -A --all --force --grace-period=0 --ignore-not-found 2>$null | Out-Null

# ---------------------------------------------------------------- 9. Final state
Write-Host ""
Write-Host "==> Final state"
kubectl get ns
Write-Host ""
kubectl get pv,pvc -A
Write-Host ""
kubectl get crd | Select-String "argoproj|longhorn|infisical|monitoring"
Write-Host ""
kubectl get all -A
Write-Host ""
kubectl get ingress -A

Write-Host ""
Write-Host "Done. If any namespace is still Terminating, re-run this script."
