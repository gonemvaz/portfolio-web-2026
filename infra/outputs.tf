output "wif_provider" { value = google_iam_workload_identity_pool_provider.github.name }
output "deployer_sa"  { value = google_service_account.deployer.email }
output "urls"         { value = { for k, s in google_cloud_run_v2_service.site : k => s.uri } }
