# GitHub Pages Blog Setup

## Project Overview
Static blog using Jekyll hosted on GitHub Pages with a custom domain, without disrupting existing email service.

## Key Architecture
- **Repository**: `username.github.io` format (GitHub Pages standard)
- **Generator**: Jekyll (GitHub's default, no local build tools needed)
- **Theme**: Hydejack v9 (professional blog theme with sidebar and modern design)
  - Remote theme: `hydecorp/hydejack@v9`
  - Requires: `jekyll-remote-theme` plugin
- **Deployment**: Automatic via GitHub Pages on push (builds within ~30 seconds)

## Configuration Essentials
- `_config.yml`:
  - `remote_theme: hydecorp/hydejack@v9`
  - `plugins: [jekyll-remote-theme]`
  - `baseurl: ""` (empty for root domain)
  - `url: "https://yourdomain.com"` (custom domain)
- Posts go in `_posts/` with naming: `YYYY-MM-DD-post-title.md`
- Each post needs YAML frontmatter with `layout: post` and `title`

## Domain Setup
- GitHub Pages custom domain in Settings → Pages (creates CNAME file)
- DNS: Use CNAME to `username.github.io` for www subdomain, or A records for root domain
- **Important**: Email MX records are separate and won't conflict with CNAME/A records

## Notes
- No local build/deploy scripts needed
- Theme handles all styling and layout automatically
- GitHub rebuilds site automatically on each push
- Links resolve correctly (Jekyll handles baseurl automatically)
