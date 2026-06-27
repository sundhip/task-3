/**
 * validation.js
 * Performs task input validation based on application rules.
 */

const MAX_LENGTH = 120;

/**
 * Validates the task text input.
 * @param {string} text - The input string to validate.
 * @returns {Object} Validation result { isValid: boolean, error: string }
 */
export const validateTaskInput = (text) => {
  const trimmed = (text || '').trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Task description cannot be empty.'
    };
  }

  if (trimmed.length > MAX_LENGTH) {
    return {
      isValid: false,
      error: `Task description cannot exceed ${MAX_LENGTH} characters (currently ${trimmed.length} characters).`
    };
  }

  return {
    isValid: true,
    error: ''
  };
};
