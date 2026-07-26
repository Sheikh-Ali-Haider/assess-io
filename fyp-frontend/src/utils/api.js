const BASE_URL = 'http://localhost:8000';

// All API calls go through this function.
// Token is automatically attached to every request from localStorage.
// If the body is FormData, skip Content-Type header (browser sets it automatically).
async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const token = localStorage.getItem('token');

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}


// ── Auth ──────────────────────────────────────────────────────────────────────

// Login with email and password — backend returns the role automatically
export const loginUser = async (email, password) => {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};


// ── Course Endpoints ──────────────────────────────────────────────────────────

// Get all courses in the system
export const getAllCourses = () => apiFetch('/courses');

// Get a single course by its ID
export const getCourse = (id) => apiFetch(`/courses/${id}`);

// Get all courses assigned to a specific teacher
export const getTeacherCourses = (teacherId) =>
  apiFetch(`/courses/teacher/${teacherId}`);

// Get all courses a student is enrolled in
export const getStudentCourses = (studentId) =>
  apiFetch(`/courses/student/${studentId}`);

// Get all weeks for a course, sorted by week number
export const getCourseWeeks = (courseId) =>
  apiFetch(`/courses/${courseId}/weeks`);

// Get a single week by its ID
export const getWeek = (weekId) => apiFetch(`/weeks/${weekId}`);

// Create a new week for a course
// weekData: { number, title, start_date (optional), lessons (array) }
export const createWeek = (courseId, weekData) =>
  apiFetch(`/courses/${courseId}/weeks`, {
    method: 'POST',
    body: JSON.stringify(weekData),
  });

// Delete a week by its ID — also deletes all its materials on the backend
export const deleteWeek = (weekId) =>
  apiFetch(`/weeks/${weekId}`, { method: 'DELETE' });

export const updateWeek = (weekId, payload) =>
  apiFetch(`/weeks/${weekId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// ── Week Materials Endpoints ──────────────────────────────────────────────────

// Get all study materials for a specific week
export const getWeekMaterials = (weekId) =>
  apiFetch(`/weeks/${weekId}/materials`);

// Upload a file as a study material for a week
// formData must contain: type="file", name, file (the actual File object)
export const addWeekMaterialFile = (weekId, formData) =>
  apiFetch(`/weeks/${weekId}/materials`, {
    method: 'POST',
    body: formData,
  });

// Add a YouTube video link as a study material for a week
// formData must contain: type="video", name, url
export const addWeekMaterialVideo = (weekId, formData) =>
  apiFetch(`/weeks/${weekId}/materials`, {
    method: 'POST',
    body: formData,
  });

// Delete a study material by its ID
export const deleteWeekMaterial = (materialId) =>
  apiFetch(`/materials/${materialId}`, { method: 'DELETE' });


// ── Assignment Endpoints ──────────────────────────────────────────────────────

// Get all assignments in the system
export const getAssignments = () => apiFetch('/assignments');

// Get assignments filtered by course, and optionally by week
export const getAssignmentsByCourseAndWeek = (courseId, weekId) => {
  let url = `/assignments?course_id=${courseId}`;
  if (weekId !== undefined && weekId !== null) {
    url += `&week_id=${weekId}`;
  }
  return apiFetch(url);
};

// Get a single assignment by its ID
// Response includes total_marks so UI can display it if needed
export const getAssignment = (id) => apiFetch(`/assignment/${id}`);

// Create a new assignment — multipart form data (supports file upload)
// FormData must include total_marks — used to calculate standardized_score
export const createAssignment = (formData) =>
  apiFetch('/assignment/create', {
    method: 'POST',
    body: formData,
  });

// Update an existing assignment by ID — sends multipart form data
export const updateAssignment = (id, formData) =>
  apiFetch(`/assignment/${id}`, {
    method: 'PUT',
    body: formData,
  });

// Delete an assignment by ID
// Backend will reject if students have already submitted
export const deleteAssignment = (id) =>
  apiFetch(`/assignment/${id}`, { method: 'DELETE' });


// ── Submission Endpoints ──────────────────────────────────────────────────────

// Submit a code assignment — JSON payload
export const submitCode = (payload) =>
  apiFetch('/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Submit a document assignment — multipart form data (file upload)
export const submitDocument = (formData) =>
  apiFetch('/submit/document', {
    method: 'POST',
    body: formData,
  });

// Submit a handwritten assignment — multipart form data (file upload)
export const submitHandwritten = (formData) =>
  apiFetch('/submit/handwritten', {
    method: 'POST',
    body: formData,
  });

// Get the result of a submission by submission ID.
// Response includes standardized_score (X.X out of 10) — use this for display.
// The raw score field is still present but should NOT be shown in the UI.
export const getResult = (id) => apiFetch(`/result/${id}`);

// Get all past submissions for a student.
// Each item includes standardized_score (X.X out of 10) for display.
export const getHistory = (studentId) => apiFetch(`/history/${studentId}`);

// Get all submissions for a teacher's courses
export const getTeacherSubmissions = (teacherId) =>
  apiFetch(`/submissions/teacher/${teacherId}`);

// Poll a submission result every 2 seconds until completed or 60s timeout.
// onUpdate is called each time with the latest result object.
export const pollResult = (submissionId, onUpdate) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const result = await getResult(submissionId);
        onUpdate(result);

        if (result.status === 'completed' || result.status === 'failed') {
          resolve(result);
        } else if (attempts >= 60) {
          reject(new Error('Timeout: result not ready after 120 seconds'));
        } else {
          setTimeout(poll, 2000);
        }
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
};


// ── Admin Endpoints ───────────────────────────────────────────────────────────

// Extract text from uploaded assignment file and auto-fill description
export const extractAssignmentFile = (formData) =>
  apiFetch('/extract-assignment-file', {
    method: 'POST',
    body: formData,
  });
  
// Generate AI test cases for a code assignment
export const generateTestCases = (payload) =>
  apiFetch('/generate-test-cases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
// Get admin dashboard stats
export const getAdminStats = () => apiFetch('/admin/stats');

// Get all users in the system
export const getAllUsers = () => apiFetch('/users');

// Create a new user
export const createUser = (payload) =>
  apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Update an existing user by ID
export const updateUser = (id, payload) =>
  apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

// Delete a user by ID
export const deleteUser = (id) =>
  apiFetch(`/users/${id}`, { method: 'DELETE' });

// Create a new course
export const createCourse = (payload) =>
  apiFetch('/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Update an existing course by ID
export const updateCourse = (id, payload) =>
  apiFetch(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

// Delete a course by ID
export const deleteCourse = (id) =>
  apiFetch(`/courses/${id}`, { method: 'DELETE' });

// Enroll a student in a course
export const createEnrollment = (student_id, course_id) =>
  apiFetch('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ student_id, course_id }),
  });

// Remove a student's enrollment from a course
export const deleteEnrollment = (student_id, course_id) =>
  apiFetch(`/enrollments/${student_id}/${course_id}`, { method: 'DELETE' });

// Get all enrollments for a specific course
export const getCourseEnrollments = (courseId) =>
  apiFetch(`/enrollments/course/${courseId}`);
