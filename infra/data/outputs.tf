output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  value = aws_ecr_repository.app.name
}

output "database_url_parameter_arn" {
  value = aws_ssm_parameter.database_url.arn
}

output "auth_secret_parameter_arn" {
  value = aws_ssm_parameter.auth_secret.arn
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "domain_name" {
  value = var.domain_name
}

output "acm_certificate_arn" {
  value = aws_acm_certificate.app.arn
}

# Add each of these as a CNAME record at your DNS provider to validate the
# certificate. AWS validates automatically once they're visible (usually
# within minutes) — no Terraform re-apply needed.
output "acm_validation_records" {
  value = [
    for o in aws_acm_certificate.app.domain_validation_options : {
      name  = o.resource_record_name
      type  = o.resource_record_type
      value = o.resource_record_value
    }
  ]
}
