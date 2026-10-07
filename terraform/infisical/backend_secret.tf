# resource "kubernetes_manifest" "backend_static_secret_prod" {
#   manifest = {
#     apiVersion = "secrets.infisical.com/v1beta1"
#     kind       = "InfisicalStaticSecret"
#     metadata   = { name = "backend-static-secret", namespace = "nasat" }
#     spec = {
#       infisicalAuthRef = { name = "backend-auth", namespace = "nasat" }
#       syncOptions      = { refreshInterval = "60s" }
#       sources = [{
#         projectId       = infisical_project.backend.id
#         environmentSlug = "prod"
#         secretPath      = "/"
#       }]
#       targets = [{
#         name           = "backend-secrets"
#         namespace      = "nasat"
#         kind           = "Secret"
#         creationPolicy = "Owner"
#       }]
#     }
#   }
#   depends_on = [infisical_secret.backend_postgres]
# }

# # --- Backend Static Secret Staging ---
# resource "kubernetes_manifest" "backend_static_secret_staging" {
#   manifest = {
#     apiVersion = "secrets.infisical.com/v1beta1"
#     kind       = "InfisicalStaticSecret"
#     metadata   = { name = "backend-static-secret", namespace = "nasat" }
#     spec = {
#       infisicalAuthRef = { name = "backend-auth", namespace = "nasat" }
#       syncOptions      = { refreshInterval = "60s" }
#       sources = [{
#         projectId       = infisical_project.backend.id
#         environmentSlug = "staging"
#         secretPath      = "/"
#       }]
#       targets = [{
#         name           = "backend-secrets"
#         namespace      = "nasat"
#         kind           = "Secret"
#         creationPolicy = "Owner"
#       }]
#     }
#   }
#   depends_on = [infisical_secret.backend_postgres]
# }
