variable "bootstrap_client_id" {
  type      = string
  sensitive = true
}

variable "bootstrap_client_secret" {
  type      = string
  sensitive = true
}

variable "k8s_api_host" {
  type    = string
  default = "https://kubernetes.default.svc"
}

variable "k8s_ca_certificate" {
  type      = string
  sensitive = false
}

variable "token_reviewer_jwt" {
  type      = string
  sensitive = true
}

variable "organization_id" {
  type = string
}
