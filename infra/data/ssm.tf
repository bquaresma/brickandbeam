resource "random_password" "auth_secret" {
  length  = 44
  special = false
}

# SSM Parameter Store (not Secrets Manager) — free, and plenty for this
# scale. The ECS task execution role reads these by ARN at container start.
resource "aws_ssm_parameter" "database_url" {
  name  = "/${local.name}/database_url"
  type  = "SecureString"
  value = "postgresql://${aws_db_instance.main.username}:${random_password.db.result}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
}

resource "aws_ssm_parameter" "auth_secret" {
  name  = "/${local.name}/auth_secret"
  type  = "SecureString"
  value = random_password.auth_secret.result
}
