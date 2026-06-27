import { z } from 'zod';

// In-memory store (temporary)
let tasks = [];
let currentId = 1;

// Zod validation schema
const taskSchema = z.object({
  text: z.string().min(3, 'Task text must be at least 3 characters').max(255, 'Task text must be at most 255 characters'),
  completed: z.boolean().optional()
});

// Utility function to find task index
const findTaskIndex = id => tasks.findIndex(task => task.id === id);

// Get all tasks
export const getTasks = (req, res) => {
  res.status(200).json(tasks);
};

// Get single task
export const getTask = (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(200).json(task);
};

// Create new task
export const createTask = (req, res) => {
  const { text } = req.body;

  // Validation
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Task text is required' });
  }

  // Zod Validation
  const validationResult = taskSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(err => err.message).join(', ');
    return res.status(400).json({ error: errorMsg });
  }

  // Create new task
  const newTask = {
    id: currentId++,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
};

// Update existing task
export const updateTask = (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = findTaskIndex(id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Zod validation (partial schema for updates)
  const validationResult = taskSchema.partial().safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(err => err.message).join(', ');
    return res.status(400).json({ error: errorMsg });
  }

  const { text, completed } = req.body;

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    text: text !== undefined ? text.trim() : tasks[taskIndex].text,
    completed: completed !== undefined ? completed : tasks[taskIndex].completed
  };

  res.status(200).json(tasks[taskIndex]);
};

// Delete task
export const deleteTask = (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = tasks.length;
  tasks = tasks.filter(task => task.id !== id);

  if (tasks.length === initialLength) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.status(204).end();
};
