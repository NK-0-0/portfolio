# Project Vision — Kakashi 3D Portfolio

## Concept

An interactive 3D portfolio built in Angular where the visitor navigates content by interacting with a real-time rendered scene of **Kakashi Hatake**. Each meaningful part of his character design maps to a portfolio section. The character is both the art direction *and* the navigation system.

The visitor lands on a full-screen 3D canvas. Kakashi stands in a neutral pose inside a stylised environment (forest clearing, moon lighting). Hovering over specific parts of his body triggers a glow highlight and a floating label. Clicking opens a side panel with the corresponding portfolio content. The camera stays fixed — no orbit — keeping the experience controlled and load-fast.

---

## Body Part → Section Mapping

| Part of Kakashi            | Portfolio Section | Rationale                                                                 |
|----------------------------|-------------------|---------------------------------------------------------------------------|
| **Face / Sharingan eye**   | About Me          | Identity, who he is — the most personal, visible part                    |
| **Icha Icha book (hand)**  | Experience        | He is always reading/learning from the past. Work history lives here.    |
| **Kunai on belt**          | Skills            | Tools of the trade. Each kunai = a skill cluster.                        |
| **ANBU mask (back/hip)**   | Projects          | Covert operations = shipped, deployed work. Hidden depth.                |
| **Headband (hitai-ate)**   | Contact           | The mark of allegiance — how to reach me.                                |
| **Hand seal (optional)**   | Currently Learning| In-progress techniques — what I'm actively working on.                  |

> **Design note:** Not every mesh needs to be a hotspot. Choose 4–5 maximum to keep UX clear. Fewer, more meaningful interactions beat more cluttered ones.

---

## Visual Design Direction

- **Colour palette:** Dark background (`#0d0d0d` or deep navy), silver/teal accent for highlights, warm amber for UI panels — Naruto world meets dark-mode dev aesthetic.
- **Lighting:** Single strong directional light (moonlight), subtle ambient fill, rim light on Kakashi's silhouette.
- **Post-processing:** Bloom (subtle, not garish), OutlinePass for hovered mesh parts.
- **Environment:** Minimal. Floating leaves (particle system), sparse fog. Keep the focus on the character.
- **Typography:** Geist Mono or JetBrains Mono for code sections. A Japanese-influenced display font for section headings (Noto Serif JP or similar).

---

## Content Sections (to populate)

### About Me (Face)
- Name, role, 2–3 sentence professional summary
- The "why" — what drives you as a developer
- Avatar / photo (optional if the 3D character is strong enough)

### Experience (Book)
- Timeline: Company, role, dates, 2–3 bullet accomplishments per role
- Use date ranges — not open-ended descriptions

### Skills (Kunai)
- Group into clusters: Languages, Frameworks, Tools, Cloud/DevOps
- Consider a visual: progress indicators or tag clouds per cluster
- Be specific (`Angular 17+`, not just `Angular`)

### Projects (ANBU Mask)
- 3–5 featured projects
- Each: title, one-line description, tech stack tags, live link + GitHub link
- Screenshots or short video loops as thumbnails

### Contact (Headband)
- Email, GitHub, LinkedIn
- Optional: quick contact form (Formspree or similar — static-compatible)

---

## Open Questions / IP Risk

**Kakashi is a copyrighted character** (Masashi Kishimoto / Studio Pierrot / Viz Media). Using fan art in a **public** portfolio is legal grey territory:
- Common practice in developer portfolios, rarely actioned against for non-commercial use
- Do **not** sell, monetise, or put behind a paywall any part of this portfolio
- Add a footer attribution: *"Kakashi Hatake character © Masashi Kishimoto. Fan work — not affiliated with or endorsed by the rights holders."*
- If you ever use this portfolio commercially (e.g., as a freelance agency site), replace the character

---

## Gaps Still to Resolve Before Implementation Starts

- [ ] Exact Sketchfab model URL / licence confirmed (see `../development/ASSET_PIPELINE.md`)
- [ ] Final list of skills and experience entries written
- [ ] Decide on 4–5 hotspot parts (lock the mapping above)
- [ ] Side panel content written in final form (copy first, design second)
- [ ] Decide on "Currently Learning" section or drop it
