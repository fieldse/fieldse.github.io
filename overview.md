# GitHub Pages Blog Setup Plan

## Overview
Set up a static blog using Jekyll hosted on GitHub Pages with a custom domain name, without disrupting existing email service on that domain.

## Blog Hosting & Theme

### Repository Setup
- Create or use existing GitHub repository named `username.github.io`
- Use Jekyll as the static site generator (GitHub's default)

### Theme Selection
**Hydejack** - Professional blog theme with sidebar, animations, and modern design
- Docs: https://hydejack.com/docs/install/
- Config: Add to `_config.yml`: `remote_theme: hydecorp/hydejack@v9`
- Include: `plugins: [jekyll-remote-theme]`

### Blog Content
- Create `_posts/` directory in repository root
- Add markdown files with naming convention: `YYYY-MM-DD-post-title.md`
- Each post needs YAML frontmatter:
  ```yaml
  ---
  layout: post
  title: My Post Title
  ---
  ```

## Configuration

### _config.yml Settings
```yaml
remote_theme: hydecorp/hydejack@v9
plugins:
  - jekyll-remote-theme

title: Your Blog Title
baseurl: ""
url: "https://yourdomain.com"
```

**Key Detail:** `baseurl: ""` (empty) because blog is at domain root. `url` points to your custom domain.

## Domain & DNS Configuration

### Custom Domain Setup in GitHub
1. Go to repository Settings → Pages
2. Under "Custom domain", enter: `yourdomain.com`
3. GitHub will create a `CNAME` file in repository

### DNS Configuration (at your domain registrar)

**Option A: www subdomain (recommended)**
- Create CNAME record:
  - Name/Host: `www`
  - Value: `username.github.io`

**Option B: Root domain (yourdomain.com)**
- Create 4 A records pointing to GitHub's IP addresses:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`

### Email Safety
- Email uses MX records (separate from CNAME/A records)
- Existing MX records pointing to email provider remain unchanged
- CNAME/A records and MX records can coexist on same domain without conflict
- Email service will not be disrupted

## Deployment Flow

1. Push markdown posts to `_posts/` directory
2. Push `_config.yml` with theme and domain settings
3. GitHub automatically builds Jekyll site
4. Site deployed to GitHub Pages at configured domain within ~30 seconds
5. Updates publish automatically on push

## Testing

After DNS propagation (5-15 minutes):
- Visit `https://yourdomain.com` - should work via CNAME
- Visit `https://username.github.io` - direct GitHub Pages URL also works
- All internal links should resolve correctly (Jekyll handles baseurl automatically)
- Verify email still functions (test sending to your domain email)

## Notes

- No build tools need to be installed locally
- Theme handles all styling and layout automatically
- Jekyll generates relative links using theme templates
- GitHub rebuilds site automatically on each push
- No CI/CD or deployment scripts needed
