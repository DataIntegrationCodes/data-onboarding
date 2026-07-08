# Data Onboarding Tracker Dashboard

Static dashboard visualizing the Nsight data onboarding status across the EDF Asset Operations wind/solar/storage portfolio.

## Data

`data/tracker.json` is exported from `Data Onboarding Tracker.xlsx` (Onboarding Dashboard + Tracker sheets), enriched with technical-documentation file counts pulled from each project's `Technical Information` folder.

### Refreshing the data

Whenever the tracker workbook changes, regenerate the snapshot and push:

```
pip install -r scripts/requirements.txt
python scripts/export_tracker.py
git add data/tracker.json
git commit -m "Refresh tracker data"
git push
```

By default the script reads the workbook from its known OneDrive path and re-scans the
`Technical Information` folders for documentation completeness. Override either location if needed:

```
python scripts/export_tracker.py --source "D:\path\to\Data Onboarding Tracker.xlsx" --assets-root "D:\path\to\Asset Operations - NSight"
```

Pushing the updated `data/tracker.json` triggers an automatic redeploy on Vercel.

## Run locally

Any static file server works, e.g.:

```
npx serve .
```

Then open the printed URL.

## Deploy

This is a zero-config static site — deploy the repo root directly on Vercel (no build command, no output directory override needed).
