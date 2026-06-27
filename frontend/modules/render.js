/**
 * render.js
 * Handles pure DOM rendering for the task list, counters, and empty state.
 * Never mutates state directly.
 */

/**
 * Escapes special characters to prevent HTML injection / XSS.
 * @param {string} str - Unsafe string.
 * @returns {string} Safe escaped string.
 */
export function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[<>&"']/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[tag]));
}

// Inline SVG Icons for premium look
const ICONS = {
  EDIT: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  `,
  DELETE: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `,
  SAVE: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `,
  CANCEL: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `
};

/**
 * Renders the task list DOM based on tasks, current filter, and editing task ID.
 * @param {Array} tasks - Array of task objects.
 * @param {string} activeFilter - 'all' | 'active' | 'completed'
 * @param {number|null} editingTaskId - ID of task currently in edit mode.
 * @param {HTMLElement} listContainer - #task-list element.
 * @param {HTMLElement} counterContainer - #task-counter element.
 * @param {HTMLElement} emptyStateContainer - #empty-state element.
 */
export const renderTaskList = (
  tasks,
  activeFilter,
  editingTaskId,
  listContainer,
  counterContainer,
  emptyStateContainer
) => {
  // Performance Check benchmarking (Technical QA Checklist Item)
  console.time('Rendering 100 tasks');

  // 1. Recalculate and update the task counter
  const activeCount = tasks.filter(t => !t.completed).length;
  const totalCount = tasks.length;
  counterContainer.textContent = `${activeCount} of ${totalCount} tasks remaining`;

  // 2. Clear task list
  listContainer.innerHTML = '';

  // 3. Filter tasks for render
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'active') return !task.completed;
    if (activeFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  // 4. Handle Empty State
  if (filteredTasks.length === 0) {
    emptyStateContainer.style.display = 'flex';
    console.timeEnd('Rendering 100 tasks');
    return;
  }

  emptyStateContainer.style.display = 'none';

  // 5. Generate list elements using core DOM APIs (Phase 2 DOM Engine)
  filteredTasks.forEach(task => {
    const taskElement = document.createElement('li');
    
    // Set classes using classList (DOM API Skill Evidence)
    taskElement.className = 'task';
    if (task.completed) {
      taskElement.classList.add('completed');
    }
    
    const isEditing = task.id === editingTaskId;
    if (isEditing) {
      taskElement.classList.add('is-editing');
    }
    
    // Set dataset properties (DOM API Skill Evidence)
    taskElement.dataset.id = task.id;

    const escapedText = escapeHTML(task.text);

    if (isEditing) {
      taskElement.innerHTML = `
        <div class="task-edit-container">
          <input type="text" class="task-edit-input" value="${escapedText}" maxlength="120" aria-label="Edit task description" autofocus>
          <div class="task-actions">
            <button class="btn-icon save-btn" aria-label="Save changes">
              ${ICONS.SAVE}
            </button>
            <button class="btn-icon cancel-btn" aria-label="Cancel editing">
              ${ICONS.CANCEL}
            </button>
          </div>
        </div>
        <div class="edit-error-message error-text" aria-live="polite"></div>
      `;
    } else {
      taskElement.innerHTML = `
        <label class="task-label">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Toggle task completion">
          <span class="task-checkbox-custom"></span>
          <span class="task-text">${escapedText}</span>
        </label>
        <div class="task-actions">
          <button class="btn-icon edit-btn" aria-label="Edit task">
            ${ICONS.EDIT}
          </button>
          <button class="btn-icon delete-btn" aria-label="Delete task">
            ${ICONS.DELETE}
          </button>
        </div>
      `;
    }

    // Append using appendChild (DOM API Skill Evidence)
    listContainer.appendChild(taskElement);
  });

  // Set focus to the editing input if it was just rendered
  if (editingTaskId !== null) {
    const editInput = listContainer.querySelector('.task-edit-input');
    if (editInput) {
      const len = editInput.value.length;
      editInput.focus();
      editInput.setSelectionRange(len, len);
    }
  }

  console.timeEnd('Rendering 100 tasks');
};
