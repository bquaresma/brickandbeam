# All three security groups live here (not in infra/app) even though the
# ALB/ECS resources that use them live in the app stack. That avoids a
# circular cross-stack dependency: the app_sg needs a rule allowing traffic
# from alb_sg, and rds_sg needs a rule allowing traffic from app_sg. Keeping
# the whole chain in one stack means those references are same-stack, not
# cross-stack. The app stack just imports the IDs via remote state.

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "Allow inbound HTTP from the internet to the ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-alb" }
}

resource "aws_security_group" "app" {
  name        = "${local.name}-app"
  description = "Allow inbound app traffic from the ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App port from the ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-app" }
}

resource "aws_security_group" "rds" {
  name        = "${local.name}-rds"
  description = "Allow inbound Postgres from the app tasks only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Postgres from app tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = { Name = "${local.name}-rds" }
}
