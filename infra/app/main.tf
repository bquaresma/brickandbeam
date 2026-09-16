terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = "brickandbeam"
}

# Reads the data stack's outputs (VPC, subnets, security groups, ECR repo,
# SSM secrets) so this stack never has to duplicate or hardcode them. This
# is the only link between the two stacks — destroying/recreating this one
# never touches infra/data.
data "terraform_remote_state" "data" {
  backend = "s3"

  config = {
    bucket = "brickandbeam-terraform-state-556122828441"
    key    = "data/terraform.tfstate"
    region = "us-west-2"
  }
}
