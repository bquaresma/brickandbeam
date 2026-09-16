resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.public[*].id

  tags = { Name = local.name }
}

resource "aws_db_instance" "main" {
  identifier     = local.name
  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "brickandbeam"
  username = "brickandbeam"
  password = random_password.db.result
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false

  # Solo/early-stage project: skip the final snapshot so `terraform destroy`
  # doesn't hang waiting for one. Take a manual snapshot first
  # (`aws rds create-db-snapshot`) before destroying this stack if the data
  # needs to survive a teardown.
  skip_final_snapshot = true
  deletion_protection = false

  backup_retention_period = 3
}
