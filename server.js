'use strict';
require('dotenv').config();

const express      = require('express');
const session      = require('express-session');
const rateLimit    = require('express-rate-limit');
const helmet       = require('helmet');
const bcrypt       = require('bcrypt');
const fs           = require('fs');
const path         = require('path');
const { randomUUID } = require('crypto');

const app  = express();
const PORT = parseInt(process.env.PORT || '14515', 10);

// ── File paths (persisted via Docker volume) ───────────────────────
const DATA_DIR          = path.join(__dirname, 'data');
const DATA_FILE         = path.join(DATA_DIR,  'site-data.json');
const STATE_FILE        = path.join(DATA_DIR,  'admin-state.json');
const ARTICLES_FILE     = path.join(DATA_DIR,  'articles.json');
const IMG_DIR           = path.join(__dirname, 'img');       // uploaded images (Docker volume)
const ARTICLES_HTML_DIR = path.join(__dirname, 'articles');  // generated article HTML files (Docker volume)

// Ensure directories exist on first run
if (!fs.existsSync(DATA_DIR))          fs.mkdirSync(DATA_DIR,          { recursive: true });
if (!fs.existsSync(IMG_DIR))           fs.mkdirSync(IMG_DIR,           { recursive: true });
if (!fs.existsSync(ARTICLES_HTML_DIR)) fs.mkdirSync(ARTICLES_HTML_DIR, { recursive: true });

// Seed articles on first run
const SEED_ARTICLES = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    slug: 'twenty-year-anniversary',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80',
    publishedAt: '2024-11-15T08:00:00.000Z',
    updatedAt:   '2024-11-15T08:00:00.000Z',
    zh: {
      title:   'GlobalTrade Co. 成立二十周年：从上海出发，连接世界',
      summary: '二十年风雨兼程，GlobalTrade Co. 从一家小型贸易公司成长为覆盖全球80余个国家和地区的综合性贸易集团。在此，我们回顾这段不平凡的历程，并展望未来。',
      format:  'markdown',
      content: `## 二十年，一段不平凡的旅程

2004年，GlobalTrade Co. 在上海浦东成立，彼时公司只有不足20名员工，却怀揣着"连接全球、共创价值"的梦想踏上征程。

二十年后的今天，我们拥有：

- **500+** 名专业团队成员
- **80+** 个覆盖国家和地区
- **5000+** 家全球合作伙伴
- **1200+** 个产品品类

### 关键里程碑

**2008年** — 完成首个欧洲业务布局，在德国慕尼黑设立区域办公室。

**2012年** — 荣获中国对外贸易质量奖，成为行业标杆企业。

**2016年** — 启动数字化转型战略，搭建智慧贸易平台，实现订单全流程可视化。

**2020年** — 疫情期间，凭借稳健的供应链体系，保障全球客户物资供应不中断。

**2024年** — 迈入第二个二十年，我们将继续以创新为驱动，为全球客户创造更大价值。

> "二十年是一个起点，不是终点。未来，我们将持续深耕数字化贸易，让每一笔跨境交易都更简单、更高效。"
> — 张明远，创始人 & CEO

感谢每一位合作伙伴、每一位员工二十年来的信任与支持。我们期待与您携手，共同书写下一个辉煌二十年。`,
    },
    en: {
      title:   'GlobalTrade Co. Celebrates 20 Years: From Shanghai to the World',
      summary: 'Twenty years of dedication have transformed GlobalTrade Co. from a small trading firm into a comprehensive trade group covering over 80 countries and regions. We look back on this remarkable journey and set our sights on the future.',
      format:  'markdown',
      content: `## Twenty Years of Remarkable Growth

Founded in 2004 in Shanghai's Pudong district with fewer than 20 employees, GlobalTrade Co. set out with a simple yet ambitious vision: *Connect the world, create shared value.*

Two decades later, our milestones speak for themselves:

- **500+** professional team members
- **80+** countries and regions served
- **5,000+** global partners
- **1,200+** product categories

### Key Milestones

**2008** — Established our first European presence with a regional office in Munich, Germany.

**2012** — Received the China Foreign Trade Quality Award, setting an industry benchmark.

**2016** — Launched our digital transformation strategy, building a smart trade platform with end-to-end order visibility.

**2020** — Navigated the pandemic with a resilient supply chain, ensuring uninterrupted supply for clients worldwide.

**2024** — As we enter our next twenty years, innovation and technology remain at the heart of everything we do.

> "Twenty years is a beginning, not an end. We will continue to deepen our digital trade capabilities and make every cross-border transaction simpler and more efficient."
> — Zhang Mingyuan, Founder & CEO

Thank you to every partner and team member for twenty years of trust and collaboration. We look forward to writing the next brilliant chapter together.`,
    },
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    slug: 'gt-pro-series-launch',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
    publishedAt: '2024-12-03T09:30:00.000Z',
    updatedAt:   '2024-12-03T09:30:00.000Z',
    zh: {
      title:   '新品发布 | GT-Pro 系列智能控制模块正式上市',
      summary: '历经两年研发，GlobalTrade Co. 全新 GT-Pro 系列工业级智能控制模块正式发布。该系列产品在性能、稳定性和能耗三个维度均实现重大突破，已通过 CE、UL、RoHS 等多项国际认证。',
      format:  'markdown',
      content: `## GT-Pro 系列：重新定义工业智能控制

经过两年的深度研发与100,000小时的严苛测试，GlobalTrade Co. 自豪地宣布 **GT-Pro 系列智能控制模块**正式上市！

### 产品亮点

| 参数 | GT-Pro S | GT-Pro M | GT-Pro X |
|------|----------|----------|----------|
| 处理器 | 双核 ARM | 四核 ARM | 八核 ARM |
| 工作温度 | -20°C ~ 70°C | -40°C ~ 85°C | -40°C ~ 105°C |
| 防护等级 | IP65 | IP67 | IP68 |
| 通信协议 | Modbus / CAN | + EtherCAT | + PROFINET |
| 功耗 | ≤ 5W | ≤ 8W | ≤ 12W |

### 核心优势

**高性能** — 相比上一代产品，处理速度提升 300%，响应延迟低至 0.5ms，满足最苛刻的实时控制需求。

**超稳定** — 采用军工级元器件，MTBF（平均无故障时间）超过 100,000 小时，最大程度降低停机风险。

**低能耗** — 创新的动态功耗管理技术，整机能耗降低 40%，助力客户实现节能减排目标。

**易集成** — 支持主流工业通信协议，提供完整 SDK 和丰富参考设计，缩短二次开发周期。

### 认证与合规

产品已取得以下国际认证：CE、UL、RoHS 2.0、REACH、ISO 13849 SIL 2。

### 立即询价

GT-Pro 系列现已开放全球订单。如需技术规格书、样品申请或批量报价，请[联系我们的销售团队](/contact.html)，我们将在1个工作日内回复。`,
    },
    en: {
      title:   'New Launch | GT-Pro Series Smart Control Modules Now Available',
      summary: 'After two years of intensive R&D, GlobalTrade Co. is proud to launch the GT-Pro Series industrial-grade smart control modules. The lineup delivers breakthrough performance, stability, and energy efficiency, and has earned CE, UL, and RoHS certifications.',
      format:  'markdown',
      content: `## GT-Pro Series: Redefining Industrial Smart Control

After two years of deep research and 100,000 hours of rigorous testing, GlobalTrade Co. is proud to announce the global launch of the **GT-Pro Series Smart Control Modules**.

### Product Lineup at a Glance

| Spec | GT-Pro S | GT-Pro M | GT-Pro X |
|------|----------|----------|----------|
| Processor | Dual-core ARM | Quad-core ARM | Octa-core ARM |
| Operating Temp | -20°C ~ 70°C | -40°C ~ 85°C | -40°C ~ 105°C |
| Protection | IP65 | IP67 | IP68 |
| Protocols | Modbus / CAN | + EtherCAT | + PROFINET |
| Power Draw | ≤ 5W | ≤ 8W | ≤ 12W |

### Core Advantages

**High Performance** — 300% faster processing than the previous generation, with response latency as low as 0.5 ms for the most demanding real-time control applications.

**Ultra-Reliable** — Military-grade components deliver an MTBF exceeding 100,000 hours, minimising unplanned downtime.

**Energy-Efficient** — Dynamic power management reduces total power consumption by 40%, helping customers meet sustainability targets.

**Easy Integration** — Supports all major industrial protocols; a complete SDK and reference designs shorten secondary development cycles.

### Certifications

CE · UL · RoHS 2.0 · REACH · ISO 13849 SIL 2

### Request a Quote

The GT-Pro Series is now accepting global orders. For datasheets, samples, or volume pricing, please [contact our sales team](/contact.html) — we respond within one business day.`,
    },
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    slug: 'sustainability-report-2025',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80',
    publishedAt: '2025-01-20T10:00:00.000Z',
    updatedAt:   '2025-01-20T10:00:00.000Z',
    zh: {
      title:   '绿色贸易新趋势：GlobalTrade Co. 发布 2025 年可持续发展报告',
      summary: '可持续发展已成为全球贸易的核心议题。GlobalTrade Co. 发布2025年度可持续发展报告，全面披露碳排放数据、绿色供应链举措及未来减碳目标，以实际行动践行 ESG 承诺。',
      format:  'markdown',
      content: `## 绿色贸易，不只是口号

随着《巴黎协定》深入推进和欧盟碳边境调节机制（CBAM）正式实施，可持续发展能力已成为全球贸易企业的核心竞争力之一。GlobalTrade Co. 在此正式发布《2025年可持续发展报告》。

### 核心数据

- **碳排放强度**：较2020年基准年降低 **28%**
- **可再生能源占比**：集团用电中可再生能源比例达 **45%**
- **绿色包装**：超过 **70%** 的出货采用可降解或可回收包装材料
- **供应商审核**：完成 **320+** 家一级供应商 ESG 评估

### 三大绿色举措

#### 1. 绿色供应链认证体系
我们建立了一套覆盖原材料采购、生产加工、物流配送全链条的绿色供应链认证标准，并向合作供应商开放培训资源，帮助上下游共同提升环保水平。

#### 2. 低碳物流网络
通过优化船期排期、提升集装箱装载率及增加铁路多式联运比例，2024年度物流碳排放总量同比下降 **19%**。

#### 3. 循环经济探索
与多家客户共同开展包装回收试点项目，2024年回收包装材料超过 **800吨**，相当于减少 **1,200吨** CO₂ 当量排放。

### 2030 年目标

我们承诺在2030年前实现：
- 碳排放强度较2020年降低 **50%**
- 可再生能源占比提升至 **80%**
- 所有一级供应商完成 ESG 评级

### 完整报告下载

如需获取《GlobalTrade Co. 2025年可持续发展报告》完整版，请发送邮件至 **sustainability@globaltrade.com**，或[联系我们](/contact.html)获取。`,
    },
    en: {
      title:   'Green Trade in Focus: GlobalTrade Co. Releases 2025 Sustainability Report',
      summary: 'Sustainability has become a defining issue in global trade. GlobalTrade Co. publishes its 2025 Sustainability Report, fully disclosing carbon data, green supply-chain initiatives, and future decarbonisation targets — putting real action behind our ESG commitments.',
      format:  'markdown',
      content: `## Green Trade Is More Than a Slogan

As the Paris Agreement deepens and the EU Carbon Border Adjustment Mechanism (CBAM) takes effect, sustainability performance has become a core competitive capability for global trading companies. GlobalTrade Co. is proud to release our *2025 Sustainability Report*.

### Key Metrics

- **Carbon Intensity**: down **28%** from our 2020 baseline
- **Renewable Energy Share**: **45%** of group electricity consumption from renewables
- **Green Packaging**: over **70%** of shipments use biodegradable or recyclable materials
- **Supplier Audits**: ESG assessments completed for **320+** tier-1 suppliers

### Three Green Initiatives

#### 1. Green Supply Chain Certification
We developed a proprietary certification standard covering raw-material sourcing, manufacturing, and logistics. We also open our training resources to supplier partners, raising sustainability performance across the entire value chain.

#### 2. Low-Carbon Logistics Network
By optimising vessel scheduling, improving container utilisation, and increasing rail intermodal share, total logistics carbon emissions fell **19%** year-on-year in 2024.

#### 3. Circular Economy Pilots
Joint packaging-recovery pilot programmes with key customers recovered over **800 tonnes** of packaging materials in 2024 — equivalent to avoiding **1,200 tonnes** of CO₂e emissions.

### 2030 Targets

We commit to achieving by 2030:
- **50%** reduction in carbon intensity vs. 2020 baseline
- **80%** renewable energy share
- 100% of tier-1 suppliers rated on ESG criteria

### Download the Full Report

To receive the full *GlobalTrade Co. 2025 Sustainability Report*, email **sustainability@globaltrade.com** or [contact us](/contact.html).`,
    },
  },
];

if (!fs.existsSync(ARTICLES_FILE)) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(SEED_ARTICLES, null, 2));
}

// ── Article HTML file helpers ──────────────────────────────────────
// Each published article gets a physical HTML file at articles/{slug}.html.
// The file is a copy of article.html (which has <base href="/"> so all paths resolve correctly).
function generateArticleFile(slug) {
  if (!slug) return;
  const templatePath = path.join(__dirname, 'article.html');
  const destPath     = path.join(ARTICLES_HTML_DIR, slug + '.html');
  if (!fs.existsSync(templatePath)) return;
  try { fs.copyFileSync(templatePath, destPath); } catch (e) { console.error('generateArticleFile failed:', slug, e.message); }
}

function deleteArticleFile(slug) {
  if (!slug) return;
  const fp = path.join(ARTICLES_HTML_DIR, slug + '.html');
  if (fs.existsSync(fp)) {
    try { fs.unlinkSync(fp); } catch (e) { console.error('deleteArticleFile failed:', slug, e.message); }
  }
}

// On startup: regenerate all published article files (picks up template changes after updates)
function syncArticleFiles() {
  const articles = readArticles();
  const publishedSlugs = new Set(articles.filter(a => a.status === 'published' && a.slug).map(a => a.slug));
  // Remove orphan files (no longer published or deleted)
  try {
    fs.readdirSync(ARTICLES_HTML_DIR).filter(f => f.endsWith('.html')).forEach(f => {
      const slug = f.slice(0, -5);
      if (!publishedSlugs.has(slug)) deleteArticleFile(slug);
    });
  } catch {}
  // Generate files for published articles
  publishedSlugs.forEach(slug => generateArticleFile(slug));
}
syncArticleFiles();

// ── State helpers ──────────────────────────────────────────────────
function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}
function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), { flag: 'w' });
}

// Bootstrap default password hash on first run
function ensurePasswordHash(state) {
  if (!state.password_hash) {
    const initial = process.env.ADMIN_PASSWORD || 'admin123';
    state.password_hash = bcrypt.hashSync(initial, 10);
    writeState(state);
  }
}

// ── Security middleware ────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,   // Allow inline scripts/styles used throughout the project
  crossOriginEmbedderPolicy: false
}));

// ── Session ───────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,          // Set true only when terminating TLS in Node (not needed behind Nginx)
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000   // 8 hours
  }
}));

// ── Body parser ───────────────────────────────────────────────────
app.use(express.json({ limit: '8mb' }));

// ── Block access to server-side files / data directory ───────────
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  const blocked = ['/data/', '/server.js', '/package.json', '/package-lock.json',
                   '/node_modules/', '/.env', '/admin-state.json'];
  if (blocked.some(b => p === b || p.startsWith(b))) {
    return res.status(403).end();
  }
  next();
});

// ── Serve static files — HTML always no-cache ─────────────────────
// This is the root fix for "update container but browser shows old HTML"
app.use(express.static(__dirname, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (/\.(js|css)$/.test(filePath)) {
      // JS/CSS: validate on each request but allow reuse if unchanged (ETag)
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ── Fallback for /articles/*.html — serve template if static file is missing ──
// express.static handles the file when it exists; this catches the case where
// syncArticleFiles() hasn't generated the file yet (e.g. empty volume on first run).
app.get('/articles/:filename', (req, res, next) => {
  if (!req.params.filename.endsWith('.html')) return next();
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'article.html'));
});

// ── Rate limiters ─────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    const remaining = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({ error: 'locked', retry_after: remaining });
  }
});

// ── Auth middleware ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'unauthenticated' });
}

// ── Content sanitisation (strip PHP tags and <script> blocks) ─────
function sanitise(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<\?[\s\S]*?\?>/g, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  }
  if (Array.isArray(value))  return value.map(sanitise);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitise(v);
    return out;
  }
  return value;
}

// ── Slug sanitizer ────────────────────────────────────────────────
function sanitizeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ══════════════════════════════════════════════════════════════════
//  API Routes
// ══════════════════════════════════════════════════════════════════

// GET /api/data — public, returns site content
app.get('/api/data', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch {
    res.json({ status: 'empty' });
  }
});

// GET /api/check-auth — check session validity
app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// POST /api/login
app.post('/api/login', loginLimiter, async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'missing_password' });

  const state = readState();
  ensurePasswordHash(state);

  // Server-side lockout
  const now = Date.now();
  if (state.locked_until && now < state.locked_until) {
    const remaining = Math.ceil((state.locked_until - now) / 1000);
    return res.status(429).json({ error: 'locked', retry_after: remaining });
  }

  const ok = await bcrypt.compare(password, state.password_hash);
  if (!ok) {
    state.attempts = (state.attempts || 0) + 1;
    if (state.attempts >= 5) {
      state.locked_until = now + 15 * 60 * 1000;
      state.attempts = 0;
    }
    writeState(state);
    const remaining = 5 - (state.attempts || 0);
    return res.status(401).json({ error: 'wrong_password', remaining: Math.max(0, remaining) });
  }

  // Success — start session
  state.attempts = 0;
  state.locked_until = 0;
  writeState(state);

  req.session.authenticated = true;
  req.session.save(err => {
    if (err) return res.status(500).json({ error: 'session_error' });
    res.json({ status: 'ok' });
  });
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ status: 'ok' }));
});

// POST /api/save — requires auth
app.post('/api/save', requireAuth, (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'missing_data' });
  }
  const clean = sanitise(data);
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(clean, null, 2), { flag: 'w' });
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Write failed:', err.message);
    res.status(500).json({ error: 'write_failed' });
  }
});

// POST /api/change-password — requires auth
app.post('/api/change-password', requireAuth, async (req, res) => {
  const { current, newPassword } = req.body || {};
  if (!current || !newPassword) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'password_too_short' });
  }

  const state = readState();
  ensurePasswordHash(state);

  const ok = await bcrypt.compare(current, state.password_hash);
  if (!ok) return res.status(403).json({ error: 'wrong_current_password' });

  state.password_hash = await bcrypt.hash(newPassword, 10);
  writeState(state);

  // Invalidate session — admin must re-login
  req.session.destroy(() => res.json({ status: 'ok' }));
});

// ══════════════════════════════════════════════════════════════════
//  Articles helpers
// ══════════════════════════════════════════════════════════════════

function readArticles() {
  try { return JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8')); }
  catch { return []; }
}
function writeArticles(arr) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(arr, null, 2), { flag: 'w' });
}

// Uploaded images live in img/ at root; express.static(__dirname) serves them at /img/:filename.
// No custom route needed.

// ══════════════════════════════════════════════════════════════════
//  Article API Routes
// ══════════════════════════════════════════════════════════════════

// GET /api/articles — public, published articles only, paginated
app.get('/api/articles', (req, res) => {
  const all = readArticles().filter(a => a.status === 'published');
  all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  res.json({ items: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit });
});

// GET /api/articles/all — auth, all articles including drafts
app.get('/api/articles/all', requireAuth, (req, res) => {
  const all = readArticles();
  all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(all);
});

// GET /api/articles/slug/:slug — public for published; auth for drafts
app.get('/api/articles/slug/:slug', (req, res) => {
  const a = readArticles().find(a => a.slug === req.params.slug);
  if (!a) return res.status(404).json({ error: 'not_found' });
  if (a.status !== 'published' && !(req.session && req.session.authenticated)) {
    return res.status(403).json({ error: 'not_published' });
  }
  res.json(a);
});

// GET /api/articles/:id — public for published; auth required for drafts
app.get('/api/articles/:id', (req, res) => {
  const a = readArticles().find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'not_found' });
  if (a.status !== 'published' && !(req.session && req.session.authenticated)) {
    return res.status(403).json({ error: 'not_published' });
  }
  res.json(a);
});

// POST /api/articles — create (auth)
app.post('/api/articles', requireAuth, (req, res) => {
  const { zh = {}, en = {}, status, coverImage, publishedAt, slug } = req.body || {};
  const isPublished = status === 'published';
  const now = new Date().toISOString();
  const safeSlug = sanitizeSlug(slug) || `article-${Date.now()}`;
  const articles = readArticles();
  // Ensure slug uniqueness
  const finalSlug = articles.find(a => a.slug === safeSlug)
    ? `${safeSlug}-${Date.now()}`
    : safeSlug;
  const article = sanitise({
    id:          randomUUID(),
    slug:        finalSlug,
    status:      isPublished ? 'published' : 'draft',
    coverImage:  coverImage  || '',
    publishedAt: isPublished ? (publishedAt || now) : null,
    updatedAt:   now,
    zh: { title: zh.title || '', summary: zh.summary || '', content: zh.content || '', format: zh.format === 'html' ? 'html' : 'markdown' },
    en: { title: en.title || '', summary: en.summary || '', content: en.content || '', format: en.format === 'html' ? 'html' : 'markdown' },
  });
  articles.push(article);
  writeArticles(articles);
  if (article.status === 'published') generateArticleFile(article.slug);
  res.status(201).json(article);
});

// PUT /api/articles/:id — update (auth)
app.put('/api/articles/:id', requireAuth, (req, res) => {
  const articles = readArticles();
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  const orig = articles[idx];
  const { zh = {}, en = {}, status, coverImage, publishedAt, slug } = req.body || {};
  const isPublished = status === 'published';
  const now = new Date().toISOString();
  // Update slug only if provided and different; ensure uniqueness
  let finalSlug = orig.slug;
  if (slug !== undefined) {
    const safeSlug = sanitizeSlug(slug) || orig.slug || `article-${Date.now()}`;
    const conflict = articles.find((a, i) => i !== idx && a.slug === safeSlug);
    finalSlug = conflict ? (safeSlug + '-' + Date.now()) : safeSlug;
  }
  articles[idx] = sanitise({
    ...orig,
    slug:        finalSlug,
    status:      isPublished ? 'published' : 'draft',
    coverImage:  coverImage !== undefined ? coverImage : orig.coverImage,
    publishedAt: isPublished ? (orig.publishedAt || publishedAt || now) : orig.publishedAt,
    updatedAt:   now,
    zh: {
      title:   zh.title   !== undefined ? zh.title   : orig.zh.title,
      summary: zh.summary !== undefined ? zh.summary : orig.zh.summary,
      content: zh.content !== undefined ? zh.content : orig.zh.content,
      format:  zh.format === 'html' ? 'html' : 'markdown',
    },
    en: {
      title:   en.title   !== undefined ? en.title   : orig.en.title,
      summary: en.summary !== undefined ? en.summary : orig.en.summary,
      content: en.content !== undefined ? en.content : orig.en.content,
      format:  en.format === 'html' ? 'html' : 'markdown',
    },
  });
  writeArticles(articles);
  // Sync article HTML files
  if (orig.slug !== articles[idx].slug) deleteArticleFile(orig.slug);
  if (articles[idx].status === 'published') generateArticleFile(articles[idx].slug);
  else deleteArticleFile(articles[idx].slug);
  res.json(articles[idx]);
});

// DELETE /api/articles/:id — auth
app.delete('/api/articles/:id', requireAuth, (req, res) => {
  const articles = readArticles();
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  const slug = articles[idx].slug;
  articles.splice(idx, 1);
  writeArticles(articles);
  deleteArticleFile(slug);
  res.json({ status: 'ok' });
});

// POST /api/upload-image — auth, accepts base64 data URL, saves to data/uploads/
app.post('/api/upload-image', requireAuth, (req, res) => {
  const { data, filename } = req.body || {};
  if (!data || typeof data !== 'string' || !data.startsWith('data:image/')) {
    return res.status(400).json({ error: 'invalid_image' });
  }
  const m = data.match(/^data:image\/([\w+]+);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: 'invalid_format' });
  const rawExt  = m[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg').toLowerCase();
  if (!['jpg', 'png', 'gif', 'webp', 'svg'].includes(rawExt)) {
    return res.status(400).json({ error: 'unsupported_type' });
  }
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: 'too_large' });
  const safeName = (filename || 'img').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40) || 'img';
  const fname    = `${Date.now()}_${safeName}.${rawExt}`;
  fs.writeFileSync(path.join(IMG_DIR, fname), buf);
  res.json({ url: `/img/${fname}` });
});

// ── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Simple-Business-Websitebuilder] Server running on http://localhost:${PORT}`);
  console.log(`[Simple-Business-Websitebuilder] Admin panel: http://localhost:${PORT}/admin.html`);
});
