# TaskFlow Lite

TaskFlow Lite is a premium, client-side, zero-backend single-page task management application built in vanilla ES6+ JavaScript, HTML, and CSS. The app features state persistence via `localStorage`, dual-theme compatibility (light/dark), and is built following strict MVC-like architectural patterns.

## Features

- **Dual-Theme System**: Beautiful light and dark themes using CSS variable tokens. Synchronizes with system default settings or manual user selections.
- **Client-Side State Persistence**: Retains tasks, active filters, and theme preferences across browser sessions using `localStorage`.
- **Inline Editing Mode**: Toggle a task into an editing state within its row without needing disruptive modals.
- **Real-Time Validation**: Input constraints are checked in real-time using debouncing (~150ms) to prevent UI layout thrashing.
- **XSS Security Protection**: Encodes and escapes task text inputs prior to rendering.
- **High-Contrast Accessibility**: Meets standard accessibility goals including tab indexing, aria attributes, focus outlines, and semantic HTML elements.

---

## File & Folder Structure

```text
taskflow-lite/
├── index.html          # Main application interface and DOM shell
├── styles/
│   ├── main.css        # Core design system, variables, layouts & styles
│   └── utilities.css   # Spacing, flex, and accessibility helpers
├── app.js              # Application entry point (State and Controller)
├── modules/
│   ├── storage.js      # Safe localStorage read/write abstraction layer
│   ├── render.js       # HTML sanitizing and DOM rendering operations
│   └── validation.js   # Character length and input validation checks
├── images/
│   └── empty-tasks.svg # Empty state graphic vector resource
└── README.md           # Project documentation and developer reference
```

---

## Application Architecture

TaskFlow Lite uses a clean **MVC (Model-View-Controller)** pattern implemented with native ES modules:

```mermaid
graph TD
    UserAction[User Action] -->|Triggers event listener| Controller[app.js: Controller]
    Controller -->|Validates & Updates| Model[tasks[] Array in app.js]
    Model -->|Persist to storage| Persist[storage.js: localStorage]
    Model -->|Refresh UI view| View[render.js: Rebuild DOM]
    View -->|Update Screen| User[User Screen]
```

### Data Model Schema

#### Task Object
```json
{
  "id": 1700000000000, 
  "text": "Learn JavaScript", 
  "completed": false, 
  "createdAt": "2026-06-25T10:00:00.000Z"
}
```

#### localStorage Keys
- `tasks`: Stringified JSON list of tasks.
- `theme`: `"light" | "dark"`.
- `filter`: `"all" | "active" | "completed"`.

---

## Verification & QA Checklist

1. **Persist State Check**: Refresh the page to verify that the theme preference, active filter, and tasks persist exactly as configured.
2. **Keyboard Access Check**: Press `Tab` to verify focus circles around form input, buttons, list checkboxes, edit buttons, and delete buttons. Validate inline-editor with `Enter` (save) and `Escape` (cancel).
3. **Safety Check**: Input characters such as `<script>alert('xss')</script>` or `<img src=x onerror=alert(1)>` to confirm they are safely escaped.
4. **Validation Check**: Verify that the submit button is disabled when empty or whitespace is typed, and an error message is visible under the input field if input length exceeds 120 characters.
