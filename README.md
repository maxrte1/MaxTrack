# MaxTrack

A simple, browser-based study planner for students. Add tasks by subject, set priorities and deadlines, spot overdue work and track progress on a dashboard.

Built as the Web Development (2026FSWD100) mini-project at Bennett University, using only HTML5, CSS3 and vanilla JavaScript.

**Live site:** https://maxrte1.github.io/MaxTrack/

## The problem

Students manage assignments, labs and exams across many subjects, but their deadlines end up scattered across notes, chat groups and memory. This leads to missed deadlines and poor prioritisation. MaxTrack gives them one place to organise tasks, see what is overdue and see how much they have finished.

## Features

- **Task management:** add, edit, delete and complete tasks (title, subject, deadline, priority, notes)
- **Form validation:** custom, field-by-field error messages on both forms
- **Filter and search:** by subject, priority and status (pending, completed, overdue), plus a title search
- **Deadline tracking:** overdue and due-soon tasks are highlighted automatically
- **Dashboard:** totals, tasks due in 3 days, overdue count, progress bars per subject and the next deadlines
- **Responsive design:** works from phone width upward, with a collapsible mobile menu
- **Accessibility:** semantic HTML, skip link, labelled form fields, `aria-current` on the active page, keyboard focus styles
- **Saved in the browser:** tasks persist with localStorage, no account needed

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Home page with the dashboard |
| `planner.html` | Add, edit, filter and complete tasks |
| `about.html` | Project description, team and contact form |

## Project structure

```
MaxTrack/
  index.html
  planner.html
  about.html
  README.md
  css/
    style.css        all styling (Flexbox, Grid, media queries)
  js/
    storage.js       saves and loads tasks, date helpers
    nav.js           mobile menu toggle
    validate.js      form validation
    planner.js       task add, edit, delete, filter, render
    dashboard.js     stats, subject progress, upcoming deadlines
```

## How to run

No installation or build step is needed.

1. Download or clone the repository.
2. Open `index.html` in any modern browser.

Optionally, run it with a local server such as the VS Code Live Server extension.

## Technologies

- **HTML5:** semantic elements and accessible forms
- **CSS3:** custom properties, Flexbox, Grid and responsive media queries
- **JavaScript (ES6):** DOM manipulation, event handling, validation and localStorage

## Limitations

- Data is stored only in the browser it was entered in. It is not shared between devices, and clearing the browser data removes it.
- The contact form checks the input but does not send the message anywhere, because the project has no backend.

## Future scope

- A backend and database so tasks sync across devices
- Reminders and notifications for upcoming deadlines
- A calendar view and charts
- User accounts and shared study groups

## Team

| Name | Role |
|---|---|
| Max | Add your role here |
| Member 2 | Add your role here |
| Member 3 | Add your role here |
| Member 4 | Add your role here |

## Acknowledgements

Thanks to our course faculty for guidance on the project requirements.
