# --- Gotify ---
resource "infisical_project" "gotify" {
  name = "Gotify"
  slug = "gotify"
}

resource "infisical_identity" "gotify" {
  name   = "gotify-operator"
  role   = "member"
  org_id = var.organization_id
}

resource "infisical_identity_kubernetes_auth" "gotify" {
  identity_id                   = infisical_identity.gotify.id
  kubernetes_host               = var.k8s_api_host
  kubernetes_ca_certificate     = var.k8s_ca_certificate
  token_reviewer_jwt            = var.token_reviewer_jwt
  allowed_namespaces            = ["gotify"]
  allowed_service_account_names = ["gotify-infisical-reader"]
  token_reviewer_mode           = "api"
}

resource "infisical_project_identity" "gotify" {
  project_id  = infisical_project.gotify.id
  identity_id = infisical_identity.gotify.id
  roles = [
    { role_slug = "viewer" }
  ]
}

# --- Kubernetes Secrets ---
resource "kubernetes_secret_v1" "gotify_identity" {
  metadata {
    name      = "gotify-infisical-identity"
    namespace = "gotify"
  }
  data = {
    identityId = infisical_identity.gotify.id
  }
}
