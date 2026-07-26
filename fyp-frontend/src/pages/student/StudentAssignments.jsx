import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardList, Loader2, AlertCircle,
  CheckCircle, Clock, XCircle, ArrowRight, Upload
} from 'lucide-react';
import { getHistory, getStudentCourses, getAssignmentsByCourseAndWeek, getCourseWeeks } from '../../utils/api';

// Format date string to "Apr 12, 2026"
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// Check if a due date has already passed
const isOverdue = (dueDateStr) => {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
};

export default function StudentAssignments() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [assignments, setAssignments]   = useState([]);
  const [submissions, setSubmissions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filter, setFilter]             = useState('all'); // 'all' | 'not_submitted' | 'submitted'

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch all courses the student is enrolled in
        const courses = await getStudentCourses(user.id);

        // For each course, fetch all weeks, then all assignments in each week
        const allAssignments = [];
        for (const course of courses) {
          const weeks = await getCourseWeeks(course.id);
          for (const week of weeks) {
            const weekAssignments = await getAssignmentsByCourseAndWeek(course.id, week.id);
            // Attach course and week info to each assignment for display
            weekAssignments.forEach((a) => {
              allAssignments.push({
                ...a,
                course_code:  course.code,
                course_title: course.title,
                week_number:  week.number,
                week_title:   week.title,
              });
            });
          }
        }

        // Also fetch submission history so we know which are already submitted
        const history = await getHistory(user.id);

        setAssignments(allAssignments);
        setSubmissions(history);
      } catch (err) {
        setError('Failed to load assignments. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user.id]);

  // Build a set of assignment IDs the student has already submitted
  const submittedAssignmentIds = new Set(
    submissions.map((s) => s.assignment_id)
  );

  // Find the latest submission for a given assignment (for showing result button)
  const getSubmission = (assignmentId) =>
    submissions
      .filter((s) => s.assignment_id === assignmentId)
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];

  // Apply filter
  const filtered = assignments.filter((a) => {
    if (filter === 'submitted')     return submittedAssignmentIds.has(a.id);
    if (filter === 'not_submitted') return !submittedAssignmentIds.has(a.id);
    return true;
  });

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <Loader2 className="animate-spin text-primary-blue" size={48} />
          <p className="text-gray-600 font-medium">Loading your assignments...</p>
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

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-1">My Assignments</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Track and submit assignments across all your enrolled courses.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: 'all',           label: 'All' },
            { key: 'not_submitted', label: 'Not submitted' },
            { key: 'submitted',     label: 'Submitted' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                filter === tab.key
                  ? 'bg-primary-blue text-white border-primary-blue'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-sm text-gray-400 ml-2">
            {filtered.length} assignment{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-text-dark mb-1">No assignments found</h3>
            <p className="text-sm text-gray-500">
              {filter === 'not_submitted'
                ? 'You have submitted all your assignments!'
                : filter === 'submitted'
                ? 'You have not submitted any assignments yet.'
                : 'No assignments have been posted yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Column headers */}
              <div className="grid grid-cols-12 items-center px-6 py-3 bg-gray-50 border-b border-gray-200">
                <p className="col-span-5 text-xs font-semibold text-gray-600 uppercase tracking-wide text-left">
                  Assignment Info
                </p>
                <p className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Type
                </p>
                <p className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Due Date
                </p>
                <p className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Status
                </p>
                <p className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">
                  Action
                </p>
              </div>

              {/* One row per assignment */}
              {filtered.map((assignment) => {
                const submitted   = submittedAssignmentIds.has(assignment.id);
                const submission  = getSubmission(assignment.id);
                const overdue     = isOverdue(assignment.due_date);
                const isClosed    = overdue && !submitted;
                const isDocument  = assignment.assignment_type === 'document';
                const isHandwritten = assignment.assignment_type === 'handwritten';
                const isCode      = assignment.assignment_type === 'code';

                return (
                  <div
                    key={assignment.id}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                  >
                    {/* Column 1 — title + course + week */}
                    <div className="col-span-5 flex flex-col items-start">
                      <p className="text-sm font-semibold text-text-dark leading-snug mb-1">
                        {assignment.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {assignment.course_code}
                        </span>
                        <span className="text-xs text-gray-400">
                          Week {assignment.week_number}
                        </span>
                        {assignment.assignment_type && (
                          <span className="text-xs text-gray-400">·</span>
                        )}
                        {isDocument && (
                          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            Document
                          </span>
                        )}
                        {isHandwritten && (
                          <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                            Handwritten
                          </span>
                        )}
                        {isCode && assignment.language && assignment.language !== 'N/A' && (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {assignment.language === 'cpp' ? 'C++' : assignment.language}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 2 — assignment type icon */}
                    <div className="col-span-2 flex justify-center">
                      {isDocument ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                          Document
                        </span>
                      ) : isHandwritten ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">
                          Handwritten
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          Code
                        </span>
                      )}
                    </div>

                    {/* Column 3 — due date */}
                    <div className="col-span-2 flex justify-center">
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatDate(assignment.due_date)}
                        </p>
                        {overdue && (
                          <p className="text-xs text-red-500">Overdue</p>
                        )}
                      </div>
                    </div>

                    {/* Column 4 — submission status */}
                    <div className="col-span-1 flex justify-center">
                      {submitted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                          <CheckCircle size={11} /> Submitted
                        </span>
                      ) : isClosed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          <XCircle size={11} /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </div>

                    {/* Column 5 — action button */}
                    <div className="col-span-2 flex justify-end">
                      {submitted && submission?.status === 'completed' ? (
                        <button
                          onClick={() => navigate(`/student/results/submission/${submission.submission_id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:opacity-90 transition whitespace-nowrap"
                        >
                          <CheckCircle size={12} /> View result
                        </button>
                      ) : submitted ? (
                        <span className="text-xs text-gray-400 font-medium">Processing...</span>
                      ) : isClosed ? (
                        <span className="text-xs text-gray-400 font-medium">Closed</span>
                      ) : (
                        <button
                          onClick={() => navigate(`/student/upload/${assignment.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition whitespace-nowrap"
                        >
                          <Upload size={12} /> Submit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile cards */}
            <div className="block md:hidden space-y-3">
              {filtered.map((assignment) => {
                const submitted     = submittedAssignmentIds.has(assignment.id);
                const submission    = getSubmission(assignment.id);
                const overdue       = isOverdue(assignment.due_date);
                const isClosed      = overdue && !submitted;
                const isDocument    = assignment.assignment_type === 'document';
                const isHandwritten = assignment.assignment_type === 'handwritten';

                return (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    {/* Top row — course code + status */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {assignment.course_code}
                      </span>
                      {submitted ? (
                        <span className="text-xs font-semibold text-green-700">✓ Submitted</span>
                      ) : isClosed ? (
                        <span className="text-xs font-semibold text-red-600">Overdue</span>
                      ) : (
                        <span className="text-xs font-semibold text-orange-600">Pending</span>
                      )}
                    </div>

                    {/* Assignment title */}
                    <p className="text-base font-semibold text-text-dark leading-snug mb-1">
                      {assignment.title}
                    </p>

                    {/* Meta — type + week + due date */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap mb-4">
                      {isDocument ? (
                        <span className="text-purple-600 font-medium">Document</span>
                      ) : isHandwritten ? (
                        <span className="text-orange-600 font-medium">Handwritten</span>
                      ) : (
                        <span>Code</span>
                      )}
                      <span className="text-gray-300">•</span>
                      <span>Week {assignment.week_number}</span>
                      <span className="text-gray-300">•</span>
                      <span className={overdue ? 'text-red-500 font-medium' : ''}>
                        Due: {formatDate(assignment.due_date)}
                      </span>
                    </div>

                    {/* Action button — full width */}
                    {submitted && submission?.status === 'completed' ? (
                      <button
                        onClick={() => navigate(`/student/results/submission/${submission.submission_id}`)}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:opacity-90 transition"
                      >
                        <CheckCircle size={15} /> View result
                      </button>
                    ) : submitted ? (
                      <div className="w-full min-h-[48px] flex items-center justify-center text-sm text-gray-400 font-medium bg-gray-50 rounded-lg">
                        Processing...
                      </div>
                    ) : isClosed ? (
                      <div className="w-full min-h-[48px] flex items-center justify-center text-sm text-gray-400 font-medium bg-gray-50 rounded-lg">
                        Closed
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/student/upload/${assignment.id}`)}
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 text-sm font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition"
                      >
                        <Upload size={15} /> Submit Assignment
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </MainLayout>
  );
}
