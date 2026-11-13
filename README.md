# PeopleHub — ReactJS modularized source

## Run locally
```powershell
npm install
npm run dev
```

## Source layout
- `src/App.jsx`: selects the active screen and coordinates shared search, dialogs and notifications.
- `src/main.jsx`: mounts React and runs the backend health check.
- `src/pages/`: dashboard, employee, subject and course screens.
- `src/components/employees/`: employee list and employee form.
- `src/components/layout/`: shared shell, sidebar navigation and top bar.
- `src/components/common/`: reusable status, statistic and empty-state components.
- `src/components/modals/`: shared edit forms and course details.
- `src/services/`: shared HTTP client, staff API and health API.
- `src/hooks/usePageNavigation.js`: restores the active page from the URL.
- `src/hooks/usePeopleHubData.js`: shared employee, subject and course state, mutations and localStorage persistence.
- `src/data/initialData.js`: demo data for employees, subjects and courses.
- `src/utils/`: localStorage helpers, display helpers and employee Excel export.
- `src/styles.css`: global styles.

## Notes
The employee management page uses the backend Staff API. The dashboard and training pages use browser-local data.
