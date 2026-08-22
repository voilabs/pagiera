# Security policy

## Reporting a vulnerability

Do not report security vulnerabilities in public GitHub issues.

Use GitHub's private vulnerability reporting feature for `voilabs/pagiera`. Include affected versions, impact, reproduction steps, and any suggested mitigation. Voi Labs will acknowledge valid reports as soon as practical and coordinate disclosure after a fix is available.

## Deployment responsibility

Pagiera exposes content mutation, publishing, data-source, and AI endpoints. Applications must protect editor, preview, and write API routes with their own authentication and authorization layer. Keep PostgreSQL, Redis, and OpenRouter credentials server-only.
