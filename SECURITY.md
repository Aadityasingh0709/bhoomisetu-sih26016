# Security Policy

## Supported version

Security fixes are applied to the latest code on the `main` branch.

## Reporting a vulnerability

Do not disclose security vulnerabilities in a public issue. Contact the repository
maintainer privately with a clear description, impact, and reproduction steps. You
will receive an acknowledgement as soon as practical.

For deployments, use a unique strong `JWT_SECRET`, restrict `CLIENT_ORIGIN`, and
replace all seeded demo credentials before exposing the application to users.
