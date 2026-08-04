@AGENTS.md

## Changelog Policy

Any turn that changes the codebase (edit, new file, fix, adjustment — no matter how small) must add one entry to `CHANGELOG.md`, grouped by day (newest day on top, newest entry within a day on top):

```
## YYYY-MM-DD

### HH:MM
> "exact user prompt, copied verbatim — no paraphrasing"

- **New:** file/thing added
- **Fix:** what was broken → what changed
- **Adjust:** tweak/rename/reorg

---
```

Only include the bullet categories that actually apply, one line each — file(s) touched + line counts, no run-on prose. If a `## YYYY-MM-DD` header for today already exists, add the entry under it instead of creating a duplicate. Separate entries with `---`.

Enforced by a `Stop` hook (`.claude/hooks/changelog-check.sh`, wired in `.claude/settings.json`): it blocks the turn from ending if there are uncommitted changes and `CHANGELOG.md` wasn't touched.
