import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../layout/MainLayout';
import { Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Users, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightRow } from 'lucide-react';
import {
  getAllCourses,
  getAllUsers,
  createCourse,
  updateCourse,
  deleteCourse,
  createEnrollment,
  deleteEnrollment,
  getCourseEnrollments,
} from "../../utils/api";

// How many courses to show per page
const COURSES_PER_PAGE = 10;

export default function CourseManagement() {
  const [courseList, setCourseList]               = useState([]);
  const [teachers, setTeachers]                   = useState([]);
  const [students, setStudents]                   = useState([]);
  const [isAddModalOpen, setIsAddModalOpen]       = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse]         = useState(null);
  const [selectedCourse, setSelectedCourse]       = useState(null);
  const [enrolledStudents, setEnrolledStudents]   = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [successMessage, setSuccessMessage]       = useState('');
  const [errors, setErrors]                       = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Search, filter, pagination state
  const [searchQuery, setSearchQuery]         = useState('');
  const [filterSemester, setFilterSemester]   = useState('all');
  const [filterTeacher, setFilterTeacher]     = useState('all');
  const [currentPage, setCurrentPage]         = useState(1);

  // Which row is expanded to show description
  const [expandedRow, setExpandedRow] = useState(null);

  const [formData, setFormData] = useState({
    code:                '',
    title:               '',
    description:         '',
    assigned_teacher_id: '',
    semester:            'Spring 2026',
    credit_hours:        '3',
    capacity:            '30',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSemester, filterTeacher]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesData, usersData] = await Promise.all([
        getAllCourses(),
        getAllUsers(),
      ]);
      setCourseList(coursesData);
      setTeachers(usersData.filter((u) => u.role === 'teacher'));
      setStudents(usersData.filter((u) => u.role === 'student'));
    } catch (err) {
      setErrors(['Failed to load data']);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
  };

  const validateForm = () => {
    const newErrors = [];
    if (!formData.code.trim())        newErrors.push('Course code is required');
    if (!formData.title.trim())       newErrors.push('Course name is required');
    if (!formData.assigned_teacher_id) newErrors.push('Teacher assignment is required');
    if (!formData.description.trim()) newErrors.push('Course description is required');
    if (isNaN(formData.credit_hours) || parseInt(formData.credit_hours) <= 0) {
      newErrors.push('Credits must be a positive number');
    }
    return newErrors;
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      code:                formData.code,
      title:               formData.title,
      description:         formData.description,
      assigned_teacher_id: parseInt(formData.assigned_teacher_id),
      semester:            formData.semester,
      credit_hours:        parseInt(formData.credit_hours),
      capacity:            parseInt(formData.capacity),
    };

    try {
      if (editingCourse) {
        const updated = await updateCourse(editingCourse.id, payload);
        setCourseList(courseList.map((c) => c.id === editingCourse.id ? updated : c));
        setSuccessMessage('Course updated successfully!');
      } else {
        const newCourse = await createCourse(payload);
        setCourseList([...courseList, newCourse]);
        setSuccessMessage('Course created successfully!');
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrors([err.message || 'Something went wrong']);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      code:                course.code,
      title:               course.title,
      description:         course.description || '',
      assigned_teacher_id: course.assigned_teacher_id?.toString() || '',
      semester:            course.semester || 'Spring 2026',
      credit_hours:        course.credit_hours?.toString() || '3',
      capacity:            course.capacity?.toString() || '30',
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(courseId);
        setCourseList(courseList.filter((c) => c.id !== courseId));
        setSuccessMessage('Course deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setErrors([err.message || 'Failed to delete course']);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code:                '',
      title:               '',
      description:         '',
      assigned_teacher_id: '',
      semester:            'Spring 2026',
      credit_hours:        '3',
      capacity:            '30',
    });
    setEditingCourse(null);
    setIsAddModalOpen(false);
    setErrors([]);
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  // Open the manage students modal and load enrollments
  const handleManageStudents = (course) => {
    setSelectedCourse(course);
    setSelectedStudentId('');
    setErrors([]);
    fetchEnrolledStudents(course.id);
    setIsStudentsModalOpen(true);
  };

  const fetchEnrolledStudents = async (courseId) => {
    try {
      setEnrollmentLoading(true);
      const data = await getCourseEnrollments(courseId);
      setEnrolledStudents(data);
    } catch (err) {
      console.error('Enrollment fetch error:', err);
      setEnrolledStudents([]);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) {
      setErrors(['Please select a student to enroll']);
      return;
    }
    const alreadyEnrolled = enrolledStudents.find(
      (s) => s.student_id === parseInt(selectedStudentId)
    );
    if (alreadyEnrolled) {
      setErrors(['Student is already enrolled in this course']);
      return;
    }
    try {
      await createEnrollment(parseInt(selectedStudentId), selectedCourse.id);
      await fetchEnrolledStudents(selectedCourse.id);
      setSelectedStudentId('');
      setErrors([]);
      setSuccessMessage('Student enrolled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrors([err.message || 'Failed to enroll student']);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (window.confirm('Remove this student from the course?')) {
      try {
        await deleteEnrollment(studentId, selectedCourse.id);
        await fetchEnrolledStudents(selectedCourse.id);
        setSuccessMessage('Student removed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setErrors([err.message || 'Failed to remove student']);
      }
    }
  };

  const unenrolledStudents = students.filter(
    (s) => !enrolledStudents.find((e) => e.student_id === s.id)
  );

  // Build unique semester options for the filter dropdown
  const semesterOptions = ['all', ...Array.from(new Set(courseList.map((c) => c.semester).filter(Boolean)))];

  // Apply search + semester filter + teacher filter
  const filteredCourses = courseList
    .filter((c) => filterSemester === 'all' || c.semester === filterSemester)
    .filter((c) => filterTeacher === 'all' || c.assigned_teacher_id?.toString() === filterTeacher)
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        getTeacherName(c.assigned_teacher_id).toLowerCase().includes(q)
      );
    });

  // Pagination calculations
  const totalPages  = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const startIndex  = (currentPage - 1) * COURSES_PER_PAGE;
  const pagedCourses = filteredCourses.slice(startIndex, startIndex + COURSES_PER_PAGE);

  // Toggle the expandable description row
  const toggleRow = (courseId) => {
    setExpandedRow(expandedRow === courseId ? null : courseId);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-gray-500">Loading courses...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Course Management</h2>
            <p className="text-sm text-gray-500">Create, edit, manage courses and student enrollments</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition font-semibold text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            Create Course
          </button>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="font-semibold text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Page-level error messages (not inside any modal) */}
        {errors.length > 0 && !isAddModalOpen && !isStudentsModalOpen && (
          <div className="mb-6 space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="p-3 bg-red-100 border border-red-400 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search bar + filter dropdowns row */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">

          {/* Search by code, title, or teacher */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, title, or teacher..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue bg-white"
            />
          </div>

          {/* Filter by semester */}
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue bg-white text-gray-700"
          >
            <option value="all">All Semesters</option>
            {semesterOptions.filter((s) => s !== 'all').map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>

          {/* Filter by teacher */}
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue bg-white text-gray-700"
          >
            <option value="all">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id.toString()}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Courses table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredCourses.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500 text-sm">No courses found. Create one to get started!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {/* Empty header for the expand arrow column */}
                      <th className="px-3 py-3 w-8"></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teacher</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Semester</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Credits</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedCourses.map((course) => (
                      <React.Fragment key={course.id}>

                        {/* Main course row */}
                        <tr className="hover:bg-gray-50 transition">

                          {/* Expand arrow — click to show description below */}
                          <td className="px-3 py-3">
                            <button
                              onClick={() => toggleRow(course.id)}
                              className="text-gray-400 hover:text-gray-600 transition"
                              title="Show description"
                            >
                              {expandedRow === course.id
                                ? <ChevronDown size={15} />
                                : <ChevronRightRow size={15} />
                              }
                            </button>
                          </td>

                          {/* Code - left aligned */}
                          <td className="px-4 py-3 text-left">
                            <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{course.code}</p>
                          </td>

                          {/* Title only - no description here */}
                          <td className="px-4 py-3 text-left">
                            <p className="text-sm font-medium text-gray-900">{course.title}</p>
                          </td>

                          {/* Teacher name - left aligned, no wrapping */}
                          <td className="px-4 py-3 text-left">
                            <p className="text-sm text-gray-600 whitespace-nowrap">
                              {getTeacherName(course.assigned_teacher_id)}
                            </p>
                          </td>

                          {/* Semester badge - whitespace-nowrap keeps "Spring 2026" on one line */}
                          <td className="px-4 py-3 text-left">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold whitespace-nowrap">
                              {course.semester}
                            </span>
                          </td>

                          {/* Credits - left aligned */}
                          <td className="px-4 py-3 text-left">
                            <p className="text-sm font-semibold text-gray-900">{course.credit_hours}</p>
                          </td>

                          {/* Action buttons - ghost style, color on hover */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleManageStudents(course)}
                                className="p-2 text-gray-400 rounded-lg hover:bg-green-50 hover:text-green-600 transition"
                                title="Manage Students"
                              >
                                <Users size={15} />
                              </button>
                              <button
                                onClick={() => handleEditCourse(course)}
                                className="p-2 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="p-2 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable description row - only visible when arrow is clicked */}
                        {expandedRow === course.id && (
                          <tr className="bg-blue-50">
                            <td colSpan={7} className="px-8 py-3">
                              <p className="text-sm text-gray-600 leading-relaxed">
                                <span className="font-semibold text-gray-700">Description: </span>
                                {course.description || 'No description provided.'}
                              </p>
                            </td>
                          </tr>
                        )}

                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">

                {/* Entry count */}
                <p className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-700">{startIndex + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium text-gray-700">
                    {Math.min(startIndex + COURSES_PER_PAGE, filteredCourses.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium text-gray-700">{filteredCourses.length}</span>
                  {' '}entries
                </p>

                {/* Previous / page numbers / Next */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition ${
                          currentPage === page
                            ? 'bg-primary-blue text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Manage Students modal - no functionality changed */}
        {isStudentsModalOpen && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Manage Students</h3>
                  <p className="text-sm text-gray-500">{selectedCourse.code} — {selectedCourse.title}</p>
                </div>
                <button
                  onClick={() => { setIsStudentsModalOpen(false); setErrors([]); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 space-y-6">

                {/* Error messages inside the modal */}
                {errors.length > 0 && (
                  <div className="space-y-2">
                    {errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-100 border border-red-400 rounded-lg flex items-start gap-2">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enroll a new student */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Enroll New Student</h4>
                  <div className="flex gap-3">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => { setSelectedStudentId(e.target.value); setErrors([]); }}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    >
                      <option value="">Select a student</option>
                      {unenrolledStudents.map((student) => (
                        <option key={student.id} value={student.id.toString()}>
                          {student.name} — {student.matric_number || 'N/A'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleEnrollStudent}
                      className="px-5 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                    >
                      Enroll
                    </button>
                  </div>
                  {unenrolledStudents.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">All students are already enrolled in this course.</p>
                  )}
                </div>

                {/* List of enrolled students */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    Enrolled Students ({enrolledStudents.length})
                  </h4>
                  {enrollmentLoading ? (
                    <p className="text-sm text-gray-500">Loading students...</p>
                  ) : enrolledStudents.length === 0 ? (
                    <p className="text-sm text-gray-500">No students enrolled yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {enrolledStudents.map((enrollment) => (
                        <div
                          key={enrollment.student_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{enrollment.student_name}</p>
                            <p className="text-xs text-gray-500">{enrollment.matric_number || 'N/A'}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(enrollment.student_id)}
                            className="p-2 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
                            title="Remove from course"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Course modal - no functionality changed */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
                {errors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-100 border border-red-400 rounded-lg flex items-start gap-2">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Course Code *</label>
                  <input
                    type="text" name="code" value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    placeholder="e.g., CS406"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Course Title *</label>
                  <input
                    type="text" name="title" value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    placeholder="e.g., Advanced Web Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Description *</label>
                  <textarea
                    name="description" value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    placeholder="Brief course description..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Assigned Teacher *</label>
                  <select
                    name="assigned_teacher_id" value={formData.assigned_teacher_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id.toString()}>
                        {teacher.name} — {teacher.department || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Semester *</label>
                  <input
                    type="text" name="semester" value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    placeholder="e.g., Spring 2026"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Credit Hours *</label>
                    <input
                      type="number" name="credit_hours" value={formData.credit_hours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                      min="1" max="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Capacity</label>
                    <input
                      type="number" name="capacity" value={formData.capacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                  >
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                  <button
                    type="button" onClick={resetForm}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
