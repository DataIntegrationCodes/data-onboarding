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

### Scheduling automatic refreshes

`scripts/refresh.bat` wraps the steps above for unattended use: it runs the export, and only
commits + pushes if `data/tracker.json` actually changed (a no-op run exits cleanly without
touching git). Output is appended to `scripts/refresh.log` (git-ignored) so you can check what
happened after the fact.

To schedule it with Windows Task Scheduler:

1. Test it manually first: double-click `scripts/refresh.bat`, then check `scripts/refresh.log`
   to confirm it found Python/git and either pushed or reported "No changes to commit."
2. Open Task Scheduler → **Create Task…** (not "Basic Task", so you get the full options).
3. **General** tab: give it a name, and select "Run whether user is logged on or not" if you want
   it to work even when locked. This requires your Windows account password to be saved for the task.
4. **Triggers** tab: **New…** → set the schedule (e.g. daily).
5. **Actions** tab: **New…** →
   - Action: *Start a program*
   - Program/script: `C:\Users\HRampelwa.INNOWIND\source\repos\DataIntegrationCodes\DataOnboarding\scripts\refresh.bat`
   - Start in: `C:\Users\HRampelwa.INNOWIND\source\repos\DataIntegrationCodes\DataOnboarding\scripts`
6. Save, then right-click the task → **Run** once to confirm it works under the scheduler
   (permissions/PATH can differ from an interactive shell), and check `refresh.log` again.

Git push relies on your existing credential manager/cache — if the task runs under a different
account than you push from normally, it will need its own git credentials configured.

## Run locally

Any static file server works, e.g.:

```
npx serve .
```

Then open the printed URL.

## Deploy

This is a zero-config static site — deploy the repo root directly on Vercel (no build command, no output directory override needed).

## Access control

`middleware.js` puts the whole site behind HTTP Basic Auth (the browser's built-in username/password
prompt) using Vercel Edge Middleware. This only takes effect on Vercel — running the site locally via
`npx serve` or `python -m http.server` is unprotected, which is expected for local dev.

To enable it:

1. In the Vercel dashboard, open the project → **Settings** → **Environment Variables**.
2. Add `SITE_PASSWORD` (required) and optionally `SITE_USERNAME` (defaults to `admin` if unset).
3. Redeploy (or trigger a new deployment by pushing any commit) so middleware picks up the variables.
4. Visiting the site will now prompt for the username/password before showing any content.

The password is never stored in the repo — only in Vercel's environment variable store. Anyone with
the credentials can access the whole dashboard; there's no per-user distinction. If you later need
separate accounts per person, that requires a real auth provider and is a bigger change than this.
