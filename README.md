# Data Onboarding Tracker Dashboard

Static dashboard visualizing the Nsight data onboarding status across the EDF Asset Operations wind/solar/storage portfolio.

## Data

`data/tracker.json` is a snapshot exported from `Data Onboarding Tracker.xlsx` (Onboarding Dashboard + Tracker sheets), enriched with technical-documentation file counts pulled from each project's `Technical Information` folder.

To refresh the dashboard after the tracker changes, re-export the sheets to `data/tracker.json` in the same shape and commit the update.

## Run locally

Any static file server works, e.g.:

```
npx serve .
```

Then open the printed URL.

## Deploy

This is a zero-config static site — deploy the repo root directly on Vercel (no build command, no output directory override needed).
