terraform {
  backend "s3" {
    bucket         = "brickandbeam-terraform-state-556122828441"
    key            = "app/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "brickandbeam-terraform-locks"
    encrypt        = true
  }
}
