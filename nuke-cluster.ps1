# nuke-cluster.ps1 — Wipe all Argo-managed workloads from a K3s cluster.
# Keeps: default, kube-node-lease, kube-public, kube-system
# Requires: kubectl on PATH.
# Usage: powershell -ExecutionPolicy Bypass -File .\nuke-cluster.ps1

$ErrorActionPreference = "Continue"

function Section($t) { Write-Host ""; Write-Host "==== $t ====" -ForegroundColor Cyan }
function OK($t)      { Write-Host "  [OK]   $t" -ForegroundColor Green }
function BAD($t)     { Write-Host "  [FAIL] $t" -ForegroundColor Red }
function NOTE($t)    { Write-Host "  ...    $t" -ForegroundColor DarkGray }

function Get-Json($raw) {
  if (-not $raw) { return $null }
  $s = ($raw | Out-String).Trim()
  if (-not $s.StartsWith("{")) { return $null }
  try { return $s | ConvertFrom-Json } catch { return $null }
}

$patchFile  = Join-Path $env:TEMP "finalizer-null.json"
'{"metadata":{"finalizers":null}}' | Out-File -Encoding ascii -NoNewline $patchFile
$lhFlagFile = Join-Path $env:TEMP "lh-flag.json"
'{"value":"true"}' | Out-File -Encoding ascii -NoNewline $lhFlagFile

$namespaces = @("argocd","infisical","infisical-operator","longhorn-system","monitoring","playground","gotify","homepage","nasat","nasat-staging")

# ---------------------------------------------------------------
# 0. Freeze Argo CD. MUST run before deleting Applications,
#    otherwise the controller re-creates them from git.
# ---------------------------------------------------------------
Section "0. Scaling Argo CD controllers to zero"

# Applicationset controller first (it creates new Applications)
$ok = kubectl -n argocd get deploy argocd-applicationset-controller -o name 2>&1
if ($LASTEXITCODE -eq 0) {
  kubectl -n argocd scale deploy argocd-applicationset-controller --replicas=0
  if ($LASTEXITCODE -eq 0) { OK "scaled deploy/argocd-applicationset-controller to 0" } else { BAD "scale applicationset-controller failed" }
} else { NOTE "deploy/argocd-applicationset-controller not present" }

# Application controller (statefulset in most installs, deploy in others)
$ok = kubectl -n argocd get statefulset argocd-application-controller -o name 2>&1
if ($LASTEXITCODE -eq 0) {
  kubectl -n argocd scale statefulset argocd-application-controller --replicas=0
  if ($LASTEXITCODE -eq 0) { OK "scaled statefulset/argocd-application-controller to 0" } else { BAD "scale sts/argocd-application-controller failed" }
} else { NOTE "statefulset/argocd-application-controller not present" }

$ok = kubectl -n argocd get deploy argocd-application-controller -o name 2>&1
if ($LASTEXITCODE -eq 0) {
  kubectl -n argocd scale deploy argocd-application-controller --replicas=0
  if ($LASTEXITCODE -eq 0) { OK "scaled deploy/argocd-application-controller to 0" } else { BAD "scale deploy/argocd-application-controller failed" }
} else { NOTE "deploy/argocd-application-controller not present" }

# The rest of Argo CD — nice to have down, not strictly required
foreach ($d in @("argocd-server","argocd-repo-server","argocd-notifications-controller","argocd-dex-server","argocd-redis")) {
  $null = kubectl -n argocd get deploy $d -o name 2>&1
  if ($LASTEXITCODE -eq 0) {
    kubectl -n argocd scale deploy $d --replicas=0
    if ($LASTEXITCODE -eq 0) { OK "scaled deploy/$d to 0" } else { BAD "scale deploy/$d failed" }
  } else { NOTE "deploy/$d not present" }
}

# ---------------------------------------------------------------
# 1. Delete Argo Applications + strip finalizers
# ---------------------------------------------------------------
Section "1a. Deleting Argo Applications"
kubectl -n argocd delete applications --all --ignore-not-found --wait=false
if ($LASTEXITCODE -eq 0) { OK "delete applications --all" } else { BAD "delete applications --all failed" }

Section "1b. Stripping finalizers from Argo Applications"
$apps = Get-Json (kubectl -n argocd get applications -o json 2>&1)
if ($apps -and $apps.items) {
  foreach ($app in $apps.items) {
    $n = $app.metadata.name
    kubectl -n argocd patch application $n --type=merge --patch-file $patchFile
    if ($LASTEXITCODE -eq 0) { OK "patched application/$n" } else { BAD "patch application/$n failed" }
  }
} else { NOTE "no applications to patch (or list failed)" }

Section "1c. Waiting for Argo Applications to disappear (max 2 min)"
$deadline = (Get-Date).AddMinutes(2)
while ((Get-Date) -lt $deadline) {
  $out = (kubectl -n argocd get applications -o name 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or $out -match "No resources found" -or $out -eq "") { break }
  NOTE "still present: $($out -replace "`n", ', ')"
  Start-Sleep 4
}
kubectl -n argocd get applications

# ---------------------------------------------------------------
# 2. Longhorn — clean up while its manager is still alive
# ---------------------------------------------------------------
Section "2a. Deleting Longhorn uninstall jobs/pods (they are fighting you)"
kubectl -n longhorn-system delete job longhorn-uninstall --ignore-not-found
if ($LASTEXITCODE -eq 0) { OK "deleted job/longhorn-uninstall" } else { BAD "delete longhorn-uninstall failed" }
kubectl -n longhorn-system delete pods -l longhorn.io/component=uninstall --force --grace-period=0 --ignore-not-found
if ($LASTEXITCODE -eq 0) { OK "force-deleted longhorn uninstall pods" } else { BAD "delete uninstall pods failed" }

Section "2b. Setting Longhorn deleting-confirmation-flag"
kubectl -n longhorn-system patch settings.longhorn.io deleting-confirmation-flag --type=merge --patch-file $lhFlagFile
if ($LASTEXITCODE -eq 0) { OK "set deleting-confirmation-flag=true" } else { BAD "set deleting-confirmation-flag failed" }

Section "2c. Removing Longhorn admission webhooks"
kubectl delete validatingwebhookconfiguration longhorn-webhook-validator --ignore-not-found
if ($LASTEXITCODE -eq 0) { OK "deleted validatingwebhook/longhorn-webhook-validator" } else { BAD "delete vwc failed" }
kubectl delete mutatingwebhookconfiguration longhorn-webhook-mutator --ignore-not-found
if ($LASTEXITCODE -eq 0) { OK "deleted mutatingwebhook/longhorn-webhook-mutator" } else { BAD "delete mwc failed" }

Section "2d. Stripping finalizers from Longhorn CRs"
$longhornCRDs = @(
  "nodes.longhorn.io","replicas.longhorn.io","volumes.longhorn.io","engines.longhorn.io",
  "volumeattachments.longhorn.io","orphans.longhorn.io","settings.longhorn.io","shards.longhorn.io",
  "shardgroups.longhorn.io","sharemanagers.longhorn.io","snapshots.longhorn.io","supportbundles.longhorn.io",
  "systembackups.longhorn.io","systemrestores.longhorn.io","recurringjobs.longhorn.io","engineimages.longhorn.io",
  "enginefrontends.longhorn.io","backuptargets.longhorn.io","backupvolumes.longhorn.io"
)
foreach ($crd in $longhornCRDs) {
  $items = Get-Json (kubectl get $crd -A -o json 2>&1)
  if (-not $items -or -not $items.items) { continue }
  foreach ($it in $items.items) {
    $ns = $it.metadata.namespace
    $nm = $it.metadata.name
    if ($ns) { kubectl -n $ns patch $crd $nm --type=merge --patch-file $patchFile }
    else     { kubectl patch $crd $nm --type=merge --patch-file $patchFile }
    if ($LASTEXITCODE -eq 0) { OK "patched $crd/$nm" } else { BAD "patch $crd/$nm failed" }
  }
}

# ---------------------------------------------------------------
# 2e. Force-delete every pod in the target namespaces
#     Pods hold PVCs; PVCs hold PVs; nothing downstream can clean
#     up until the pods are gone.
# ---------------------------------------------------------------
Section "2e. Force-deleting pods in target namespaces"
foreach ($ns in $namespaces) {
  $null = kubectl get ns $ns -o name 2>&1
  if ($LASTEXITCODE -ne 0) { NOTE "ns/$ns not present, skipping"; continue }
  $pods = (kubectl -n $ns get pods -o name 2>&1 | Out-String).Trim()
  if (-not $pods -or $pods -match "No resources found") { NOTE "ns/$ns has no pods"; continue }
  kubectl -n $ns delete pods --all --force --grace-period=0 --ignore-not-found
  if ($LASTEXITCODE -eq 0) { OK "force-deleted pods in ns/$ns" } else { BAD "force-delete pods in ns/$ns failed" }
}
NOTE "waiting 10s for PVC protection to clear..."
Start-Sleep 10

# ---------------------------------------------------------------
# 3. Delete user namespaces
# ---------------------------------------------------------------
Section "3. Deleting user namespaces"
foreach ($ns in $namespaces) {
  kubectl delete ns $ns --ignore-not-found --wait=false
  if ($LASTEXITCODE -eq 0) { OK "delete ns/$ns requested" } else { BAD "delete ns/$ns failed" }
}

Section "3b. Waiting for namespaces to vanish (max 3 min)"
$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline) {
  $still = @()
  foreach ($ns in $namespaces) {
    $null = kubectl get ns $ns -o name 2>&1
    if ($LASTEXITCODE -eq 0) { $still += $ns }
  }
  if ($still.Count -eq 0) { break }
  NOTE "still present: $($still -join ', ')"
  Start-Sleep 5
}

# ---------------------------------------------------------------
# 4. Force-finalize remaining namespaces (spec.finalizers, NOT metadata)
# ---------------------------------------------------------------
Section "4. Force-finalizing stuck namespaces"
foreach ($ns in $namespaces) {
  $null = kubectl get ns $ns -o name 2>&1
  if ($LASTEXITCODE -ne 0) { NOTE "ns/$ns already gone"; continue }
  $obj = Get-Json (kubectl get ns $ns -o json 2>&1)
  if (-not $obj) { BAD "could not read ns/$ns json"; continue }
  # NAMESPACE finalizers live on .spec.finalizers, not .metadata.finalizers
  $obj.spec | Add-Member -NotePropertyName finalizers -NotePropertyValue @() -Force
  $tmp = Join-Path $env:TEMP "ns-$ns-finalize.json"
  ($obj | ConvertTo-Json -Depth 100 -Compress) | Out-File -Encoding ascii -NoNewline $tmp
  kubectl replace --raw "/api/v1/namespaces/$ns/finalize" -f $tmp
  if ($LASTEXITCODE -eq 0) { OK "finalized ns/$ns" } else { BAD "finalize ns/$ns failed" }
}

# ---------------------------------------------------------------
# 5. Strip finalizers from PVCs and PVs (before CRDs)
# ---------------------------------------------------------------
Section "5a. Stripping PVC finalizers"
$pvcs = Get-Json (kubectl get pvc -A -o json 2>&1)
if ($pvcs -and $pvcs.items) {
  foreach ($p in $pvcs.items) {
    $pns = $p.metadata.namespace
    $pnm = $p.metadata.name
    kubectl -n $pns patch pvc $pnm --type=merge --patch-file $patchFile
    if ($LASTEXITCODE -eq 0) { OK "patched pvc/$pns/$pnm" } else { BAD "patch pvc/$pnm failed" }
  }
} else { NOTE "no PVCs to patch" }

Section "5b. Stripping PV finalizers"
$pvs = Get-Json (kubectl get pv -o json 2>&1)
if ($pvs -and $pvs.items) {
  foreach ($p in $pvs.items) {
    $pnm = $p.metadata.name
    kubectl patch pv $pnm --type=merge --patch-file $patchFile
    if ($LASTEXITCODE -eq 0) { OK "patched pv/$pnm" } else { BAD "patch pv/$pnm failed" }
  }
} else { NOTE "no PVs to patch" }

# ---------------------------------------------------------------
# 6. Delete CRDs
# ---------------------------------------------------------------
Section "6a. Stripping CRD finalizers"
$crdMatches = kubectl get crd -o name 2>&1 | Select-String "argoproj|longhorn|infisical|monitoring.coreos"
foreach ($crd in $crdMatches) {
  $name = $crd.ToString().Split("/")[-1]
  kubectl patch crd $name --type=merge --patch-file $patchFile
  if ($LASTEXITCODE -eq 0) { OK "patched crd/$name" } else { BAD "patch crd/$name failed" }
}

Section "6b. Deleting CRDs"
foreach ($crd in $crdMatches) {
  $name = $crd.ToString()
  kubectl delete $name --ignore-not-found
  if ($LASTEXITCODE -eq 0) { OK "deleted $name" } else { BAD "delete $name failed" }
}

# ---------------------------------------------------------------
# 7. Leftovers
# ---------------------------------------------------------------
Section "7. Deleting leftover PVs, PVCs, ingresses"
kubectl delete pv --all --force --grace-period=0 --ignore-not-found
if ($LASTEXITCODE -eq 0) { OK "deleted all PVs" } else { BAD "delete PVs failed" }
kubectl delete pvc -A --all --force --grace-period=0 --ignore-not-found
if ($LASTEXITCODE -eq 0) { OK "deleted all PVCs" } else { BAD "delete PVCs failed" }
kubectl delete ingress -A --all --force --grace-period=0 --ignore-not-found
if ($LASTEXITCODE -eq 0) { OK "deleted all ingresses" } else { BAD "delete ingresses failed" }

# ---------------------------------------------------------------
# 8. Final state
# ---------------------------------------------------------------
Section "8. Final state"
Write-Host "--- namespaces ---"
kubectl get ns
Write-Host "--- pv ---"
kubectl get pv
Write-Host "--- pvc ---"
kubectl get pvc -A
Write-Host "--- crds (filtered) ---"
kubectl get crd | Select-String "argoproj|longhorn|infisical|monitoring"
Write-Host "--- all workloads ---"
kubectl get all -A
Write-Host "--- ingress ---"
kubectl get ingress -A

Write-Host ""
Write-Host "Done. If any namespace is still Terminating, re-run this script." -ForegroundColor Yellow