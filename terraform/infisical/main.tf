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

resource "kubernetes_secret_v1" "immich_identity" {
  metadata {
    name      = "immich-infisical-identity"
    namespace = "immich"
  }
  data = {
    identityId = infisical_identity.immich.id
  }
}


# --- Kubernetes Secrets Backend PROD (nasat) ---
resource "infisical_project" "backend" {
  name = "Nasat Backend"
  slug = "nasat-backend"
}

resource "infisical_identity" "backend_prod" {
  name   = "backend-operator-prod"
  role   = "member"
  org_id = var.organization_id
}

resource "infisical_identity_kubernetes_auth" "backend_prod" {
  identity_id                   = infisical_identity.backend_prod.id
  kubernetes_host               = var.k8s_api_host
  kubernetes_ca_certificate     = var.k8s_ca_certificate
  token_reviewer_jwt            = var.token_reviewer_jwt
  allowed_namespaces            = ["nasat"]
  allowed_service_account_names = ["backend-infisical-reader"]
  token_reviewer_mode           = "api"
}

resource "infisical_project_identity" "backend_prod" {
  project_id  = infisical_project.backend.id
  identity_id = infisical_identity.backend_prod.id
  roles = [
    { role_slug = "viewer" }
  ]
}

resource "kubernetes_secret_v1" "backend_prod_identity" {
  metadata {
    name      = "backend-infisical-identity"
    namespace = "nasat"
  }
  data = {
    identityId = infisical_identity.backend_prod.id
  }
}
