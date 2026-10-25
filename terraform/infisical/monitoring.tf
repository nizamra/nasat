# --- Monitoring (Alertmanager: Telegram bot token + chat id, Healthchecks.io ping URL) ---
# The secret VALUES are typed into the Infisical UI (project "Monitoring", environment "prod");
# Terraform only creates the project and the identity the operator logs in with.
resource "infisical_project" "monitoring" {
  name = "Monitoring"
  slug = "monitoring"
}

resource "infisical_identity" "monitoring" {
  name   = "alertmanager-operator"
  role   = "member"
  org_id = var.organization_id
}

resource "infisical_identity_kubernetes_auth" "monitoring" {
  identity_id                   = infisical_identity.monitoring.id
  kubernetes_host               = var.k8s_api_host
  kubernetes_ca_certificate     = var.k8s_ca_certificate
  token_reviewer_jwt            = var.token_reviewer_jwt
  allowed_namespaces            = ["monitoring"]
  allowed_service_account_names = ["alertmanager-infisical-reader"]
  token_reviewer_mode           = "api"
}

resource "infisical_project_identity" "monitoring" {
  project_id  = infisical_project.monitoring.id
  identity_id = infisical_identity.monitoring.id
  roles = [
    { role_slug = "viewer" }
  ]
}

# --- Kubernetes Secrets ---
resource "kubernetes_secret_v1" "monitoring_identity" {
  metadata {
    name      = "alertmanager-infisical-identity"
    namespace = "monitoring"
  }
  data = {
    identityId = infisical_identity.monitoring.id
  }
}
