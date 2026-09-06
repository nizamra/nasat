terraform {
  required_providers {
    infisical = {
      source  = "infisical/infisical"
      version = "0.19.31"
    }
  }
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
