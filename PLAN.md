# GitHub Pages Blog Setup

## Local Files
- [x] Create `_config.yml` with Hydejack v9 theme
- [x] Create `_posts/2026-03-03-hello-world.md` with frontmatter
- [ ] (Optional) Create `CNAME` with your custom domain

## GitHub Repo
- [x] Repo exists as `<username>.github.io`
- [x] `git push -u origin main`

## Enable GitHub Pages
Reference: https://docs.github.com/en/pages/quickstart
- [x] Go to repo Settings → sidebar: "Pages" (under Code and automation)
- [x] Build and deployment → Source: "Deploy from a branch"
- [x] Branch dropdown: `main` / `/ (root)` → Save
- [x] Enter custom domain → Save
- [x] Enable Enforce HTTPS (available after DNS is configured)

## DNS at Registrar
- [x] www CNAME → `fieldse.github.io`
- [x] Root A records: 185.199.108–111.153

## Verify
- [ ] `https://yourdomain.com` loads Hydejack blog
- [x] `https://<username>.github.io` also works
