import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Loader2, AlertCircle, X, Cpu } from 'lucide-react';
import { getTeacherCourses, getCourseEnrollments } from '../../utils/api';


// Modal that shows the list of students enrolled in a course
function EnrolledStudentsModal({ course, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    getCourseEnrollments(course.id)
      .then(setStudents)
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  }, [course.id]);

  return (
    // Full-screen dark overlay behind the modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Modal header — course name and close button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-primary-blue" size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Enrolled students</h3>
              <p className="text-xs text-gray-500 mt-0.5">{course.code} — {course.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal body — scrollable student list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-primary-blue" size={28} />
              <p className="text-gray-500 text-sm font-medium">Loading students...</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Empty state when no students are enrolled */}
          {!loading && !error && students.length === 0 && (
            <div className="text-center py-16">
              <Users className="mx-auto text-gray-200 mb-3" size={48} />
              <p className="text-gray-500 font-medium">No students enrolled yet.</p>
            </div>
          )}

          {/* Student list table */}
          {!loading && !error && students.length > 0 && (
            <div>
              {/* Total enrolled count */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold rounded-lg">
                  {students.length} student{students.length !== 1 ? 's' : ''} enrolled
                </span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Table column headers */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <p className="col-span-1 text-xs font-bold text-gray-500 uppercase">#</p>
                  <p className="col-span-7 text-xs font-bold text-gray-500 uppercase">Student name</p>
                  <p className="col-span-4 text-xs font-bold text-gray-500 uppercase">Student ID</p>
                </div>

                {/* One row per student */}
                {students.map((student, idx) => (
                  <div
                    key={student.student_id}
                    className={`grid grid-cols-12 items-center px-4 py-3.5 border-b border-gray-100 last:border-b-0 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="col-span-1">
                      <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                    </div>
                    <div className="col-span-7 flex items-center gap-2.5">
                      {/* Avatar circle with first letter of student name */}
                      <div className="w-8 h-8 bg-primary-blue text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {student.student_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-semibold text-text-dark truncate">
                        {student.student_name || 'Unknown'}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <span className="text-sm text-gray-700 font-mono">
                        {student.matric_number || '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer — close button */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


// Main page — shows all courses assigned to the logged-in teacher
export default function TeacherCourses() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [courses, setCourses]               = useState([]);
  const [enrolledCounts, setEnrolledCounts] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  useEffect(() => {
    getTeacherCourses(user.id)
      .then(async (data) => {
        setCourses(data);

        // Fetch enrolled student count for every course at the same time
        const counts = {};
        await Promise.all(
          data.map(async (course) => {
            try {
              const students = await getCourseEnrollments(course.id);
              counts[course.id] = students.length;
            } catch {
              counts[course.id] = 0;
            }
          })
        );
        setEnrolledCounts(counts);
      })
      .catch(() => setError('Failed to load courses. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [user.id]);

  // Show spinner while courses are loading
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <Loader2 className="animate-spin text-primary-blue" size={48} />
          <p className="text-gray-600 font-medium">Loading your courses...</p>
        </div>
      </MainLayout>
    );
  }

  // Show error state if the API call failed
  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <AlertCircle className="text-red-500" size={48} />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Outer padding — tighter on mobile, more spacious on desktop */}
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Page heading */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-1 sm:mb-2">My courses</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Select a course to manage its weeks and assignments.
          </p>
        </div>

        {/* Empty state when no courses are assigned to this teacher */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">No courses assigned yet.</p>
          </div>
        ) : (
          <>
            {/* =============================================
                DESKTOP TABLE — visible on md screens and up
                ============================================= */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Column headers */}
              <div className="grid grid-cols-12 items-center px-6 py-3 bg-gray-50 border-b border-gray-200">
                <p className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Course</p>
                <p className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Students</p>
                <p className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wide">Credit hrs</p>
                <p className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wide">AI review</p>
                <p className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</p>
              </div>

              {/* One row per course */}
              {courses.map((course) => {
                const count = enrolledCounts[course.id] ?? 0;

                return (
                  <div
                    key={course.id}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                  >
                    {/* Course code badge + title + semester */}
                    <div className="col-span-4 flex flex-col items-start">
                      <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1">
                        {course.code}
                      </span>
                      <p className="text-sm font-semibold text-text-dark leading-snug">
                        {course.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{course.semester}</p>
                    </div>

                    {/* Enrolled student count */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-700">
                        <span className="font-semibold text-text-dark">{count}</span>{' '}
                        student{count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Credit hours */}
                    <div className="col-span-1">
                      <span className="text-sm text-gray-600">{course.credit_hours} hrs</span>
                    </div>

                    {/* AI review status badge */}
                    <div className="col-span-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                        <Cpu size={11} />
                        Pending AI review
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="px-3 py-1.5 text-xs font-semibold text-primary-blue border border-primary-blue rounded-lg hover:bg-blue-50 transition whitespace-nowrap"
                      >
                        View students
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/course/${course.id}/manage`)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition whitespace-nowrap"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =============================================
                MOBILE CARDS — visible below md screens only
                Each course becomes a stacked card
                ============================================= */}
            <div className="block md:hidden space-y-3">
              {courses.map((course) => {
                const count = enrolledCounts[course.id] ?? 0;

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    {/* Top row — course code badge on left, AI status badge on right */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {course.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                        <Cpu size={10} />
                        Pending AI review
                      </span>
                    </div>

                    {/* Course title */}
                    <p className="text-base font-semibold text-text-dark leading-snug mb-2">
                      {course.title}
                    </p>

                    {/* Meta info — semester, student count, credit hours in one line */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
                      <span>{course.semester}</span>
                      <span className="text-gray-300">•</span>
                      <span>{count} student{count !== 1 ? 's' : ''}</span>
                      <span className="text-gray-300">•</span>
                      <span>{course.credit_hours} hrs</span>
                    </div>

                    {/* Action buttons — each takes 50% width for easy thumb tapping */}
                    {/* Minimum height 48px so touch targets are comfortable */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex-1 min-h-[48px] text-sm font-semibold text-primary-blue border border-primary-blue rounded-lg hover:bg-blue-50 transition"
                      >
                        View students
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/course/${course.id}/manage`)}
                        className="flex-1 min-h-[48px] text-sm font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Enrolled students modal — opens when View students is clicked */}
        {selectedCourse && (
          <EnrolledStudentsModal
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
          />
        )}

      </div>
    </MainLayout>
  );
}
