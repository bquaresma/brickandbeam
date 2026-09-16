variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Apex domain the app is served on"
  type        = string
  default     = "brickandbeamrentals.com"
}
