# All values below are written to terraform.tfvars by ansible-k3s/playbooks/10-infisical-bootstrap.yaml.
variable "infisical_host" {
  type        = string
  description = "URL of the Infisical instance as reachable from this PC."
  default     = "http://infisical.nasat.local"
}

variable "kubeconfig_path" {
  type        = string
  description = "Kubeconfig used by the kubernetes provider."
  default     = "~/.kube/config"
}

variable "k8s_api_host" {
  type        = string
  description = "API server address as Infisical (running inside the cluster) reaches it, for TokenReview."
  default     = "https://kubernetes.default.svc"
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
