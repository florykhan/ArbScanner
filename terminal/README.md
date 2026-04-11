# Terminal Workspace

This directory is reserved for the terminal-first ArbScanner UI.

The shared processing backend lives in the root `backend/` directory.

Current implementation:

- `run_dashboard.py` starts the first Textual shell
- `tui/backend_gateway.py` reads and dismisses alerts through backend services
- `tui/app.py` renders the operator dashboard

Current dashboard behavior:

- reads real active alerts from MySQL through `backend.services.alert_service.AlertService`
- shows a header, status bar, summary stats, active alert table, and recent activity panel
- supports keyboard refresh with `r`, dismiss with `d`, and quit with `q`
- leaves scanner/arbitrage logic in the backend service layer

Run locally:

```bash
python3 -m terminal.run_dashboard
```

Dependencies:

- `textual`
- `mysql-connector-python`

Planned areas still open:

- `tui/` for the Textual dashboard
- `docs/` for terminal-specific scope notes and architecture decisions
- `tests/` for terminal-specific test coverage
