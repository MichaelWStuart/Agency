# Armory

> Shared capabilities catalog. Tools and techniques available to all agents.

---

## Browser Automation

### Chrome DevTools MCP
- Page navigation, snapshot, screenshot
- DOM extraction (evaluate_script)
- Network request inspection
- Console message monitoring
- Element interaction (click, fill, hover, type)
- Performance tracing

### Playwright MCP
- Page navigation, snapshot, screenshot
- Element interaction (click, type, fill_form)
- Network request monitoring
- Console message retrieval
- Multi-tab management
- File upload

### When to Use Which
- **Chrome DevTools:** When connected to an existing browser session (reference app scraping, authenticated pages)
- **Playwright:** When launching a fresh browser instance (QA of our app, E2E-style verification)

---

## Seed Data Management

### Database Reset
```bash
pnpm prisma:migrate && pnpm prisma:seed
```

### Dev Server
```bash
pnpm dev          # Start on port 3002
lsof -ti:3002 | xargs kill -9   # Kill
lsof -ti:3000 | xargs kill -9   # Kill fallback port
```

---

## Evidence Capture

### Screenshot
- Chrome DevTools: `take_screenshot` with filePath
- Playwright: `browser_take_screenshot` with filename
- Full-page: `fullPage: true`
- Element-specific: provide uid/ref

### DOM Snapshot
- Chrome DevTools: `take_snapshot` (a11y tree)
- Playwright: `browser_snapshot` (a11y tree)
- Custom extraction: `evaluate_script` with DOM walker

### Network Inspection
- Chrome DevTools: `list_network_requests` + `get_network_request`
- Playwright: `browser_network_requests`
- Filter by resource type: xhr, fetch, document

---

## External Systems

### Linear MCP
- Issue CRUD, status transitions, comments
- Project/cycle/initiative management
- User and team queries
- Customer and need tracking

### GitHub CLI (`gh`)
- PR creation, review, merge
- Check-run status polling
- Branch management
- Issue interaction

### Git
- Branch operations
- Commit, push, rebase
- Diff and log inspection
- Merge conflict resolution
