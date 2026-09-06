resource "infisical_project" "immich" {
  name = "Immich"
  slug = "immich"
}

resource "infisical_identity" "immich" {
  name   = "immich-operator"
  role   = "member"
  org_id = var.organization_id
}

resource "infisical_identity_kubernetes_auth" "immich" {
  identity_id                   = infisical_identity.immich.id
  kubernetes_host               = var.k8s_api_host
  kubernetes_ca_certificate     = var.k8s_ca_certificate
  token_reviewer_jwt            = var.token_reviewer_jwt
  allowed_namespaces            = ["immich"]
  allowed_service_account_names = ["immich-infisical-reader"]
  token_reviewer_mode           = "api"
}

resource "infisical_project_identity" "immich" {
  project_id  = infisical_project.immich.id
  identity_id = infisical_identity.immich.id
  roles = [
    { role_slug = "viewer" }
  ]
}

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
