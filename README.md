# PeopleHub — ReactJS modularized source

## Run locally
```powershell
npm install
npm run dev
```

## Source layout
- `src/App.jsx`: application shell, navigation, global state, CRUD orchestration and persistence.
- `src/main.jsx`: React entry point only.
- `src/data/initialData.js`: demo data for employees, subjects and courses.
- `src/utils/helpers.js`: localStorage helpers, status styles, initials and avatar helpers.
- `src/components/common/UI.jsx`: reusable status, statistic and empty-state components.
- `src/components/modals/EditModal.jsx`: create/edit employee, subject and course forms.
- `src/components/modals/CourseDetail.jsx`: course participant list and progress editor.
- `src/features/dashboard/Dashboard.jsx`: dashboard page.
- `src/features/employees/EmployeesPage.jsx`: employee management page.
- `src/features/subjects/SubjectsPage.jsx`: subject management page.
- `src/features/courses/CoursesPage.jsx`: course management page.
- `src/styles.css`: global styles (will be split by component in a later styling pass).

## Notes
Frontend prototype only. Data is saved in the current browser's `localStorage`; there is no backend or shared database yet.
