# Lives here, not in infra/app, so tearing down the app stack (ALB/ECS)
# never invalidates or re-triggers DNS validation for this certificate.
resource "aws_acm_certificate" "app" {
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}
