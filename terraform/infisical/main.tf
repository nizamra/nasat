locals {
  backend_envs = toset(["staging", "prod"])
}

resource "infisical_project" "backend" {
  name = "Nasat Backend"
  slug = "nasat-backend"
}
resource "random_password" "backend_postgres" {
  for_each = local.backend_envs
  length   = 32
  special  = false
}

resource "infisical_secret" "backend_postgres" {
  for_each     = local.backend_envs
  name         = "POSTGRES_PASSWORD"
  value        = random_password.backend_postgres[each.key].result
  env_slug     = each.key
  workspace_id = infisical_project.backend.id
  folder_path  = "/"
}



resource "infisical_identity" "backend" {
  name   = "backend-operator"
  role   = "member"
  org_id = var.organization_id
}

resource "infisical_identity_kubernetes_auth" "backend" {
  identity_id                   = infisical_identity.backend.id
  kubernetes_host               = var.k8s_api_host
  kubernetes_ca_certificate     = var.k8s_ca_certificate
  token_reviewer_jwt            = var.token_reviewer_jwt
  allowed_namespaces            = ["nasat-staging"]
  allowed_service_account_names = ["backend-infisical-reader"]
  token_reviewer_mode           = "api"
}

resource "infisical_project_identity" "backend" {
  project_id  = infisical_project.backend.id
  identity_id = infisical_identity.backend.id
  roles = [
    { role_slug = "viewer" }
  ]
}

resource "kubernetes_secret_v1" "backend_identity" {
  metadata {
    name      = "backend-infisical-identity"
    namespace = "nasat-staging"
  }
  data = {
    identityId = infisical_identity.backend.id
  }
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
