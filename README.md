# Career Tracker

A personal dashboard for tracking certifications, training, and career accomplishments. Admin panel for logging entries, public dashboard for seeing the full picture at a glance.

## What it does

- **Dashboard** with stats, recent wins timeline, and certification overview with expiration tracking
- **Certifications** page showing every cert with earned date, expiration, and active/scheduled/expiring status
- **Training** log for courses and labs with completion tracking
- **Wins** timeline for accomplishments big and small
- **Admin panel** to add, view, and delete entries across all categories

## How it works

Clean minimal dashboard with an icon rail sidebar for navigation. Certs show active/scheduled/expiring badges with countdowns. Training entries are tagged by type (course, lab, workshop). Accomplishments render as a timeline sorted by date.

Currently uses browser storage for persistence. The Next.js + Supabase production build adds real auth on the admin panel and a proper database backend.

## Tech stack

- Next.js (React)
- Supabase (auth + database in production)
- Deployed on Vercel

## Run locally

```bash
git clone https://github.com/securepixels/career-tracker.git
cd career-tracker
# Open index.html in your browser, or:
npx serve .
```
