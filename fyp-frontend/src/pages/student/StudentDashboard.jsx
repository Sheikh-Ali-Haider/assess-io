import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, TrendingUp, ClipboardList,
  AlertCircle, Loader2, ArrowRight, Cpu, CheckCircle2
} from 'lucide-react';
import { getStudentCourses } from '../../utils/api';

export default function StudentDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Backend now returns pending_count and grading_status per course
        const courseData = await getStudentCourses(user.id);
        setCourses(courseData);
      } catch {
        setError('Failed to load courses. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  // Loading state
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

  // Error state
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

  // Summary numbers for the top metric cards
  const totalWeeks       = courses.reduce((sum, c) => sum + (c.week_count       ?? 0), 0);
  const totalAssignments = courses.reduce((sum, c) => sum + (c.assignment_count  ?? 0), 0);
  const totalPending     = courses.reduce((sum, c) => sum + (c.pending_count     ?? 0), 0);

  // Renders the correct status badge based on what backend returns
  const StatusBadge = ({ course }) => {
    if (course.grading_status === 'processing') {
      // AI is still grading one or more submissions in this course
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
          <Cpu size={11} />
          Grading in progress
        </span>
      );
    }
    // All submissions graded, nothing pending from AI side
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-100">
        <CheckCircle2 size={11} />
        Up to date
      </span>
    );
  };

  // Renders pending count text — orange if pending, grey if all done
  const PendingText = ({ course }) => {
    const pending = course.pending_count ?? 0;
    if (pending > 0) {
      return (
        <span className="text-sm font-semibold text-orange-600">
          {pending} pending
        </span>
      );
    }
    return <span className="text-sm text-gray-400">All done</span>;
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Page heading */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-1">
            My courses
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            You are enrolled in {courses.length} course{courses.length !== 1 ? 's' : ''}.
            Select a course to view its assignments and materials.
          </p>
        </div>

        {/* ── Summary metric cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          {/* Card 1 — Enrolled courses */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-primary-blue relative">
            <BookOpen size={16} className="text-primary-blue absolute top-4 right-4" />
            <p className="text-3xl font-bold text-text-dark">{courses.length}</p>
            <p className="text-sm text-gray-500 mt-1">Enrolled courses</p>
          </div>

          {/* Card 2 — Total weeks */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-blue-400 relative">
            <TrendingUp size={16} className="text-blue-400 absolute top-4 right-4" />
            <p className="text-3xl font-bold text-text-dark">{totalWeeks}</p>
            <p className="text-sm text-gray-500 mt-1">Total weeks</p>
          </div>

          {/* Card 3 — Total assignments (with pending indicator) */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-green-500 relative">
            <ClipboardList size={16} className="text-green-500 absolute top-4 right-4" />
            <p className="text-3xl font-bold text-text-dark">{totalAssignments}</p>
            <p className="text-sm text-gray-500 mt-1">
              Total assignments
              {totalPending > 0 && (
                <span className="ml-1.5 text-orange-500 font-semibold">
                  ({totalPending} pending)
                </span>
              )}
            </p>
          </div>

        </div>

        {/* Empty state */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-text-dark mb-1">No courses yet</h3>
            <p className="text-sm text-gray-500">
              You are not enrolled in any courses. Contact your instructor to get enrolled.
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop table — md and above ── */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Table column headers */}
              <div className="grid grid-cols-12 items-center px-6 py-3 bg-gray-50 border-b border-gray-200">
                <p className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Course</p>
                <p className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wide">Credits</p>
                <p className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Pending assignments</p>
                <p className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</p>
                <p className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Action</p>
              </div>

              {/* One row per course */}
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                >
                  {/* Course code + title + semester */}
                  <div className="col-span-4 flex flex-col items-start">
                    <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1">
                      {course.code}
                    </span>
                    <p className="text-sm font-semibold text-text-dark leading-snug">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{course.semester}</p>
                  </div>

                  {/* Credit hours */}
                  <div className="col-span-1">
                    <span className="text-sm text-gray-600">{course.credit_hours ?? 0} hrs</span>
                  </div>

                  {/* Pending count — real calculated value from backend */}
                  <div className="col-span-3">
                    <PendingText course={course} />
                  </div>

                  {/* Grading status badge — dynamic, not hardcoded */}
                  <div className="col-span-2">
                    <StatusBadge course={course} />
                  </div>

                  {/* Go to course button */}
                  <div className="col-span-2">
                    <button
                      onClick={() => navigate(`/student/course/${course.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition whitespace-nowrap"
                    >
                      Go to course
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Mobile cards — below md ── */}
            <div className="block md:hidden space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  {/* Top row — course code left, status badge right */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {course.code}
                    </span>
                    <StatusBadge course={course} />
                  </div>

                  {/* Course title */}
                  <p className="text-base font-semibold text-text-dark leading-snug mb-1">
                    {course.title}
                  </p>

                  {/* Meta row — semester, credits, pending */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                    <span>{course.semester}</span>
                    <span className="text-gray-300">•</span>
                    <span>{course.credit_hours ?? 0} credit hrs</span>
                    <span className="text-gray-300">•</span>
                    <PendingText course={course} />
                  </div>

                  {/* Full-width touch-friendly button */}
                  <button
                    onClick={() => navigate(`/student/course/${course.id}`)}
                    className="w-full mt-3 min-h-[48px] flex items-center justify-center gap-2 text-sm font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition"
                  >
                    Go to course
                    <ArrowRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </MainLayout>
  );
}