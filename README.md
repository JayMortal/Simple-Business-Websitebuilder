# Simple-Business-Websitebuilder

> 🌐 [中文文档](README_CN.md) | **English**

A lightweight, self-hosted bilingual website builder for small businesses — no database, no WordPress complexity. One Docker command to deploy.

**Live Demo:** [demo.yjggfun.com](https://demo.yjggfun.com)

---

## ✨ Features

| Feature | Detail |
|---------|--------|
| 🌐 Bilingual | Chinese / English — admin panel and front-end both auto-detect visitor language |
| ✏️ Visual Editor | Click any text or image to edit directly on the page |
| 🗂 Sidebar Editor | Real-time panel — see changes live as you type |
| ⚙️ Admin Panel | Full content management at `/admin.html` |
| 📰 News & Articles | Publish articles with dedicated URLs (`/articles/{slug}.html`), Markdown/HTML editor |
| 🔘 Button Manager | Set each button: page jump / email / external link |
| 🎨 Theme Colors | Color picker + 6 preset schemes |
| 🔒 Secure Login | bcrypt password + server-side sessions + brute-force lockout |
| 🐳 Docker Ready | One-command deploy, works alongside 1Panel / aaPanel |
| 📦 No Database | All data stored in JSON files (no external database needed) |

---

## 📁 Project Structure

```
Simple-Business-Websitebuilder/
├── index.html            # Home page
├── products.html         # Products page
├── about.html            # About Us
├── contact.html          # Contact Us
├── news.html             # Latest News — article list
├── article.html          # Article detail template (copied to articles/{slug}.html on publish)
├── admin.html            # Admin panel (/admin.html)
├── server.js             # Backend — Express server (auth, save, serve)
├── package.json          # Node.js dependencies
├── .env.example          # Environment variable template → copy to .env
├── css/
│   ├── style.css
│   ├── admin.css
│   └── news.css          # News list + article detail styles
├── js/
│   ├── i18n.js           # Bilingual logic + auto language detection
│   ├── main.js           # Core logic, edit mode, server sync
│   ├── admin.js          # Admin panel logic
│   ├── btn-actions.js    # Button action manager
│   ├── sidebar-editor.js # Real-time sidebar editor
│   ├── products-data.js  # Product data store
│   ├── products.js       # Products page rendering
│   ├── news.js           # News list page logic
│   └── article.js        # Article detail page logic
├── data/                 # Persisted via Docker volume (created at runtime)
│   ├── site-data.json    # Site content (text, images, buttons, theme)
│   └── articles.json     # Article metadata
├── articles/             # Generated article HTML files (Docker volume — persisted)
├── img/                  # Uploaded images (Docker volume — persisted)
├── Dockerfile
├── docker-compose.yml
├── update.sh             # One-click Docker update script
├── README.md             # This file
└── README_CN.md          # Chinese documentation
```

---

## 🐳 Docker Deploy (Recommended)

Panel tools (1Panel, aaPanel) occupy ports 80/443. Docker keeps this site fully isolated; the panel's reverse proxy handles external traffic.

### Prerequisites

```bash
# Install Docker (skip if already installed)
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin (skip if already installed)
apt-get install -y docker-compose-plugin
```

### Step 1 — Clone & Configure

```bash
git clone https://github.com/your-username/Simple-Business-Websitebuilder.git \
  /opt/1panel/apps/Simple-Business-Websitebuilder
cd /opt/1panel/apps/Simple-Business-Websitebuilder

# Create your environment file
cp .env.example .env
nano .env   # Set ADMIN_PASSWORD and SESSION_SECRET
```

`.env` fields:

| Key | Purpose | Default |
|-----|---------|---------|
| `ADMIN_PASSWORD` | Initial admin password (first run only) | `admin123` |
| `SESSION_SECRET` | Random secret for session signing — **must change** | placeholder |
| `PORT` | Host port | `14515` |

Generate a secure `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2 — Create Data Directory & Start

```bash
mkdir -p data img articles
docker compose up -d --build
```

No `chown` commands needed — Node.js handles file permissions correctly without root workarounds.

### Step 3 — Configure Reverse Proxy in Your Panel

**1Panel example:**
1. Website → Create → **Reverse Proxy**
2. Domain: `yourdomain.com`
3. Proxy target: `http://127.0.0.1:14515`
4. Apply SSL via the panel's built-in Let's Encrypt button

Same principle applies to aaPanel, BT Panel, and similar tools.

### Step 4 — Verify

| URL | Expected result |
|-----|----------------|
| `https://yourdomain.com` | Home page loads |
| `https://yourdomain.com/admin.html` | Login screen in your browser's language |
| Login with the password from `.env` | Admin panel opens |
| Edit any text, click Save | ✅ "Saved & synced" — change visible to all visitors |

---

## 🔄 Updating

Use the included `update.sh` — your data is always preserved:

```bash
cd /opt/1panel/apps/Simple-Business-Websitebuilder
bash update.sh
```

**What it does:** `git pull` → stop old container → rebuild image (`--no-cache`) → start new container → prune old images.

**No browser cache issues after update.** The server sends `Cache-Control: no-cache` on all HTML responses, so browsers always fetch the latest version immediately.

> ⚠️ **Cloudflare users:** Cloudflare may still cache `.js` and `.css` files at the CDN edge. If styles or scripts look outdated after an update, go to CF Dashboard → Caching → **Purge Everything**. To prevent this permanently, add a Cache Rule to **Bypass cache** for `*.js` and `*.css`.

---

## 📰 News & Article Publishing

### How It Works

1. Go to Admin Panel → **Latest News** → click **＋ New Article**
2. Fill in a **slug** (e.g. `gt-pro-launch`) — the article URL becomes `yourdomain.com/articles/gt-pro-launch.html`
3. Fill in Chinese and/or English content (title, summary, body)
4. Choose **Markdown** or **HTML** format; use the toolbar for quick formatting
5. Upload or link a cover image (optional)
6. Click the status chip to toggle **Draft ↔ Published**
7. Click **Save** — the article is immediately available at its URL

### Bilingual Fallback

If only one language is filled in, both the Chinese and English front-ends display the filled-in language automatically. No duplicate entry required.

### Seed Articles

Three sample articles are pre-loaded on first deploy so the news page is never empty on launch. You can edit or delete them from the admin panel.

---

## ⚙️ Admin Panel Guide

### Language Behaviour

The admin panel detects your browser language automatically on first visit:
- Browser set to English → admin panel opens in **English**, front-end also in English
- Browser set to Chinese → admin panel opens in **Chinese**, front-end also in Chinese

Language preference is stored in the browser and remembered on every return visit. You can switch it manually at any time in the top-right corner of the admin panel.

### Step 1 — Set the Site Default Language

Go to **Settings** and choose how first-time visitors see the front-end:

| Option | Behaviour |
|--------|-----------|
| 🌍 Auto-detect *(recommended)* | Chinese browser → Chinese; all others → English |
| 🇨🇳 Chinese | All first-time visitors see Chinese |
| 🇬🇧 English | All first-time visitors see English |

### Step 2 — Edit Bilingual Content

The left sidebar has two independent language controls:

```
🌐 UI Language    [Chinese] [English]   ← language of the admin interface
✏️ Edit Language  [Chinese] [English]   ← which language's front-end content you're editing
```

**Recommended workflow:**
1. Set Edit Language → **Chinese** → fill in all Chinese content → **Save**
2. Set Edit Language → **English** → fill in all English content → **Save**
3. Front-end visitors automatically see the correct language

### Step 3 — Change the Admin Password

Admin Panel → left sidebar → **Password**. Do this immediately after first login.

The new password takes effect immediately. You will be logged out and prompted to log in again.

### Data Backup & Restore

- **Export:** Settings → Export Data (downloads a `.json` backup)
- **Import:** Settings → Import Data (restores from a previous backup)
- **Reset:** Settings → Reset to Defaults (clears all custom content)

---

## 🔒 Security Notes

1. **Change the default password** immediately after first login
2. **Set a strong `SESSION_SECRET`** in `.env` before deploying to production
3. **Always use HTTPS** — enable via your panel's Let's Encrypt integration
4. Login is rate-limited server-side: **5 failed attempts → 15-minute lockout**
5. Session cookies are `httpOnly` — not accessible from JavaScript

---

## 📦 At a Glance

| Item | Detail |
|------|--------|
| Version | v0.3 |
| Backend | Node.js 20 + Express — no database |
| Auth | express-session (httpOnly cookie, 8h TTL) |
| Deploy | Docker (recommended) |
| Minimum server spec | 1 vCPU / 512 MB RAM |
| External dependencies | Google Fonts + marked.js via CDN (optional) |

---

### Changelog

**v0.3** — News & article pages
- Latest News page with article list, pagination, bilingual fallback
- Each article has a dedicated URL (`/articles/{slug}.html`), stored as a physical HTML file
- News list shows exactly 3 articles per row, 6 per page; numbered pagination auto-scales with article count
- Article click navigation fixed — articles load reliably even when static files haven't been generated yet
- Admin article editor: Markdown/HTML, bilingual tabs, cover image, toolbar, image upload
- Uploaded images stored in `img/` as a separate Docker volume (persisted across updates)
- Admin article table buttons (Edit / Draft / Delete) update instantly on language switch
- Header nav centered on page; nav font size increased (+2–4 px)
- Removed breadcrumb ("Home / Page") from Products, About, and Contact page heroes
- Seed articles pre-loaded on first deploy
- Full bilingual admin UI — zero language mixing

**v0.2** — Backend rewrite
- PHP → Node.js + Express
- Auth: express-session httpOnly cookie
- HTML served with `Cache-Control: no-cache`
- Admin panel auto-detects browser language
- Docker volume mounts only `data/`

**v0.1** — First stable release
- Bilingual content (Chinese / English)
- Auto-detect visitor language
- Real-time sidebar editor, theme colors, button manager
- One-click Docker deploy

---

*[Simple-Business-Websitebuilder](https://github.com/your-username/Simple-Business-Websitebuilder) v0.3*
