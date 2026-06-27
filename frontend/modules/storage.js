/**
 * storage.js
 * Handles all reads/writes to localStorage with JSON parsing safety.
 */

const KEYS = {
  TASKS: 'tasks',
  THEME: 'theme',
  FILTER: 'filter'
};

// Dynamically choose API URL based on host (local vs deployed backend)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api/tasks'
  : 'https://task-3-sundhip.onrender.com/api/tasks'; // Replace with your actual Render URL after deployment

/**
 * Saves tasks list by syncing changes with the backend API.
 * Performs DELETE, PUT, and POST requests depending on differences.
 * @param {Array} newTasks - Array of task objects from local state.
 */
export const saveTasks = async (newTasks) => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const serverTasks = await res.json();

    const serverTaskMap = new Map(serverTasks.map(t => [t.id, t]));
    const newTasksMap = new Map(newTasks.map(t => [t.id, t]));

    // 1. Delete tasks on server that do not exist locally
    for (const serverTask of serverTasks) {
      if (!newTasksMap.has(serverTask.id)) {
        await fetch(`${API_URL}/${serverTask.id}`, {
          method: 'DELETE'
        });
      }
    }

    // 2. Create or update tasks
    for (const newTask of newTasks) {
      if (serverTaskMap.has(newTask.id)) {
        const serverTask = serverTaskMap.get(newTask.id);
        if (serverTask.text !== newTask.text || serverTask.completed !== newTask.completed) {
          await fetch(`${API_URL}/${newTask.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: newTask.text,
              completed: newTask.completed
            })
          });
        }
      } else {
        // Task is new, POST it
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newTask.text,
            completed: newTask.completed
          })
        });
      }
    }
  } catch (error) {
    console.error('Failed to save tasks to backend:', error);
  }
};

/**
 * Loads tasks list from the backend API.
 * @returns {Array} Array of task objects, defaults to empty array on failure.
 */
export const loadTasks = async () => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to load tasks from backend:', error);
    return [];
  }
};


/**
 * Saves theme preference.
 * @param {string} theme - 'light' | 'dark'
 */
export const saveTheme = (theme) => {
  try {
    localStorage.setItem(KEYS.THEME, theme);
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error);
  }
};

/**
 * Loads theme preference.
 * @returns {string|null} The stored theme or null if not set.
 */
export const loadTheme = () => {
  try {
    return localStorage.getItem(KEYS.THEME);
  } catch (error) {
    console.error('Failed to load theme from localStorage:', error);
    return null;
  }
};

/**
 * Saves active filter preference.
 * @param {string} filter - 'all' | 'active' | 'completed'
 */
export const saveFilter = (filter) => {
  try {
    localStorage.setItem(KEYS.FILTER, filter);
  } catch (error) {
    console.error('Failed to save filter to localStorage:', error);
  }
};

/**
 * Loads active filter preference.
 * @returns {string} The stored filter, defaults to 'all'.
 */
export const loadFilter = () => {
  try {
    return localStorage.getItem(KEYS.FILTER) || 'all';
  } catch (error) {
    console.error('Failed to load filter from localStorage, defaulting to "all":', error);
    return 'all';
  }
};
