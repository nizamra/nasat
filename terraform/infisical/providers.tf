terraform {
  required_providers {
    infisical = {
      source  = "infisical/infisical"
      version = "0.20.1"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "3.3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.9.1"
    }
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}

# No credentials in the code. The provider logs in with environment variables that
# playbook 10 sets for the run:
#   INFISICAL_AUTH_METHOD=token      INFISICAL_TOKEN=<root token from `infisical bootstrap`>
# or, when kubeconfig/infisical-universal.json exists:
#   INFISICAL_AUTH_METHOD=universal  INFISICAL_UNIVERSAL_AUTH_CLIENT_ID / _CLIENT_SECRET
# For a manual run, export the same variables yourself.
provider "infisical" {
  host = var.infisical_host
}
