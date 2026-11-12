# Issue tracker: GitHub

Issues and PRDs live in [Belleye/Leaflet-PCF](https://github.com/Belleye/Leaflet-PCF/issues), matching `origin`. Use `triage` for findings and follow-up work; do not establish a parallel local issue tracker.

Use authenticated `gh` inside this clone. Check `git remote -v`, `gh auth status`, existing issues and labels first. `gh issue list --state all --limit 100` helps detect duplicates; use search/pagination for more history. Read full context with `gh issue view <number> --comments`. Verify labels with `gh label list --limit 100` before applying the [mapping](triage-labels.md).

Create with `gh issue create --title "..." --body-file <file>`, comment with `gh issue comment <number> --body-file <file>`, and change labels with `gh issue edit <number> --add-label "..." --remove-label "..."`. Write multiline bodies to UTF-8 temporary files with real newlines. Use the triage skill's required AI disclaimer at the start of every posted issue/comment. Recommend category/state with evidence and wait for maintainer direction before applying a triage outcome.

On 2026-11-12, GitHub CLI was installed at `C:/Program Files/GitHub CLI/gh.exe` and authenticated as `Belleye`. New terminals may be needed to pick up its PATH entry. If access is unavailable, present reviewable candidates and report the limitation. Do not claim an issue is filed or labels exist without checking.
