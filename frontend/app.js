/**
 * app.js
 * Application entry point and state controller.
 */

import {
  loadTasks,
  saveTasks,
  loadTheme,
  saveTheme,
  loadFilter,
  saveFilter
} from './modules/storage.js?v=1.7';

import { validateTaskInput } from './modules/validation.js?v=1.7';
import { renderTaskList } from './modules/render.js?v=1.7';

// Application State
let tasks = [];
let activeFilter = 'all';
let theme = 'light';
let editingTaskId = null;

// Undo/Redo State stacks (Pro Tips for Excellence)
let history = [];
let redoHistory = [];

// DOM Element Selectors cached on load
let taskForm;
let taskInput;
let submitButton;
let formError;
let taskList;
let taskCounter;
let emptyState;
let themeToggle;
let filterButtons;

// Debounce timer for real-time validation
let validationDebounceTimer;

/**
 * Saves current tasks state to undo history.
 */
const pushState = () => {
  history.push(JSON.stringify(tasks));
  if (history.length > 50) {
    history.shift();
  }
  redoHistory = []; // Clear redo stack on new action
};

/**
 * Task factory function to initialize task structures (Phase 1).
 * @param {string} text - Task description.
 * @returns {Object} Task object.
 */
const createTask = (text) => {
  return {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
};

/**
 * Renders the UI based on current state.
 */
const render = () => {
  renderTaskList(
    tasks,
    activeFilter,
    editingTaskId,
    taskList,
    taskCounter,
    emptyState
  );
};

/**
 * Safely sets the visual theme.
 * @param {string} newTheme - 'light' | 'dark'
 */
const applyTheme = (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme);
  theme = newTheme;
  saveTheme(newTheme);

  // Update theme toggle attributes for accessibility
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`);
  }
};

/**
 * Detects the initial theme preference.
 * @returns {string} 'light' | 'dark'
 */
const getInitialTheme = () => {
  const saved = loadTheme();
  if (saved) return saved;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

/**
 * Handles inline edit validation and saving.
 * @param {HTMLElement} taskEl - The task element row.
 * @param {number} taskId - ID of the task being edited.
 */
const handleSaveInlineEdit = async (taskEl, taskId) => {
  const editInput = taskEl.querySelector('.task-edit-input');
  if (!editInput) return;

  const value = editInput.value.trim();
  const validation = validateTaskInput(value);
  const errorEl = taskEl.querySelector('.edit-error-message');

  if (!validation.isValid) {
    if (errorEl) {
      errorEl.textContent = validation.error;
    }
    editInput.classList.add('is-invalid');
    editInput.setAttribute('aria-invalid', 'true');
    editInput.focus();
    return;
  }

  // Update the Model
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    pushState(); // Save state to history for undo
    task.text = value;
    render(); // optimistic render
    await saveTasks(tasks);
    tasks = await loadTasks();
  }

  // Clear editing state & Persist -> Re-render
  editingTaskId = null;
  render();
};

/**
 * Performs debounced validation check on main task input field.
 */
const handleMainInputValidation = () => {
  clearTimeout(validationDebounceTimer);
  validationDebounceTimer = setTimeout(() => {
    const value = taskInput.value;
    const validation = validateTaskInput(value);
    const isWhitespaceOnly = value.trim().length === 0;

    // Enable/disable submit button
    submitButton.disabled = isWhitespaceOnly || !validation.isValid;

    // Show error only if they typed something invalid, not just because they cleared it
    if (!validation.isValid && !isWhitespaceOnly) {
      formError.textContent = validation.error;
      taskInput.classList.add('is-invalid');
      taskInput.setAttribute('aria-invalid', 'true');
    } else {
      formError.textContent = '';
      taskInput.classList.remove('is-invalid');
      taskInput.setAttribute('aria-invalid', 'false');
    }
  }, 150);
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Cache DOM elements
  taskForm = document.getElementById('task-form');
  taskInput = document.getElementById('task-input');
  submitButton = taskForm.querySelector('button[type="submit"]');
  formError = document.getElementById('form-error');
  taskList = document.getElementById('task-list');
  taskCounter = document.getElementById('task-counter');
  emptyState = document.getElementById('empty-state');
  themeToggle = document.getElementById('theme-toggle');
  filterButtons = document.querySelectorAll('.filter-btn');

  // 1. Load data from localStorage / backend API
  tasks = await loadTasks();
  activeFilter = loadFilter();
  theme = getInitialTheme();

  // 2. Set up initial UI states
  applyTheme(theme);

  // Set active class on the saved filter button
  filterButtons.forEach(btn => {
    if (btn.dataset.filter === activeFilter) {
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Make sure submit starts disabled since input starts empty
  submitButton.disabled = true;

  // 3. Event Listeners

  // Real-time validation debounced on main input
  taskInput.addEventListener('input', handleMainInputValidation);

  // Create Task Form Submit
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawVal = taskInput.value;
    const validation = validateTaskInput(rawVal);

    if (!validation.isValid) {
      formError.textContent = validation.error;
      taskInput.classList.add('is-invalid');
      taskInput.setAttribute('aria-invalid', 'true');
      taskInput.focus();
      return;
    }

    pushState(); // Save history state before mutation

    const newTask = createTask(rawVal);
    tasks.push(newTask);

    // Reset Form Input
    taskInput.value = '';
    formError.textContent = '';
    taskInput.classList.remove('is-invalid');
    taskInput.setAttribute('aria-invalid', 'false');
    submitButton.disabled = true;

    // Render list (optimistic render)
    render();

    await saveTasks(tasks);
    tasks = await loadTasks();
    render();
  });

  // Theme Toggler Click
  themeToggle.addEventListener('click', () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });

  // Theme Media query listener (in case user switches system theme and has no saved manual preference)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!loadTheme()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // Filter Buttons Click
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      saveFilter(activeFilter);

      filterButtons.forEach(b => {
        if (b === btn) {
          b.classList.add('is-active');
          b.setAttribute('aria-pressed', 'true');
        } else {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        }
      });

      // Clear edit state when shifting filters to avoid UX confusion
      editingTaskId = null;
      render();
    });
  });

  // Event Delegation on Task List (Clicks)
  taskList.addEventListener('click', async (e) => {
    const taskEl = e.target.closest('.task');
    if (!taskEl) return;
    const taskId = Number(taskEl.dataset.id);

    // 1. Completion Checkbox Toggle
    if (e.target.classList.contains('task-checkbox')) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        pushState(); // Save history state
        task.completed = e.target.checked;
        render(); // optimistic render
        await saveTasks(tasks);
        tasks = await loadTasks();
        render();
      }
      return;
    }

    // 2. Edit Action
    if (e.target.closest('.edit-btn')) {
      editingTaskId = taskId;
      render();
      return;
    }

    // 3. Delete Action with Confirmation (Technical Checklist Item)
    if (e.target.closest('.delete-btn')) {
      if (confirm('Are you sure you want to delete this task permanently?')) {
        pushState(); // Save history state
        tasks = tasks.filter(t => t.id !== taskId);
        if (editingTaskId === taskId) {
          editingTaskId = null;
        }
        render(); // optimistic render
        await saveTasks(tasks);
        tasks = await loadTasks();
        render();
      }
      return;
    }

    // 4. Save Action (Inside inline edit)
    if (e.target.closest('.save-btn')) {
      await handleSaveInlineEdit(taskEl, taskId);
      return;
    }

    // 5. Cancel Action (Inside inline edit)
    if (e.target.closest('.cancel-btn')) {
      editingTaskId = null;
      render();
      return;
    }
  });

  // Event Delegation on Task List (Keyboard keys during edit)
  taskList.addEventListener('keydown', async (e) => {
    const taskEl = e.target.closest('.task');
    if (!taskEl || !taskEl.classList.contains('is-editing')) return;
    const taskId = Number(taskEl.dataset.id);

    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSaveInlineEdit(taskEl, taskId);
    } else if (e.key === 'Escape') {
      editingTaskId = null;
      render();
    }
  });

  // Global Keyboard Shortcuts (Undo/Redo support - Pro Tips for Excellence)
  document.addEventListener('keydown', async (e) => {
    // Only run if user isn't inside edit text fields (or run universally since Ctrl+Z is nice)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (history.length > 0) {
          const prevState = history.pop();
          redoHistory.push(JSON.stringify(tasks));
          tasks = JSON.parse(prevState);
          render(); // optimistic render
          await saveTasks(tasks);
          tasks = await loadTasks();
          editingTaskId = null;
          render();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (redoHistory.length > 0) {
          const nextState = redoHistory.pop();
          history.push(JSON.stringify(tasks));
          tasks = JSON.parse(nextState);
          render(); // optimistic render
          await saveTasks(tasks);
          tasks = await loadTasks();
          editingTaskId = null;
          render();
        }
      }
    }
  });

  // 4. Perform Initial Render
  render();
});
