terraform {
  required_providers {
    infisical = {
      source  = "infisical/infisical"
      version = "0.19.31"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "3.2.1"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "infisical" {
  host = "http://infisical.nasat.local"
  auth = {
    universal = {
      client_id     = var.bootstrap_client_id
      client_secret = var.bootstrap_client_secret
    }
  }
}
