# 拾句 — Design Spec

**Date**: 2026-06-12
**Project**: Glean
**中文站名**: 拾句
**English name**: Glean
**Status**: Approved

---

## Context

Build a website called **拾句 (Glean)** that delivers a daily classical Chinese quote (古文) with AI-generated explanations, pinyin, English translations, and real-world usage scenarios. Users can browse historical quotes and subscribe to receive daily content via email. The AI generation acts as an autonomous agent that handles deduplication, quality validation, and self-correction.

**Target audience**: Broad — general Chinese readers, students, content creators.
**Languages**: Bilingual (Chinese + English).

---

## Architecture

**Approach: Server-first**

- Next.js 16 App Router + Server Components + Server Actions + API Routes
- Neon Postgres (serverless) for data storage
- Resend for transactional email
- DeepSeek API for AI content generation
- External cron (Vercel Cron or cron-job.org) triggers daily generation

**Why**: Simplest architecture that leverages Next.js native capabilities. No extra job queue needed at this scale.

---

## Data Model

### `daily_quotes`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `date` | DATE (UNIQUE) | The date this quote is for |
| `quote_zh` | TEXT | Classical Chinese original text |
| `quote_en` | TEXT | English translation |
| `pinyin` | TEXT | Pinyin with tone marks |
| `source` | TEXT | Source work (e.g. 《论语》) |
| `author` | TEXT | Author (e.g. 孔子) |
| `explanation_zh` | TEXT | Modern Chinese explanation |
| `explanation_en` | TEXT | English explanation |
| `scenario_zh` | TEXT | Usage scenario (Chinese) |
| `scenario_en` | TEXT | Usage scenario (English) |
| `theme_keywords` | TEXT[] | Theme keywords for semantic dedup, e.g. `["修身","自省"]` |
| `raw_ai_response` | JSONB | Raw DeepSeek response for debugging |
| `created_at` | TIMESTAMP | Record creation time |

### `subscribers`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `email` | TEXT (UNIQUE) | Subscriber email |
| `locale` | TEXT | Preferred language (`zh` / `en`) |
| `verified` | BOOLEAN | Whether email is verified |
| `verification_token` | TEXT | Token for email verification link |
| `subscribed_at` | TIMESTAMP | Subscription time |
| `unsubscribed_at` | TIMESTAMP | Unsubscribe time (nullable) |

### `generation_log`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `date` | DATE | The date being generated for |
| `source_tried` | TEXT | Which classical source was attempted |
| `quote_hash` | TEXT | SHA-256 hash of the generated quote text |
| `status` | TEXT | `success` / `rejected_duplicate` / `rejected_quality` |
| `reject_reason` | TEXT | Why it was rejected (if applicable) |
| `attempt` | INTEGER | Which attempt number (1-5 per day) |

**Design decisions**:
- Bilingual fields stored as separate columns (not JSON) for simpler queries and Postgres indexing.
- `theme_keywords` as TEXT[] enables array overlap queries for semantic dedup.
- `generation_log` provides full audit trail of the generation agent's decisions.

---

## Page Structure & Routes

```
src/app/
├── page.tsx                    # Home — today's quote (Server Component)
├── layout.tsx                  # Root layout — fonts, metadata, global styles
├── globals.css                 # Tailwind v4 + custom theme
├── subscribe/
│   └── page.tsx                # Subscribe page — email input form
├── subscribe/verify/
│   └── page.tsx                # Verification page — after clicking email link
├── unsubscribe/
│   └── page.tsx                # Unsubscribe page
├── archive/
│   └── page.tsx                # Archive — browse all quotes by month
├── archive/[date]/
│   └── page.tsx                # Single day detail page
├── api/
│   ├── generate/route.ts       # Cron trigger — generate daily quote + send emails
│   ├── subscribe/route.ts      # POST — handle subscription request
│   └── unsubscribe/route.ts    # POST — handle unsubscribe
└── actions/
    └── subscribe.ts            # Server Actions for form submission
```

**Key decisions**:
- Home and archive pages are Server Components for SEO and performance.
- Subscribe/unsubscribe uses Server Actions for form handling.
- Each day has a unique URL (`/archive/2026-06-12`) for sharing and SEO.
- `/api/generate` is a standalone API Route triggered by external cron.

---

## AI Generation Agent

### Overview

The generation process runs as an autonomous agent with 5 phases, up to 5 attempts per day:

```
Cron trigger (daily UTC 00:00 = Beijing 08:00)
    ↓
GET /api/generate (with secret key verification)
    ↓
Phase 1: Select source → Phase 2: Generate → Phase 3: Dedup + Validate
    ↓ (if rejected → back to Phase 1, attempt++)
Phase 4: Fix minor issues → Phase 5: Store + Email
```

### Phase 1: Source Selection

- Query last 60 days of used sources from `daily_quotes` → exclusion list.
- Randomly pick from a curated list of 20+ classical sources, excluding the exclusion list.
- If all sources exhausted → expand to 90-day window (allow same book, different passage).

**Curated sources** (22):
《论语》《道德经》《庄子》《孟子》《诗经》《楚辞》《孙子兵法》《史记》《周易》《尚书》《礼记》《左传》《大学》《中庸》《荀子》《韩非子》《墨子》《吕氏春秋》《战国策》《古文观止》《唐诗三百首》《宋词三百首》

### Phase 2: Generate

Call DeepSeek API with structured JSON output:

- **Model**: `deepseek-chat`
- **Temperature**: 0.8
- **System prompt**: "你是一位精通中国古典文学的学者，擅长将古代智慧与现代生活联系起来。"
- **User prompt**: Requests JSON with fields: `quote_zh`, `pinyin`, `quote_en`, `source`, `author`, `explanation_zh`, `explanation_en`, `scenario_zh`, `scenario_en`, `theme_keywords[]`

### Phase 3: Deduplication + Validation (three layers)

**Layer 1 — Source-level dedup**:
- Already handled in Phase 1 (exclude recent sources).

**Layer 2 — Text-level dedup**:
- Compute SHA-256 hash of `quote_zh` → check against `generation_log.quote_hash`.
- Substring check: compare new quote against all quotes in last 90 days.
- Exact or substring match → reject as `rejected_duplicate`.

**Layer 3 — Semantic dedup + Quality validation** (single DeepSeek call):
- Input: generated JSON + recent 90-day `theme_keywords` arrays.
- Prompt asks DeepSeek to evaluate:
  1. Is the classical text accurate and matching the attributed source?
  2. Is pinyin correct?
  3. Is the explanation accurate?
  4. Is the English translation elegant ("信达雅")?
  5. Is the usage scenario practical and realistic?
  6. Is the content semantically too similar to recent themes?
- Returns: `pass` / `fail` with specific issues and suggested fixes.
- If `fail` → record in `generation_log`, increment attempt, return to Phase 1.

### Phase 4: Fix Minor Issues

- If Phase 3 found only minor issues (typos, translation polish), not fundamental duplication:
- Call DeepSeek once more with the specific fix requests.
- Do NOT re-select source or regenerate from scratch.

### Phase 5: Store + Email

- Insert into `daily_quotes`.
- Query all verified subscribers grouped by locale.
- Send via Resend:
  - Chinese subscribers → Chinese email template
  - English subscribers → English email template
- Email failure does not block content storage.

### Degradation

- If all 5 attempts fail → use the last generated result.
- Log a warning for manual review.

---

## Email Subscription Flow

### Subscribe

1. User enters email + selects language on `/subscribe`.
2. Server Action creates subscriber record with `verified: false` and a random `verification_token`.
3. Resend sends verification email with link: `/subscribe/verify?token=xxx`.
4. User clicks link → `/subscribe/verify` page calls server to set `verified: true`.
5. Confirmation message shown.

### Daily Email

- Sent as part of Phase 5 of the generation agent.
- Email template matches the website's bookish aesthetic.
- Contains: date, quote + pinyin, explanation, usage scenario.
- Footer has unsubscribe link: `/unsubscribe?token=xxx`.

### Unsubscribe

1. User clicks link in email → `/unsubscribe?token=xxx`.
2. Server looks up subscriber by token, sets `unsubscribed_at`.
3. Confirmation message shown.

---

## UI Design

### Visual Style: Bookish / Literary

- **Background**: Warm parchment (#F5F0E8) with subtle paper texture (CSS noise pattern).
- **Text**: Deep brown (#3C2415) for body, black for emphasis.
- **Accent**: Cinnabar red (#C53D43) for links, highlights, decorative elements.
- **Fonts**:
  - Chinese: Noto Serif SC (Google Fonts) — elegant serif for classical text.
  - English: Crimson Pro (Google Fonts) — literary serif.
  - Pinyin: Same as English, italic.
- **Decorations**: Subtle ink-wash borders, minimalist seal stamps (印章) as accents.
- **Cards**: Soft shadows, slightly rounded corners (4px), cream-white backgrounds.

### Home Page Layout

```
┌─────────────────────────────────────────┐
│  拾句 · Glean        归档  订阅  EN/中   │  ← Minimal nav
├─────────────────────────────────────────┤
│                                         │
│           2026年6月12日 / June 12        │  ← Date
│                                         │
│     ┌─────────────────────────┐         │
│     │                         │         │
│     │   学而不思则罔，          │         │  ← Classical text (large)
│     │   思而不学则殆。          │         │
│     │                         │         │
│     │   xué ér bù sī zé wǎng, │         │  ← Pinyin (small, italic)
│     │   sī ér bù xué zé dài.  │         │
│     │                         │         │
│     │   ── 《论语·为政》 孔子   │         │  ← Source attribution
│     └─────────────────────────┘         │
│                                         │
│  ┌──────────────┐  ┌────────────────┐   │
│  │  释义         │  │  使用场景       │   │
│  │              │  │               │   │
│  │  Chinese...  │  │  Chinese...   │   │
│  │  English...  │  │  English...   │   │
│  └──────────────┘  └────────────────┘   │
│                                         │
│     [← 昨天]   [分享]   [订阅邮件]       │  ← Action bar
│                                         │
├─────────────────────────────────────────┤
│  © 2026 拾句 · Glean                    │
└─────────────────────────────────────────┘
```

### Archive Page

- Cards grouped by month (collapsible month headers).
- Each card shows: date + first line of classical text + source.
- Click navigates to `/archive/YYYY-MM-DD`.

### Subscribe Page

- Clean, centered layout.
- Email input + language toggle (中文 / English) + subscribe button.
- Post-submit: "请检查邮箱确认订阅" / "Check your email to confirm".

### Mobile Responsive

- Single-column layout on mobile.
- Font sizes scale down gracefully.
- Touch-friendly tap targets for all interactive elements.

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...    # Neon connection string

# DeepSeek AI
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Email (Resend)
RESEND_API_KEY=re_...

# Cron Security
CRON_SECRET=...                  # Shared secret for /api/generate endpoint

# App
NEXT_PUBLIC_BASE_URL=https://glean.example.com
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle ORM (lightweight, type-safe) |
| AI | DeepSeek API (deepseek-chat) |
| Email | Resend |
| Fonts | Noto Serif SC + Crimson Pro (Google Fonts) |
| Cron | Vercel Cron Jobs (or cron-job.org) |
| Deployment | Vercel |

---

## Verification Plan

1. **Local dev**: Run `pnpm dev`, verify homepage renders with mock data.
2. **DB setup**: Run Drizzle migrations, verify tables created in Neon.
3. **AI generation**: Hit `/api/generate` manually with CRON_SECRET, verify quote generated and stored.
4. **Dedup**: Hit `/api/generate` again, verify it skips or regenerates a different quote.
5. **Subscribe flow**: Submit email on `/subscribe`, check DB record, verify email received via Resend.
6. **Archive**: Generate 2-3 quotes manually, verify `/archive` page lists them and `/archive/[date]` shows detail.
7. **Email**: Verify daily email template renders correctly in Gmail/Outlook.
8. **Mobile**: Test responsive layout on Chrome DevTools mobile view.
