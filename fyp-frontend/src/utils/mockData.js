/**
 * Smart Mock Data - Simulates a Relational Database
 * 
 * Architecture:
 * - users: All users with roles (admin, teacher, student)
 * - courses: Course details with assignedTeacherId
 * - enrollments: Student-Course mappings
 * - weeks: Course weeks with lessons
 * - assignments: Assignments linked to weeks and courses
 * - submissions: Student submissions with grades
 * 
 * This allows role-based filtering:
 * - Teachers see only their assigned courses
 * - Students see only courses they're enrolled in
 * - Admins see everything
 */

// ==================== USERS ====================
export const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@university.edu',
    role: 'admin',
    password: 'admin123',
    department: 'Administration',
  },
  {
    id: 2,
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@university.edu',
    role: 'teacher',
    password: 'teacher123',
    department: 'Computer Science',
    specialization: 'Digital Image Processing',
  },
  {
    id: 3,
    name: 'Prof. Michael Kumar',
    email: 'michael.kumar@university.edu',
    role: 'teacher',
    password: 'teacher123',
    department: 'Computer Science',
    specialization: 'Parallel Computing',
  },
  {
    id: 4,
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@university.edu',
    role: 'teacher',
    password: 'teacher123',
    department: 'Computer Science',
    specialization: 'Web Technologies',
  },
  {
    id: 5,
    name: 'John Doe',
    email: 'john.doe@university.edu',
    role: 'student',
    password: 'student123',
    matricNumber: 'STU001',
  },
  {
    id: 6,
    name: 'Alice Johnson',
    email: 'alice.johnson@university.edu',
    role: 'student',
    password: 'student123',
    matricNumber: 'STU002',
  },
  {
    id: 7,
    name: 'Bob Smith',
    email: 'bob.smith@university.edu',
    role: 'student',
    password: 'student123',
    matricNumber: 'STU003',
  },
  {
    id: 8,
    name: 'Carol White',
    email: 'carol.white@university.edu',
    role: 'student',
    password: 'student123',
    matricNumber: 'STU004',
  },
  {
    id: 9,
    name: 'David Lee',
    email: 'david.lee@university.edu',
    role: 'student',
    password: 'student123',
    matricNumber: 'STU005',
  },
  {
    id: 10,
    name: 'Emma Davis',
    email: 'emma.davis@university.edu',
    role: 'student',
    password: 'student123',
    matricNumber: 'STU006',
  },
];

// ==================== COURSES ====================
export const courses = [
  {
    id: 1,
    code: 'CS406',
    title: 'Digital Image Processing',
    description: 'Fundamentals of digital image processing techniques and applications',
    assignedTeacherId: 2,
    creditHours: 3,
    semester: 'Spring 2026',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop',
    capacity: 30,
  },
  {
    id: 2,
    code: 'CS502',
    title: 'Parallel & Distributed Computing',
    description: 'Advanced concepts in parallel and distributed systems',
    assignedTeacherId: 3,
    creditHours: 4,
    semester: 'Spring 2026',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
    capacity: 25,
  },
  {
    id: 3,
    code: 'CS301',
    title: 'Web Technologies',
    description: 'Modern web development frameworks and best practices',
    assignedTeacherId: 4,
    creditHours: 3,
    semester: 'Spring 2026',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
    capacity: 35,
  },
  {
    id: 4,
    code: 'CS401',
    title: 'Machine Learning',
    description: 'Introduction to machine learning algorithms and applications',
    assignedTeacherId: 2,
    creditHours: 3,
    semester: 'Spring 2026',
    image: 'https://images.unsplash.com/photo-1555949519-2c4d932ad5a8?w=400&h=250&fit=crop',
    capacity: 28,
  },
];

// ==================== ENROLLMENTS ====================
export const enrollments = [
  { studentId: 5, courseId: 1 },
  { studentId: 5, courseId: 2 },
  { studentId: 5, courseId: 3 },
  { studentId: 6, courseId: 1 },
  { studentId: 6, courseId: 4 },
  { studentId: 7, courseId: 2 },
  { studentId: 7, courseId: 3 },
  { studentId: 8, courseId: 1 },
  { studentId: 8, courseId: 3 },
  { studentId: 9, courseId: 4 },
  { studentId: 10, courseId: 2 },
  { studentId: 10, courseId: 4 },
];

// ==================== WEEKS ====================
export const weeks = [
  // CS406 Weeks
  { id: 101, courseId: 1, number: 1, title: 'Introduction to Digital Images', startDate: '2026-01-13', lessons: ['Image Basics', 'Pixel Representation', 'Color Models'] },
  { id: 102, courseId: 1, number: 2, title: 'Image Enhancement', startDate: '2026-01-20', lessons: ['Histogram Equalization', 'Contrast Stretching'] },
  { id: 103, courseId: 1, number: 3, title: 'Filtering & Convolution', startDate: '2026-01-27', lessons: ['Spatial Filtering', 'Frequency Domain', 'Convolution Basics'] },
  { id: 104, courseId: 1, number: 4, title: 'Edge Detection', startDate: '2026-02-03', lessons: ['Sobel Operator', 'Canny Edge Detection'] },
  { id: 105, courseId: 1, number: 5, title: 'Face Detection & Recognition', startDate: '2026-02-10', lessons: ['Haar Cascades', 'CNN Basics', 'Face Detection Methods'] },
  // CS502 Weeks
  { id: 201, courseId: 2, number: 1, title: 'Fundamentals of Parallelism', startDate: '2026-01-13', lessons: ['Types of Parallelism', 'Amdahls Law', 'Speedup'] },
  { id: 202, courseId: 2, number: 2, title: 'Shared Memory Systems', startDate: '2026-01-20', lessons: ['Multi-threading', 'Synchronization', 'Mutexes'] },
  { id: 203, courseId: 2, number: 3, title: 'Distributed Memory Systems', startDate: '2026-01-27', lessons: ['Message Passing', 'MPI Basics', 'Communication Patterns'] },
  // CS301 Weeks
  { id: 301, courseId: 3, number: 1, title: 'Web Fundamentals', startDate: '2026-01-13', lessons: ['HTML5', 'CSS3', 'JavaScript Basics'] },
  { id: 302, courseId: 3, number: 2, title: 'Frontend Frameworks', startDate: '2026-01-20', lessons: ['React Introduction', 'JSX', 'Components'] },
  { id: 303, courseId: 3, number: 3, title: 'Advanced React', startDate: '2026-01-27', lessons: ['Hooks', 'State Management', 'API Integration'] },
  // CS401 Weeks
  { id: 401, courseId: 4, number: 1, title: 'ML Basics', startDate: '2026-01-13', lessons: ['Introduction', 'Supervised Learning', 'Unsupervised Learning'] },
  { id: 402, courseId: 4, number: 2, title: 'Regression', startDate: '2026-01-20', lessons: ['Linear Regression', 'Polynomial Regression', 'Regularization'] },
  { id: 403, courseId: 4, number: 3, title: 'Classification', startDate: '2026-01-27', lessons: ['Decision Trees', 'Random Forests', 'SVM'] },
];

// ==================== ASSIGNMENTS ====================
export const assignments = [
  { id: 501, courseId: 1, weekId: 105, title: 'Face Detection Project', type: 'code', dueDate: '2026-02-2', description: 'Implement a face detection algorithm using Python', rubricId: 1 },
  { id: 502, courseId: 2, weekId: 203, title: 'MPI Programming Assignment', type: 'code', dueDate: '2026-02-05', description: 'Write a distributed program using MPI', rubricId: 2 },
  { id: 503, courseId: 3, weekId: 303, title: 'React Todo Application', type: 'code', dueDate: '2026-02-08', description: 'Build a feature-rich todo application with React', rubricId: 3 },
  { id: 505, courseId: 4, weekId: 403, title: 'Neural Network Implementation', type: 'code', dueDate: '2026-02-15', description: 'Implement a neural network from scratch', rubricId: 4 },
];

// ==================== SUBMISSIONS ====================
export const submissions = [
  { id: 1, assignmentId: 501, studentId: 5, fileName: 'face_detection.py', submittedDate: '2026-02-18', status: 'pending', grade: null, feedback: null },
  { id: 2, assignmentId: 501, studentId: 6, fileName: 'face_detection_v2.py', submittedDate: '2026-02-15', status: 'graded', grade: 92, feedback: 'Excellent implementation with good optimization.' },
  { id: 3, assignmentId: 503, studentId: 5, fileName: 'todo_app.zip', submittedDate: '2026-02-07', status: 'graded', grade: 87, feedback: 'Good work on the UI. Try adding local storage.' },
];

// ==================== HELPER FUNCTIONS ====================

export const getUserById = (userId) => {
  return users.find((u) => u.id === parseInt(userId));
};

export const getUserByEmailAndRole = (email, role) => {
  return users.find((u) => u.email === email && u.role === role);
};

export const getCoursesByTeacherId = (teacherId) => {
  return courses.filter((c) => c.assignedTeacherId === parseInt(teacherId));
};

export const getCoursesByStudentId = (studentId) => {
  const enrolledCourseIds = enrollments.filter((e) => e.studentId === parseInt(studentId)).map((e) => e.courseId);
  return courses.filter((c) => enrolledCourseIds.includes(c.id));
};

export const getCourseById = (courseId) => {
  return courses.find((c) => c.id === parseInt(courseId));
};

export const getWeeksByCourseId = (courseId) => {
  return weeks.filter((w) => w.courseId === parseInt(courseId));
};

export const getWeekById = (weekId) => {
  return weeks.find((w) => w.id === parseInt(weekId));
};

export const getAssignmentsByCourseId = (courseId) => {
  return assignments.filter((a) => a.courseId === parseInt(courseId));
};

export const getAssignmentById = (assignmentId) => {
  return assignments.find((a) => a.id === parseInt(assignmentId));
};

export const getSubmissionsByAssignmentId = (assignmentId) => {
  return submissions.filter((s) => s.assignmentId === parseInt(assignmentId));
};

export const getSubmissionByStudentAndAssignment = (studentId, assignmentId) => {
  return submissions.find((s) => s.studentId === parseInt(studentId) && s.assignmentId === parseInt(assignmentId));
};

export const getStudentsByCourseId = (courseId) => {
  const studentIds = enrollments.filter((e) => e.courseId === parseInt(courseId)).map((e) => e.studentId);
  return users.filter((u) => u.role === 'student' && studentIds.includes(u.id));
};

export const getTeacherById = (teacherId) => {
  const user = getUserById(teacherId);
  return user && user.role === 'teacher' ? user : null;
};

export const getAllTeachers = () => {
  return users.filter((u) => u.role === 'teacher');
};

export const getAllStudents = () => {
  return users.filter((u) => u.role === 'student');
};

export const getAllCourses = () => {
  return courses;
};

export const addUser = (userData) => {
    console.log("Adding user:", userData);
  const newId = Math.max(...users.map((u) => u.id), 0) + 1;
  const newUser = { id: newId, ...userData };
  users.push(newUser);
  return newUser;
};

export const addCourse = (courseData) => {
  const newId = Math.max(...courses.map((c) => c.id), 0) + 1;
  const newCourse = { id: newId, ...courseData };
  courses.push(newCourse);
  return newCourse;
};

export const enrollStudent = (studentId, courseId) => {
  const exists = enrollments.find((e) => e.studentId === studentId && e.courseId === courseId);
  if (!exists) {
    enrollments.push({ studentId, courseId });
  }
  return true;
};

//  MISSING FUNCTION 
export const getAssignmentsByWeekId = (weekId) => {
  return assignments.filter((a) => a.weekId === parseInt(weekId));
};