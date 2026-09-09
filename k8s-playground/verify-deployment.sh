#!/bin/bash

# Playground Stack Verification Script
# This script validates the entire playground stack deployment

set -e

echo "=================================="
echo "Playground Stack Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  FAILED=1
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Initialize failure flag
FAILED=0

# 1. Check Kubernetes cluster connectivity
echo "1. Checking Kubernetes cluster..."
if kubectl cluster-info &>/dev/null; then
  check_pass "Kubernetes cluster accessible"
else
  check_fail "Cannot connect to Kubernetes cluster"
  exit 1
fi

# 2. Check worker node labels
echo ""
echo "2. Checking worker node labels..."
LABELED_NODES=$(kubectl get nodes -L node-role.kubernetes.io/worker 2>/dev/null | grep worker | wc -l)
if [ "$LABELED_NODES" -gt 0 ]; then
  check_pass "Found $LABELED_NODES worker node(s) with correct label"
  kubectl get nodes --show-labels | grep worker
else
  check_fail "No worker nodes found with label 'node-role.kubernetes.io/worker=worker'"
  check_warn "Label your worker nodes: kubectl label nodes <node-name> node-role.kubernetes.io/worker=worker"
fi

# 3. Check Traefik ingress
echo ""
echo "3. Checking Traefik ingress controller..."
if kubectl get deployment -n kube-system traefik &>/dev/null; then
  check_pass "Traefik ingress controller found"
else
  check_fail "Traefik ingress controller not found"
fi

# 4. Check storage class
echo ""
echo "4. Checking storage class..."
if kubectl get storageclass &>/dev/null; then
  check_pass "Storage class available"
  kubectl get storageclass
else
  check_fail "No storage class found"
fi

# 5. Check ArgoCD
echo ""
echo "5. Checking ArgoCD..."
if kubectl get namespace argocd &>/dev/null; then
  check_pass "ArgoCD namespace exists"
  if kubectl get deployment argocd-server -n argocd &>/dev/null; then
    check_pass "ArgoCD server deployment found"
  else
    check_fail "ArgoCD server deployment not found"
  fi
else
  check_warn "ArgoCD namespace not found - may need to install"
fi

# 6. Check playground applications
echo ""
echo "6. Checking playground applications..."
NAMESPACES=("linkding" "n8n" "homepage" "jellyfin" "freshrss" "immich")
for ns in "${NAMESPACES[@]}"; do
  if kubectl get namespace "$ns" &>/dev/null; then
    POD_COUNT=$(kubectl get pods -n "$ns" 2>/dev/null | wc -l)
    if [ "$POD_COUNT" -gt 1 ]; then
      READY=$(kubectl get pods -n "$ns" -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
      if [ "$READY" = "True" ]; then
        check_pass "Namespace '$ns' - pods running and ready"
      else
        check_warn "Namespace '$ns' - pods exist but not all ready"
      fi
    else
      check_warn "Namespace '$ns' exists but no pods found"
    fi
  else
    check_warn "Namespace '$ns' not deployed yet"
  fi
done

# 7. Check PVCs
echo ""
echo "7. Checking Persistent Volume Claims..."
PVC_COUNT=$(kubectl get pvc -A 2>/dev/null | wc -l)
if [ "$PVC_COUNT" -gt 1 ]; then
  check_pass "Found $((PVC_COUNT - 1)) PVC(s)"
  kubectl get pvc -A
else
  check_warn "No PVCs found"
fi

# 8. Check ingress resources
echo ""
echo "8. Checking ingress resources..."
INGRESS_COUNT=$(kubectl get ingress -A 2>/dev/null | wc -l)
if [ "$INGRESS_COUNT" -gt 1 ]; then
  check_pass "Found $((INGRESS_COUNT - 1)) ingress resource(s)"
  kubectl get ingress -A
else
  check_warn "No ingress resources found"
fi

# 9. Check DNS/Network (optional)
echo ""
echo "9. Checking DNS resolution (optional)..."
DOMAINS=("n8n.nasat.local" "homepage.nasat.local" "jellyfin.nasat.local" "freshrss.nasat.local" "bookmarks.nasat.local" "immich.nasat.local")
for domain in "${DOMAINS[@]}"; do
  if nslookup "$domain" &>/dev/null; then
    check_pass "Domain '$domain' resolves"
  else
    check_warn "Domain '$domain' does not resolve - configure DNS or /etc/hosts"
  fi
done

# 10. Check node pod scheduling
echo ""
echo "10. Verifying pod scheduling on worker nodes..."
NON_SYSTEM_PODS=$(kubectl get pods -A --field-selector=status.phase=Running \
  -o jsonpath='{range .items[?(@.metadata.namespace != "kube-system" && @.metadata.namespace != "kube-public" && @.metadata.namespace != "argocd")]}{.metadata.name}{"\t"}{.spec.nodeName}{"\n"}{end}' 2>/dev/null)

if [ -n "$NON_SYSTEM_PODS" ]; then
  echo "Pods running on nodes:"
  echo "$NON_SYSTEM_PODS"
  # Check if any are on control-plane
  if echo "$NON_SYSTEM_PODS" | grep -i "control-plane\|master" &>/dev/null; then
    check_warn "Some pods are running on control-plane nodes (not ideal)"
  else
    check_pass "All playground pods running on worker nodes"
  fi
else
  check_warn "No non-system pods found running"
fi

# 11. Resource usage summary
echo ""
echo "11. Cluster resource summary..."
echo ""
echo "Node resources:"
kubectl top node 2>/dev/null || check_warn "Metrics server not available (metrics-server not installed)"

echo ""
echo "Pod resources (playground only):"
kubectl top pod -A -l part-of=playground-stack 2>/dev/null || check_warn "No metrics available for playground pods"

# Final summary
echo ""
echo "=================================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ Verification complete - all checks passed!${NC}"
else
  echo -e "${RED}✗ Verification complete - some issues found above${NC}"
fi
echo "=================================="
echo ""

# Print helpful next steps
echo "Next steps:"
echo "1. Configure DNS for .nasat.local domains"
echo "2. Access applications via ingress URLs"
echo "3. Monitor with: kubectl get pods -A -w"
echo "4. View logs with: kubectl logs -f deployment/<app> -n <namespace>"
echo "5. Port-forward for testing: kubectl port-forward -n n8n svc/n8n 8080:80"
echo ""
