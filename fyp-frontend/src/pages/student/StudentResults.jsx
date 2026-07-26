import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import {
  Trophy, Award,
  Loader2, AlertCircle, ArrowRight,
} from 'lucide-react';
import { getHistory } from '../../utils/api';


// Return Tailwind color classes based on standardized score out of 10
const getScoreColor = (score) => {
  if (score >= 8) return { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
  if (score >= 6) return { text: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200'  };
  if (score >= 4) return { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  return           { text: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200'   };
};

// Format a date string to e.g. "Apr 12, 2026"
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
};

// Clean the problem_id field — remove "Problem #" prefix if present
const cleanTitle = (problemId) => {
  if (!problemId) return 'Untitled';
  return String(problemId).replace(/^problem\s*#?\s*/i, '').trim();
};


export default function StudentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Fetch submission history on mount
  useEffect(() => {
    getHistory(user.id)
      .then(setSubmissions)
      .catch(() => setError('Failed to load your results. Please try again.'))
      .finally(() => setLoading(false));
  }, [user.id]);

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <Loader2 className="animate-spin text-primary-blue" size={48} />
          <p className="text-gray-600 font-medium">Loading your results...</p>
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

  // Only count submissions that have a standardized score
  const graded = submissions.filter(
    (s) => s.status === 'completed' &&
           s.standardized_score !== null &&
           s.standardized_score !== undefined
  );
  const totalGraded = graded.length;

  // Average rounded to 1 decimal place
  const avgScore = totalGraded > 0
    ? Math.round((graded.reduce((sum, s) => sum + s.standardized_score, 0) / totalGraded) * 10) / 10
    : 0;

  const highestScore = totalGraded > 0
    ? Math.max(...graded.map((s) => s.standardized_score))
    : 0;

  const lowestScore = totalGraded > 0
    ? Math.min(...graded.map((s) => s.standardized_score))
    : 0;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Page heading */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-1">My Results</h2>
          <p className="text-sm sm:text-base text-gray-600">
            View your grades and AI feedback on submitted assignments.
          </p>
        </div>

        {/* Summary cards — only shown when graded work exists */}
        {totalGraded > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            {/* Card 1 — total graded submissions */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-primary-blue relative">
              <Trophy size={16} className="text-primary-blue absolute top-4 right-4" />
              <p className="text-3xl font-bold text-text-dark">{totalGraded}</p>
              <p className="text-sm text-gray-500 mt-1">Graded submissions</p>
            </div>

            {/* Card 2 — average standardized score out of 10 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-blue-400 relative">
              <Award size={16} className="text-blue-400 absolute top-4 right-4" />
              <p className={`text-3xl font-bold ${getScoreColor(avgScore).text}`}>
                {avgScore} / 10
              </p>
              <p className="text-sm text-gray-500 mt-1">Average score</p>
            </div>

            {/* Card 3 — highest standardized score out of 10 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-green-500 relative">
              <Trophy size={16} className="text-green-500 absolute top-4 right-4" />
              <p className="text-3xl font-bold text-green-600">{highestScore} / 10</p>
              <p className="text-sm text-gray-500 mt-1">Highest score</p>
            </div>

            {/* Card 4 — lowest standardized score out of 10 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-orange-400 relative">
              <Award size={16} className="text-orange-400 absolute top-4 right-4" />
              <p className="text-3xl font-bold text-orange-600">{lowestScore} / 10</p>
              <p className="text-sm text-gray-500 mt-1">Lowest score</p>
            </div>

          </div>
        )}

        {/* Empty state — no submissions at all */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-text-dark mb-1">No submissions yet</h3>
            <p className="text-sm text-gray-500">
              Your graded assignments will appear here once they have been evaluated.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table — visible on md and above */}
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
                  Status
                </p>
                <p className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
                  Score
                </p>
                <p className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">
                  Action
                </p>
              </div>

              {/* One row per submission */}
              {submissions.map((submission) => {
                // Use standardized_score — NOT raw score, NO grade letter
                const hasScore      = submission.standardized_score !== null &&
                                      submission.standardized_score !== undefined;
                const isDocument    = submission.submission_type === 'document';
                const isHandwritten = submission.submission_type === 'handwritten';
                const colors        = hasScore ? getScoreColor(submission.standardized_score) : null;
                const title         = cleanTitle(submission.problem_id);

                return (
                  <div
                    key={submission.submission_id}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                  >
                    {/* Column 1 — title + course code badge + date */}
                    <div className="col-span-5 flex flex-col items-start">
                      <p className="text-sm font-semibold text-text-dark leading-snug mb-1">
                        {title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {submission.course_code && (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {submission.course_code}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(submission.submitted_at)}
                        </span>
                      </div>
                    </div>

                    {/* Column 2 — submission type badge */}
                    <div className="col-span-2 flex justify-center">
                      {isDocument ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                          Document
                        </span>
                      ) : isHandwritten ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">
                          Handwritten
                        </span>
                      ) : submission.language && submission.language !== "N/A" ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {submission.language === "cpp" ? "C++" : submission.language}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>

                    {/* Column 3 — status badge */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                          submission.status === "completed"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : submission.status === "failed"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-orange-50 text-orange-700 border border-orange-100"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </div>

                    {/* Column 4 — standardized score "X.X / 10" — no % no grade letter */}
                    <div className="col-span-1 flex justify-center">
                      {hasScore ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded border whitespace-nowrap
                            ${colors.text} ${colors.bg} ${colors.border}`}
                        >
                          {submission.standardized_score} / 10
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    {/* Column 5 — view result button */}
                    <div className="col-span-2 flex justify-end">
                      {submission.status === "completed" && (
                        <button
                          onClick={() =>
                            navigate(`/student/results/submission/${submission.submission_id}`)
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition whitespace-nowrap"
                        >
                          Check result
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile cards — visible below md only */}
            <div className="block md:hidden space-y-3">
              {submissions.map((submission) => {
                // Use standardized_score — NOT raw score, NO grade letter
                const hasScore      = submission.standardized_score !== null &&
                                      submission.standardized_score !== undefined;
                const isDocument    = submission.submission_type === 'document';
                const isHandwritten = submission.submission_type === 'handwritten';
                const colors        = hasScore ? getScoreColor(submission.standardized_score) : null;
                const title         = cleanTitle(submission.problem_id);

                return (
                  <div
                    key={submission.submission_id}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    {/* Top row — course code left, score right */}
                    <div className="flex items-center justify-between mb-2">
                      {submission.course_code ? (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {submission.course_code}
                        </span>
                      ) : (
                        <span />
                      )}

                      {/* Standardized score — no % no grade letter */}
                      {hasScore ? (
                        <span
                          className={`text-sm font-bold px-2 py-0.5 rounded border
                            ${colors.text} ${colors.bg} ${colors.border}`}
                        >
                          {submission.standardized_score} / 10
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </div>

                    {/* Assignment title */}
                    <p className="text-base font-semibold text-text-dark leading-snug mb-1">
                      {title}
                    </p>

                    {/* Type + submitted date */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap mb-4">
                      {isDocument ? (
                        <span className="text-purple-600 font-medium">Document</span>
                      ) : isHandwritten ? (
                        <span className="text-orange-600 font-medium">Handwritten</span>
                      ) : submission.language && submission.language !== "N/A" ? (
                        <span>{submission.language === "cpp" ? "C++" : submission.language}</span>
                      ) : null}
                      <span className="text-gray-300">•</span>
                      <span>Submitted: {formatDate(submission.submitted_at)}</span>
                    </div>

                    {/* Full-width action button — easy to tap on mobile */}
                    {submission.status === "completed" && (
                      <button
                        onClick={() =>
                          navigate(`/student/results/submission/${submission.submission_id}`)
                        }
                        className="w-full min-h-[48px] flex items-center justify-center gap-2 text-sm font-semibold text-white bg-primary-blue rounded-lg hover:opacity-90 transition"
                      >
                        Check result
                        <ArrowRight size={15} />
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