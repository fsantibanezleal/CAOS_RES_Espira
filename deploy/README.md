# deploy/

- **[`pages.md`](pages.md)**: the active deploy, GitHub Pages at https://espira.fasl-work.com, driven by
  `.github/workflows/deploy-pages.yml`.
- **VPS lane: dormant.** This solution does not require a server at the moment. A VPS unit (systemd plus
  nginx) would be added only if the dormant `app/` backend were activated on an ADR-0002 trigger.
