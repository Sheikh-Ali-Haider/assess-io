/**
 * File Validation Utility
 * 
 * Provides validation rules for different assignment types
 * and helper functions to validate uploaded files
 */

// Define allowed file extensions per assignment type
const FILE_VALIDATION_RULES = {
  code: {
    extensions: ['.py', '.cpp', '.java', '.js', '.ts', '.c', '.h'],
    mimeTypes: ['text/plain', 'text/x-python', 'text/x-c++src'],
    maxSizeMB: 10,
    description: 'Python, C++, Java, JavaScript files',
  },
  typed: {
    extensions: ['.pdf', '.docx', '.doc', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    maxSizeMB: 5,
    description: 'PDF or Word documents',
  },
  handwritten: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxSizeMB: 15,
    description: 'Image files or scanned PDFs',
  },
};

/**
 * Get validation rules for a specific assignment type
 * @param {string} assignmentType - Type of assignment ('code', 'typed', 'handwritten')
 * @returns {object} Validation rules for that type
 */
export const getValidationRules = (assignmentType) => {
  return FILE_VALIDATION_RULES[assignmentType] || FILE_VALIDATION_RULES.code;
};

/**
 * Validate a file against assignment type rules
 * @param {File} file - The file to validate
 * @param {string} assignmentType - Type of assignment
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateFile = (file, assignmentType) => {
  const rules = getValidationRules(assignmentType);

  // Check file extension
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf(''));
  const hasValidExtension = rules.extensions.some((ext) =>
    fileName.endsWith(ext.toLowerCase())
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed: ${rules.extensions.join(', ')}`,
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > rules.maxSizeMB) {
    return {
      isValid: false,
      error: `File is too large. Maximum size: ${rules.maxSizeMB}MB`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate multiple files
 * @param {File[]} files - Array of files to validate
 * @param {string} assignmentType - Type of assignment
 * @returns {object} { allValid: boolean, errors: string[] }
 */
export const validateFiles = (files, assignmentType) => {
  const errors = [];

  files.forEach((file, index) => {
    const validation = validateFile(file, assignmentType);
    if (!validation.isValid) {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    allValid: errors.length === 0,
    errors,
  };
};
