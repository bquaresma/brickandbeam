# Infrastructure

AWS account `556122828441` (`us-west-2`). Two Terraform stacks plus a one-time manual bootstrap.

## Bootstrap (done once, via the AWS console — not Terraform)

Terraform needs somewhere to store its state before it can manage anything, so this
step isn't Terraform itself. Already created for this account:

- **S3 bucket** `brickandbeam-terraform-state-556122828441` — Terraform state, versioned, encrypted, public access blocked
- **DynamoDB table** `brickandbeam-terraform-locks` — state locking (partition key `LockID`, on-demand billing)
- **IAM OIDC provider** `token.actions.githubusercontent.com` — already existed in this account (shared with another project)
- **IAM role** `brickandbeam-github-deploy` (`arn:aws:iam::556122828441:role/brickandbeam-github-deploy`) —
  assumable only by GitHub Actions runs of `bquaresma/brickandbeam` on the `main` branch, via OIDC (no stored
  AWS keys in GitHub). Permissions are scoped to what Terraform needs for this project — see the role's
  inline policy for specifics.

If this ever needs to be redone (new AWS account, disaster recovery), redo these same steps by hand — there's
no script for it, and re-creating them is rare enough that a script isn't worth maintaining.

## Stacks

- **`data/`** — VPC, subnets, security groups, RDS Postgres, ECR repository, SSM secrets. Changes rarely.
  Keep running even when saving money — it's the cheap, stateful part (~$13–15/mo).
- **`app/`** — ECS cluster, task definition, service, ALB. Reads `data`'s outputs via `terraform_remote_state`;
  never modifies it. This is the expensive part (~$25–30/mo, mostly the ALB) and the one to tear down if
  money's tight.

`app` depends on `data`; `data` never depends on `app`. That's what makes tearing down `app` alone safe.

## Day-to-day: GitHub Actions

Pushing to `main` runs [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), which assumes the
`brickandbeam-github-deploy` role, applies both stacks, builds and pushes the Docker image, and runs
`prisma migrate deploy` against the new image before/alongside the rolling ECS deployment. Nothing needs to
run locally for normal deploys.

## Running Terraform locally (optional, for debugging)

You'll need your own AWS credentials with equivalent permissions (not the GitHub Actions role — that's
scoped to OIDC from GitHub only). From either `data/` or `app/`:

```bash
terraform init
terraform plan
```

## Custom domain (brickandbeamrentals.com)

Registered at Porkbun. DNS stays at Porkbun (no nameserver change needed) — only new records get added there.
The ACM certificate lives in `infra/data` (not `app`) so tearing down the app stack never invalidates it or
requires re-validation.

1. Deploy once so the certificate exists: `terraform output -json acm_validation_records` in `infra/data`.
2. Add each returned record as a CNAME in Porkbun's DNS panel. AWS validates automatically once they resolve
   (usually within minutes) — no Terraform re-apply needed.
3. Once validated, point the domain at the ALB (`terraform output -raw` doesn't exist for the ALB's DNS name
   yet from `data` — get it from `infra/app`'s state or the AWS console):
   - Apex (`brickandbeamrentals.com`): Porkbun's ALIAS record type (if available) targeting the ALB's DNS
     name, or route through Porkbun's Cloudflare connection if ALIAS isn't supported for this zone.
   - `www.brickandbeamrentals.com`: a plain CNAME to the ALB's DNS name.
4. Existing "URL Forwarding" on the domain should be turned off — it'll conflict with the new records.

## Tearing down to save money

```bash
cd infra/app
terraform destroy
```

This removes the ALB, ECS service, and task definitions (~$25–30/mo saved) without touching the database or
its data. Bring it back with `terraform apply` in the same directory — it re-points at the existing RDS
instance and ECR image, no rebuild needed.

Only destroy `infra/data` if you want to delete the database itself. Take a manual snapshot first if you
might want the data back:

```bash
aws rds create-db-snapshot --db-instance-identifier brickandbeam --db-snapshot-identifier brickandbeam-final
```
