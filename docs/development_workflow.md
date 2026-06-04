# Development Workflow

## Default Flow

1. Update source registry and dictionary files.
2. Normalize source data into explicit JSON files.
3. Build or update module pages.
4. Run basic validation.
5. Update iteration log.

## Validation

Before delivery:

```powershell
python scripts/generate_leads_v0_1.py
python -m http.server 8787 --directory portal
```

Open:

```text
http://localhost:8787/
http://localhost:8787/pages/leads/
```

For generated HTML with inline JS, run a JS syntax check before deployment.

## GitHub

GitHub is not required for local MVP.

Recommended sequence:

1. Finish local MVP.
2. Initialize git in this project root.
3. Commit scaffold and docs.
4. Create remote repository.
5. Push and optionally deploy to GitHub Pages.

## Versioning

Script file names include versions:

```text
build_dictionaries_v0_1.py
generate_leads_v0_1.py
```

Major page or data contract changes should be recorded in `docs/iteration_log.md`.

