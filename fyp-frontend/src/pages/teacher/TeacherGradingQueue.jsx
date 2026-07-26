import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../../layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, CheckCircle, Clock,
  AlertCircle, Loader, XCircle, Eye,
  Sparkles, FileText, Code2
} from 'lucide-react';
import { getTeacherSubmissions } from "../../utils/api";
 
const BASE_URL = 'http://localhost:8000';
 
export default function TeacherGradingQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
 
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
 
  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        const data = await getTeacherSubmissions(user.id);
        setSubmissions(data);
      } catch (err) {
        setError("Failed to load submissions. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, [user.id]);
 
  // Build unique course list from submissions for the course filter dropdown
  const uniqueCourses = useMemo(() => {
    const seen = new Set();
    return submissions.filter((s) => {
      if (seen.has(s.course_id)) return false;
      seen.add(s.course_id);
      return true;
    });
  }, [submissions]);
 
  // Apply search, status filter, and course filter — always sorted by newest first
  // "failed" filter catches both "failed" and "error" since backend uses both values
  const filtered = useMemo(() => {
    return submissions
      .filter((s) => {
        const matchesSearch =
          s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student_matric?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.assignment_title?.toLowerCase().includes(searchTerm.toLowerCase());
 
        const isFailed = s.status === 'failed' || s.status === 'error';
        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'failed' ? isFailed : s.status === filterStatus);
 
        const matchesCourse =
          filterCourse === 'all' || String(s.course_id) === String(filterCourse);
        return matchesSearch && matchesStatus && matchesCourse;
      })
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }, [submissions, searchTerm, filterStatus, filterCourse]);
 
  // Return color class based on standardized score out of 10
  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };
 
  // Return badge background color based on standardized score out of 10
  const getScoreBadgeColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-700';
    if (score >= 6) return 'bg-blue-100 text-blue-700';
    if (score >= 4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };
 
  // Convert any name string to Title Case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
 
  // Status badge — completed shows "AI Graded" with sparkle icon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            <Sparkles size={12} /> AI Graded
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
            <Clock size={13} /> Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            <Loader size={13} className="animate-spin" /> Processing
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
            <XCircle size={13} /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            <AlertCircle size={13} /> {status}
          </span>
        );
    }
  };
 
  // Type badge — shows language for code, or Document / Handwritten label
  const getTypeBadge = (s) => {
    const type = s.assignment_type || s.submission_type;
    if (type === "handwritten") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
          <FileText size={11} /> Handwritten
        </span>
      );
    }
    if (type === "document") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
          <FileText size={11} /> Document
        </span>
      );
    }
    if (!s.language) return <span className="text-xs text-gray-400">—</span>;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
          s.language === 'cpp' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}
      >
        <Code2 size={11} />
        {s.language === 'cpp' ? 'C++' : 'Python'}
      </span>
    );
  };
 
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
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <XCircle className="text-red-500" size={40} />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </MainLayout>
    );
  }
 
  // Summary card counts
  const totalCount     = submissions.length;
  const completedCount = submissions.filter((s) => s.status === 'completed').length;
  const pendingCount   = submissions.filter((s) => s.status === 'pending' || s.status === 'processing').length;
  const failedCount    = submissions.filter((s) => s.status === 'failed' || s.status === 'error').length;
 
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">
 
        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-dark mb-1">Grading Queue</h2>
          <p className="text-gray-500 text-sm">
            All student submissions across your courses reviewed by AI.
          </p>
        </div>
 
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-text-dark">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">AI Graded</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Failed</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-500">{failedCount}</p>
          </div>
        </div>
 
        {/* Filters row */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
 
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search student or assignment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
              />
            </div>
 
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400 flex-shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
              >
                <option value="all">All Status</option>
                <option value="completed">AI Graded</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
 
            {/* Course filter */}
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-blue"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map((s) => (
                <option key={s.course_id} value={s.course_id}>
                  {s.course_code} — {s.course_title}
                </option>
              ))}
            </select>
 
          </div>
        </div>
 
        {/* Submissions table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-base font-medium">No submissions found.</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((s) => (
                    <tr key={s.submission_id} className="hover:bg-gray-50 transition-colors">
 
                      {/* Student name + matric */}
                      <td className="px-4 sm:px-6 py-4">
                        <p className="font-semibold text-text-dark text-sm whitespace-nowrap">
                          {toTitleCase(s.student_name)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.student_matric}</p>
                      </td>
 
                      {/* Assignment title */}
                      <td className="px-4 sm:px-6 py-4 max-w-[220px]">
                        <p className="text-sm font-medium text-text-dark leading-snug">
                          {s.assignment_title}
                        </p>
                      </td>
 
                      {/* Course code + title */}
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-semibold text-text-dark whitespace-nowrap">{s.course_code}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.course_title}</p>
                      </td>
 
                      {/* Submission type badge */}
                      <td className="px-4 sm:px-6 py-4">
                        {getTypeBadge(s)}
                      </td>
 
                      {/* Score — shows standardized score as "X.X / 10" */}
                      <td className="px-4 sm:px-6 py-4">
                        {s.status === 'completed' ? (
                          <div className="flex flex-col items-start gap-1">
                            {/* Standardized score badge */}
                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${getScoreBadgeColor(s.standardized_score)}`}>
                              {s.standardized_score !== null && s.standardized_score !== undefined
                                ? `${s.standardized_score} / 10`
                                : '— / 10'}
                            </span>
                            {/* Test case count only for code submissions */}
                            {s.submission_type === 'code' && s.total != null && (
                              <p className="text-xs text-gray-400">
                                {s.passed}/{s.total} passed
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
 
                      {/* Submission date + time */}
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm text-gray-600 whitespace-nowrap">
                          {new Date(s.submitted_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(s.submitted_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
 
                      {/* Status badge */}
                      <td className="px-4 sm:px-6 py-4">
                        {getStatusBadge(s.status)}
                      </td>
 
                      {/* View button */}
                      <td className="px-4 sm:px-6 py-4">
                        {s.status === 'completed' ? (
                          <button
                            onClick={() => navigate(`/teacher/grading/submission/${s.submission_id}`)}
                            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary-blue text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            <Eye size={13} /> View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Not ready</span>
                        )}
                      </td>
 
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
 
        {/* Result count below table */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {filtered.length} of {submissions.length} submissions
          </p>
        )}
 
      </div>
    </MainLayout>
  );
}