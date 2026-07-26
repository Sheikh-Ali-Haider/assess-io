import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileText,
  Loader,
  ClipboardCheck,
  Settings,
  Inbox,
} from 'lucide-react';
import { getTeacherCourses, getAssignments } from '../../utils/api';

/**
 * TeacherDashboard Component
 *
 * Shows top metric cards and a clean table of courses.
 * Table layout is used instead of a card grid because it scales
 * better when there are 4+ courses — easier to scan at a glance.
 */
export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const courseData = await getTeacherCourses(user.id);
        setCourses(courseData);
        const assignmentData = await getAssignments();
        setAssignments(assignmentData);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user.id]);

  // Total students across all courses
  const totalStudents = courses.reduce(
    (sum, course) => sum + (course.enrolled_count || 0),
    0
  );

  // Assignments that belong to this teacher's courses
  const myCourseIds = courses.map((c) => c.id);
  const myAssignments = assignments.filter((a) =>
    myCourseIds.includes(a.course_id)
  );
  const totalAssignments = myAssignments.length;

  // Active/open assignments — the most actionable metric for a teacher
  const pendingGradingCount = myAssignments.filter(
    (a) => a.status === 'active' || a.status === 'open'
  ).length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-primary-blue" size={40} />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-red-500 font-semibold">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Page header with compact quick action buttons top-right */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-dark mb-1">
              Welcome back, {user?.name}
            </h2>
            <p className="text-gray-500 text-sm">
              Here's what's happening across your courses today.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/teacher/grading')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold text-sm hover:bg-opacity-90 transition"
            >
              <ClipboardCheck size={16} />
              Grading Queue
            </button>
            <button
              onClick={() => navigate('/teacher/courses')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-text-dark rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
            >
              <BookOpen size={16} />
              My Courses
            </button>
          </div>
        </div>

        {/* Metric cards — left-aligned, actionable labels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
            <div className="p-2 bg-blue-50 rounded-lg w-fit mb-3">
              <BookOpen className="text-primary-blue" size={20} />
            </div>
            <p className="text-2xl font-bold text-text-dark mb-0.5">{courses.length}</p>
            <p className="text-sm text-gray-500">Active Courses</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
            <div className="p-2 bg-green-50 rounded-lg w-fit mb-3">
              <Users className="text-green-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-text-dark mb-0.5">{totalStudents}</p>
            <p className="text-sm text-gray-500">Enrolled Students</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
            <div className="p-2 bg-orange-50 rounded-lg w-fit mb-3">
              <FileText className="text-orange-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-text-dark mb-0.5">{totalAssignments}</p>
            <p className="text-sm text-gray-500">Total Assignments</p>
          </div>

          {/* This card is clickable — takes teacher directly to grading queue */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer"
            onClick={() => navigate('/teacher/grading')}
          >
            <div className="p-2 bg-purple-50 rounded-lg w-fit mb-3">
              <ClipboardCheck className="text-purple-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-text-dark mb-0.5">{pendingGradingCount}</p>
            <p className="text-sm text-gray-500">Needs Grading</p>
          </div>

        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-text-dark">My Courses</h3>
            <span className="text-xs text-gray-400">
              {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BookOpen className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-400 text-sm">No courses assigned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                {/* Column headers */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">
                      Code
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Course Title
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">
                      Semester
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">
                      Students
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-32">
                      Assignments
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-24">
                      Credits
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-48">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {courses.map((course) => {
                    const courseAssignmentCount = assignments.filter(
                      (a) => a.course_id === course.id
                    ).length;

                    return (
                      <tr
                        key={course.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Course code shown as a small blue badge */}
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-primary-blue text-xs font-bold rounded-md">
                            {course.code}
                          </span>
                        </td>

                        {/* Title and a one-line description underneath */}
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text-dark leading-snug">
                            {course.title}
                          </p>
                          {course.description && (
                            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-gray-500">
                          {course.semester ?? '—'}
                        </td>

                        <td className="px-6 py-4 text-center font-semibold text-text-dark">
                          {course.enrolled_count ?? 0}
                        </td>

                        <td className="px-6 py-4 text-center font-semibold text-text-dark">
                          {courseAssignmentCount}
                        </td>

                        <td className="px-6 py-4 text-center text-gray-500">
                          {course.credit_hours ?? '—'}
                        </td>

                        {/* Two compact action buttons per row */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                navigate(`/teacher/course/${course.id}/manage`)
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-blue text-white rounded-lg text-xs font-semibold hover:bg-opacity-90 transition"
                            >
                              <Settings size={13} />
                              Manage
                            </button>
                            <button
                              onClick={() => navigate('/teacher/grading')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                            >
                              <Inbox size={13} />
                              Submissions
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
}
