import React, { useState, useMemo } from 'react';
import { MainLayout } from '../../layout/MainLayout';
import { ChevronDown, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * GradingQueue Component
 * 
 * Features:
 * - Table view of student submissions
 * - Filter by status (pending, grading, graded)
 * - Search by student name
 * - Sort by submission date, student name, assignment
 * - Action button to grade submissions
 * 
 * Props: None
 */
export default function GradingQueue() {
  // Mock submissions data
  const [submissions] = useState([
    {
      id: 1,
      studentName: 'Alice Johnson',
      studentEmail: 'alice@university.edu',
      assignmentTitle: 'Python Calculator Program',
      assignmentType: 'code',
      submittedDate: '2026-01-28 10:30 AM',
      status: 'pending', // pending, grading, graded
      grade: null,
    },
    {
      id: 2,
      studentName: 'Bob Smith',
      studentEmail: 'bob@university.edu',
      assignmentTitle: 'Algorithm Analysis Essay',
      assignmentType: 'document',
      submittedDate: '2026-01-27 02:15 PM',
      status: 'pending',
      grade: null,
    },
    {
      id: 3,
      studentName: 'Carol White',
      studentEmail: 'carol@university.edu',
      assignmentTitle: 'Handwritten Problem Set',
      assignmentType: 'handwritten',
      submittedDate: '2026-01-26 09:45 AM',
      status: 'grading',
      grade: null,
    },
    {
      id: 4,
      studentName: 'David Lee',
      studentEmail: 'david@university.edu',
      assignmentTitle: 'Python Calculator Program',
      assignmentType: 'code',
      submittedDate: '2026-01-25 04:20 PM',
      status: 'graded',
      grade: 92,
    },
    {
      id: 5,
      studentName: 'Emma Davis',
      studentEmail: 'emma@university.edu',
      assignmentTitle: 'Data Structures Project',
      assignmentType: 'code',
      submittedDate: '2026-01-24 11:00 AM',
      status: 'graded',
      grade: 87,
    },
    {
      id: 6,
      studentName: 'Frank Wilson',
      studentEmail: 'frank@university.edu',
      assignmentTitle: 'Algorithm Analysis Essay',
      assignmentType: 'document',
      submittedDate: '2026-01-23 03:30 PM',
      status: 'graded',
      grade: 78,
    },
  ]);

  // Filter and search state
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, grading, graded
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submitted'); // submitted, student, assignment

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = submissions;

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((sub) => sub.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (sub) =>
          sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    result = result.sort((a, b) => {
      if (sortBy === 'submitted') {
        return new Date(b.submittedDate) - new Date(a.submittedDate);
      } else if (sortBy === 'student') {
        return a.studentName.localeCompare(b.studentName);
      } else if (sortBy === 'assignment') {
        return a.assignmentTitle.localeCompare(b.assignmentTitle);
      }
      return 0;
    });

    return result;
  }, [submissions, filterStatus, searchTerm, sortBy]);

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: AlertCircle,
          label: 'Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
        };
      case 'grading':
        return {
          icon: Clock,
          label: 'In Progress',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
        };
      case 'graded':
        return {
          icon: CheckCircle,
          label: 'Graded',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
        };
      default:
        return {
          icon: AlertCircle,
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
        };
    }
  };

  // Get assignment type color
  const getAssignmentTypeColor = (type) => {
    switch (type) {
      case 'code':
        return "bg-blue-100 text-blue-800";
      case 'document':
        return "bg-purple-100 text-purple-800";
      case 'handwritten':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    inProgress: submissions.filter((s) => s.status === 'grading').length,
    graded: submissions.filter((s) => s.status === 'graded').length,
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-text-dark mb-2">
            Grading Queue
          </h2>
          <p className="text-gray-600">
            Review and grade student submissions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-primary-blue">
            <p className="text-sm text-gray-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-primary-blue">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">Graded</p>
            <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-text-dark mb-2 block">
                Search
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by student name, email, or assignment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="text-sm font-semibold text-text-dark mb-2 block">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending</option>
                <option value="grading">In Progress</option>
                <option value="graded">Graded</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-gray-600 self-center">Sort by:</span>
            {['submitted', 'student', 'assignment'].map((sortOption) => (
              <button
                key={sortOption}
                onClick={() => setSortBy(sortOption)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition
                  ${
                    sortBy === sortOption
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-200 text-text-dark hover:bg-gray-300'
                  }
                `}
              >
                {sortOption === 'submitted'
                  ? 'Submitted Date'
                  : sortOption === 'student'
                  ? 'Student Name'
                  : 'Assignment'}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 text-lg">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark">
                      Assignment
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dark">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-text-dark">
                      Grade
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-text-dark">
                      Action
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => {
                    const statusInfo = getStatusBadge(submission.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr
                        key={submission.id}
                        className="hover:bg-gray-50 transition"
                      >
                        {/* Student */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-text-dark">
                              {submission.studentName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {submission.studentEmail}
                            </p>
                          </div>
                        </td>

                        {/* Assignment */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-text-dark">
                              {submission.assignmentTitle}
                            </p>
                            <span
                              className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${getAssignmentTypeColor(
                                submission.assignmentType
                              )}`}
                            >
                              {submission.assignmentType}
                            </span>
                          </div>
                        </td>

                        {/* Submitted Date */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {submission.submittedDate}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}
                          >
                            <StatusIcon size={16} />
                            {statusInfo.label}
                          </div>
                        </td>

                        {/* Grade */}
                        <td className="px-6 py-4 text-center">
                          {submission.grade ? (
                            <span className="font-bold text-lg text-primary-blue">
                              {submission.grade}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              alert(
                                `Opening grading interface for ${submission.studentName}...`
                              )
                            }
                            className={`
                              px-4 py-2 rounded-lg font-semibold transition text-sm
                              ${
                                submission.status === 'graded'
                                  ? 'bg-gray-200 text-gray-600 cursor-default'
                                  : 'bg-primary-blue text-white hover:bg-opacity-90'
                              }
                            `}
                            disabled={submission.status === 'graded'}
                          >
                            {submission.status === 'graded'
                              ? 'View'
                              : submission.status === 'grading'
                              ? 'Continue'
                              : 'Grade'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
          <p>
            Showing <span className="font-semibold">{filteredSubmissions.length}</span> of{' '}
            <span className="font-semibold">{stats.total}</span> submissions
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
