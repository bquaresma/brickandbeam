variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
}

variable "image_tag" {
  description = "Docker image tag to deploy (set by CI to the git SHA)"
  type        = string
  default     = "latest"
}
