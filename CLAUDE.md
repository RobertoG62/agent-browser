# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Agent Browser is a bilingual (Hebrew RTL / English) skill discovery engine. Users describe a project idea in free text and get ranked recommendations from 300+ Claude agent skills (AVIZ library + skills.sh ecosystem). Pure static SPA — no build tools, no npm, no frameworks.

## Architecture

```
index.html  →  loads js/data.js (SKILLS_DATA global)  →  loads js/app.js (search engine)
                      ↑                                         ↓
              data/skills.json                     tokenize → translateHebrew → scoreSkill → renderResults
              (source of truth)                              (DocumentFragment for 300+ cards)
```

**Critical distinction:** `data/skills.json` is the source data. `js/data.js` is the runtime file loaded by the browser — it exports a `const SKILLS_DATA = [...]` array. When updating skills, edit `skills.json` then regenerate `data.js`, or edit `data.js` directly.

## Stack

- Tailwind CSS v4 via CDN (config inline in `index.html` lines 12-30)
- Google Fonts: Heebo (Hebrew body), Inter (English UI), Playfair Display (headings)
- Vanilla JS — no transpilation, no bundler
- Deploy target: GitHub Pages (static files only)

## Matching Algorithm (`js/app.js`)

Weighted scoring per token:
- **×10**: name/id match
- **×8**: useCases match (first hit per token)
- **×5**: tags match (first hit per token)
- **×3**: category match
- **×2**: description/descriptionHe match

Hebrew input goes through a 47-term translation map (`hebrewToEnglish`) before scoring. Stopwords (58 terms, both languages) are filtered during tokenization. Empty query returns all skills.

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Gold | `#C9A84C` | Primary accent, CTAs, badges |
| Gold Light | `#E8D48B` | Hover states |
| Cream | `#FAFAFA` | Text, light backgrounds |
| Charcoal | `#1A1A1A` | Main background |
| Navy | `#0A1628` | Gradient overlays |

Glassmorphism pattern: `backdrop-filter: blur(10-12px)` + `rgba(255,255,255,0.04)` background + subtle white border.

## Skill Data Schema

```json
{
  "id": "kebab-case-id",
  "name": "English Name",
  "nameHe": "שם בעברית",
  "source": "aviz | skills.sh",
  "repo": "org/repo",
  "command": "/slash-command | null",
  "installCmd": "npx skills add ... | null",
  "installCount": 12345,
  "description": "English description",
  "descriptionHe": "תיאור בעברית",
  "category": "one-of-13-categories",
  "tags": ["tag1", "tag2"],
  "useCases": ["use case 1"],
  "installed": true
}
```

Categories: `web-development`, `marketing`, `design`, `presentation`, `audio-video`, `communication`, `development`, `document`, `gaming`, `research`, `education`, `productivity`, `automation`, `data-science`, `management`, `deployment`, `publishing`.

## Key Patterns

- **RTL first**: `<html lang="he" dir="rtl">`. Action buttons override with `direction: ltr` for English CLI commands.
- **Performance**: DocumentFragment batch insertion + animation delay capped at 1s for 300+ cards. Input debounced at 800ms.
- **No pagination**: All results render at once. The scoring algorithm naturally limits relevant results when a query is provided.
- **Category pills**: Map to Hebrew search terms in `handleCategoryClick()`, then trigger normal search flow.

## Adding New Skills

1. Add entry to `data/skills.json` following the schema above
2. Update `js/data.js` to include the new entry in the `SKILLS_DATA` array
3. If adding a new category, also update:
   - Category pills in `index.html`
   - `categoryMap` in `handleCategoryClick()` in `js/app.js`
4. If the skill uses Hebrew terms not yet mapped, add to `hebrewToEnglish` in `app.js`

## Deployment

Static files only — open `index.html` directly in browser for local dev, or deploy via `/gh-pages-deploy` skill.
