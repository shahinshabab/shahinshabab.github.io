# Light theme design (approved, in progress)

White/light variant of the portfolio redesign — same base layout and
structure as [../dark-theme](../dark-theme), flipped to a light palette,
with Shahin's own photo (`headshot.jpg`, downsized from `assets/images/hero 1.png`)
featured in the hero instead of the abstract dashboard-only graphic.

Expanded with more content, sections and animation:
- Stats band (projects delivered, accuracy, certifications, CGPA)
- Tools & Technologies marquee (two rows, opposite-direction auto-scroll)
- "How I work" 4-step process section
- Second certification added to the Journey timeline: NPTEL (IIT Madras)
  "Social Network Analysis", Jul–Oct 2024, Elite, score 70%
- CSS animations throughout: pulsing eyebrow dots, floating stat card,
  shimmering skill bars, staggered fade-up entrances, hover-lift on cards,
  animated gradient stat numbers
- Services trimmed to 6 cards, with a new "Data Pipeline Development"
  service (Shahin's own suggestion) replacing the overlapping
  "Performance Tracking" card
- Projects section now shows 6 real repos from github.com/shahinshabab
  instead of placeholder content: Sales Pipeline Analysis (SQL/MySQL),
  CRM Sales Dashboard (Google Sheets), Coffee Shop Sales Dashboard
  (Power BI), HR Analytics Dashboard (Power BI), Airbnb Listing Analysis
  (Python), Global CO₂ Emission Dashboard (Tableau) — each links out to
  its GitHub repo

Note: certifications beyond GeeksforGeeks and the NPTEL Social Network
Analysis cert (found in `Certificate/`) could not be pulled from
LinkedIn — the profile is behind LinkedIn's anti-scraping wall — so the
Journey section still only lists the two certificates confirmed from
local files.

Live mockup: https://claude.ai/code/artifact/6df982a8-fcac-4120-b0bd-849e15fabd42

Files: `Main.dc.html` (desktop), `Mobile.dc.html` (mobile), `canvas.json` (layout),
`headshot.jpg` (hero photo).

Note: the photo is used as-is (existing studio photo, cropped/framed in CSS) —
no AI photo editing/retouching was applied to change the outfit or pose.
