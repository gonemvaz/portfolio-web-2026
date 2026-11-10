terraform {
  required_providers {
    google = { source = "hashicorp/google", version = ">= 6.0" }
  }
  backend "gcs" {
    bucket = "porfolio-web-513914-tfstate"
    prefix = "portfolio"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  environments = toset(["staging", "production"])
}

# APIs que hay que habilitar en el proyecto
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# Registro donde se guardan las imágenes Docker
resource "google_artifact_registry_repository" "images" {
  repository_id = "portfolio"
  location      = var.region
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions { keep_count = 10 }
  }
  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition { older_than = "2592000s" } # 30 días
  }
  depends_on = [google_project_service.apis]
}

# Identidad con la que corre el sitio (sin permisos: solo sirve archivos)
resource "google_service_account" "runtime" {
  account_id   = "portfolio-runtime"
  display_name = "Portfolio (Cloud Run)"
}

# Un servicio de Cloud Run por ambiente
resource "google_cloud_run_v2_service" "site" {
  for_each            = local.environments
  name                = "portfolio-${each.key}"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.runtime.email
    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
    containers {
      # Imagen provisoria: a partir del primer deploy la reemplaza el CI
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      ports { container_port = 8080 }
      resources {
        limits   = { cpu = "1", memory = "256Mi" }
        cpu_idle = true
      }
    }
  }

  # El CI cambia la imagen en cada deploy; Terraform no tiene que revertirla
  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }
  depends_on = [google_project_service.apis]
}

# Sitio público: cualquiera puede visitarlo
resource "google_cloud_run_v2_service_iam_member" "public" {
  for_each = local.environments
  name     = google_cloud_run_v2_service.site[each.key].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# --- Acceso de GitHub Actions sin claves (Workload Identity Federation) ---

resource "google_service_account" "deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions deployer"
}

resource "google_project_iam_member" "deployer" {
  for_each = toset(["roles/run.developer", "roles/artifactregistry.writer"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.deployer.email}"
}

# El deployer puede desplegar servicios que corren como "runtime"
resource "google_service_account_iam_member" "deployer_acts_as_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
  # Solo tu repo puede usar esta puerta
  attribute_condition = "assertion.repository == \"${var.github_repo}\""
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_service_account_iam_member" "github_impersonates_deployer" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}
