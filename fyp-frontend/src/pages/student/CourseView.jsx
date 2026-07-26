import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown, ArrowLeft, FileText, Code, AlertCircle,
  Download, Upload, Calendar, Layers, Loader2,
  Film, File, BookOpen,
} from 'lucide-react';
import {
  getCourse,
  getCourseWeeks,
  getAssignmentsByCourseAndWeek,
  getStudentCourses,
  getWeekMaterials,
} from '../../utils/api';

export default function CourseView() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [course, setCourse]       = useState(null);
  const [weeks, setWeeks]         = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Materials stored per week — loaded lazily when a week is opened
  const [materialsByWeek, setMaterialsByWeek]   = useState({});
  const [materialsLoading, setMaterialsLoading] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [courseData, weeksData, enrolledCourses] = await Promise.all([
          getCourse(courseId),
          getCourseWeeks(courseId),
          getStudentCourses(user.id),
        ]);

        setCourse(courseData);
        setWeeks(weeksData);

        // Check if this student is actually enrolled in this course
        const enrolled = enrolledCourses.some((c) => c.id === parseInt(courseId));
        setIsEnrolled(enrolled);

        // Fetch assignments for all weeks at once
        const assignmentsList = [];
        await Promise.all(
          weeksData.map(async (week) => {
            const weekAssignments = await getAssignmentsByCourseAndWeek(courseId, week.id);
            weekAssignments.forEach((a) => assignmentsList.push(a));
          })
        );
        setAssignments(assignmentsList);

      } catch {
        setError('Failed to load course. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [courseId, user.id]);

  // Load study materials for a week from the API
  const loadMaterials = async (weekId) => {
    setMaterialsLoading((prev) => ({ ...prev, [weekId]: true }));
    try {
      const data = await getWeekMaterials(weekId);
      setMaterialsByWeek((prev) => ({ ...prev, [weekId]: data }));
    } catch {
      setMaterialsByWeek((prev) => ({ ...prev, [weekId]: [] }));
    } finally {
      setMaterialsLoading((prev) => ({ ...prev, [weekId]: false }));
    }
  };

  // Filter assignments belonging to a specific week
  const getWeekAssignments = (weekId) =>
    assignments.filter((a) => a.week_id === weekId);

  // Toggle a week open or closed — load materials the first time it opens
  const toggleWeek = (weekId) => {
    const isCurrentlyOpen = expandedWeeks[weekId];
    setExpandedWeeks((prev) => ({ ...prev, [weekId]: !prev[weekId] }));

    // Load materials only when opening and not already loaded
    if (!isCurrentlyOpen && materialsByWeek[weekId] === undefined) {
      loadMaterials(weekId);
    }
  };

  // Check if the assignment due date has passed
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  };

  // Calculate how many days are left until the due date
  const getDaysLeft = (dueDate) => {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  // Return a color class based on how close the due date is
  const getDueDateColor = (daysLeft) => {
    if (daysLeft === null) return 'text-gray-500';
    if (daysLeft < 0)      return 'text-red-600';
    if (daysLeft <= 3)     return 'text-orange-500';
    return 'text-gray-600';
  };

  // Return badge style and label based on assignment type
  const getTypeBadge = (assignment) => {
    const type = assignment.assignment_type || 'code';
    if (type === 'document')    return { label: 'Document',    className: 'px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded' };
    if (type === 'handwritten') return { label: 'Handwritten', className: 'px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded' };
    return { label: assignment.language === 'cpp' ? 'C++' : 'Python', className: 'px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded' };
  };

  // Return the right icon for a study material
  const getMaterialIcon = (mat) => {
    if (mat.type === 'video') return <Film size={15} className="text-red-500 flex-shrink-0" />;
    const ext = mat.name.split('.').pop().toLowerCase();
    if (ext === 'pdf')                   return <FileText size={15} className="text-red-400 flex-shrink-0" />;
    if (['ppt', 'pptx'].includes(ext))   return <File size={15} className="text-orange-400 flex-shrink-0" />;
    return <File size={15} className="text-blue-400 flex-shrink-0" />;
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <Loader2 className="animate-spin text-primary-blue" size={48} />
          <p className="text-gray-600 font-medium">Loading course...</p>
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
            onClick={() => navigate('/student/dashboard')}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Back to Courses
          </button>
        </div>
      </MainLayout>
    );
  }

  // Course not found
  if (!course) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-text-dark mb-2">Course Not Found</h2>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-6 py-2 bg-primary-blue text-white rounded-lg font-semibold"
          >
            Back to Courses
          </button>
        </div>
      </MainLayout>
    );
  }

  // Not enrolled
  if (!isEnrolled) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h2 className="text-2xl font-bold text-text-dark mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You are not enrolled in this course.</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-6 py-2 bg-primary-blue text-white rounded-lg font-semibold"
          >
            Back to My Courses
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 text-primary-blue hover:underline mb-6 font-semibold transition text-sm"
        >
          <ArrowLeft size={20} /> Back to Courses
        </button>

        {/* Course header banner */}
        <div className="bg-gradient-to-r from-primary-blue to-blue-700 rounded-lg p-5 sm:p-8 text-white mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-2">
                {course.code}
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-left">{course.title}</h1>
              <p className="text-blue-100 mb-4 text-left text-sm sm:text-base">{course.description}</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-blue-200 text-sm">Semester</p>
                  <p className="font-semibold text-sm sm:text-base">{course.semester}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Credits</p>
                  <p className="font-semibold text-sm sm:text-base">{course.credit_hours}</p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4 min-w-fit">
              <p className="text-blue-100 text-sm font-semibold mb-1">Assignments</p>
              <p className="text-3xl sm:text-4xl font-bold">{assignments.length}</p>
              <p className="text-blue-100 text-sm mt-1">Total created</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-primary-blue">
            <p className="text-sm text-gray-600 font-medium">Total Weeks</p>
            <p className="text-2xl font-bold text-primary-blue mt-1">{weeks.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 font-medium">Total Assignments</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{assignments.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-600 font-medium">Status</p>
            <p className="text-lg font-bold text-green-600 mt-1">Enrolled</p>
          </div>
        </div>

        {/* Weekly content accordion */}
        <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-4">Course Content</h2>

        {weeks.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600">No weeks available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weeks.map((week) => {
              const weekAssignments = getWeekAssignments(week.id);
              const weekMaterials   = materialsByWeek[week.id] || [];
              const isLoadingMats   = materialsLoading[week.id];
              const isOpen          = !!expandedWeeks[week.id];

              return (
                <div key={week.id} className="bg-white rounded-lg shadow-md overflow-hidden">

                  {/* Week header row */}
                  <button
                    onClick={() => toggleWeek(week.id)}
                    className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 text-left">
                      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold text-sm sm:text-base">
                        {week.number}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-dark text-base sm:text-lg text-left">
                          {week.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {weekAssignments.length > 0
                            ? `${weekAssignments.length} assignment(s)`
                            : 'No assignments yet'}
                          {weekMaterials.length > 0 && ` · ${weekMaterials.length} material(s)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {weekAssignments.length > 0 && (
                        <span className="px-2 py-1 bg-primary-blue text-white text-xs font-bold rounded-full">
                          {weekAssignments.length}
                        </span>
                      )}
                      <ChevronDown
                        size={22}
                        className={`text-primary-blue transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Week body — only shown when open */}
                  {isOpen && (
                    <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-gray-50 space-y-5">

                      {/* Study Materials section */}
                      <div>
                        <h4 className="font-semibold text-text-dark mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <BookOpen size={16} className="text-primary-blue flex-shrink-0" />
                          Study Materials
                        </h4>

                        {/* Loading spinner */}
                        {isLoadingMats ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 size={14} className="animate-spin text-gray-400" />
                            <span className="text-sm text-gray-400">Loading materials...</span>
                          </div>
                        ) : weekMaterials.length > 0 ? (
                          <div className="space-y-2">
                            {weekMaterials.map((mat) => (
                              <a
                                key={mat.id}
                                href={mat.type === 'file' ? `http://localhost:8000${mat.url}` : mat.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-primary-blue hover:bg-blue-50 transition group"
                              >
                                {getMaterialIcon(mat)}
                                <span className="text-sm text-text-dark font-medium truncate group-hover:text-primary-blue transition">
                                  {mat.name}
                                </span>
                                {/* Show a small type badge */}
                                <span className={`ml-auto flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded
                                  ${mat.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                  {mat.type === 'video' ? 'Video' : mat.name.split('.').pop().toUpperCase()}
                                </span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No study materials uploaded yet.</p>
                        )}
                      </div>

                      {/* Assignments section */}
                      {weekAssignments.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-text-dark mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <Code size={16} className="text-primary-blue flex-shrink-0" />
                            Assignments ({weekAssignments.length})
                          </h4>
                          <div className="space-y-3">
                            {weekAssignments.map((assignment, idx) => {
                              const daysLeft  = getDaysLeft(assignment.due_date);
                              const typeBadge = getTypeBadge(assignment);
                              const overdue   = isOverdue(assignment.due_date);

                              return (
                                <div
                                  key={assignment.id}
                                  className={`p-4 rounded-lg border bg-white hover:shadow-md transition ${overdue ? 'border-red-300' : 'border-gray-200'}`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                                    {/* Left — title, badges, due date */}
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <FileText size={18} className="text-primary-blue flex-shrink-0 mt-1" />
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-text-dark mb-1 text-left text-sm sm:text-base">
                                          {idx + 1}. {assignment.title}
                                        </h5>

                                        {/* Badges row */}
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                            {assignment.topic}
                                          </span>
                                          <span className={typeBadge.className}>
                                            {typeBadge.label}
                                          </span>
                                          {(assignment.assignment_type || 'code') === 'code' && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                              {assignment.num_test_cases} test cases
                                            </span>
                                          )}
                                          {overdue && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded">
                                              Overdue
                                            </span>
                                          )}
                                        </div>

                                        {/* Due date */}
                                        {assignment.due_date && (
                                          <div className={`flex items-center gap-1 text-xs font-medium ${getDueDateColor(daysLeft)}`}>
                                            <Calendar size={12} />
                                            Due: {assignment.due_date}
                                            {daysLeft !== null && (
                                              <span className="ml-1">
                                                ({daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today!' : `${daysLeft} days left`})
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right — action buttons */}
                                    <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                                      {assignment.file_path && (
                                        <a
                                          href={`http://localhost:8000${assignment.file_path}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 transition"
                                        >
                                          <Download size={14} />
                                          Instructions
                                        </a>
                                      )}

                                      {overdue ? (
                                        <button
                                          disabled
                                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed"
                                        >
                                          Closed
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => navigate(`/student/upload/${assignment.id}`)}
                                          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-white rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition ${
                                            (assignment.assignment_type || 'code') === 'document'
                                              ? 'bg-purple-600'
                                              : (assignment.assignment_type || 'code') === 'handwritten'
                                                ? 'bg-orange-500'
                                                : 'bg-primary-blue'
                                          }`}
                                        >
                                          <Upload size={14} />
                                          Submit
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Layers className="mx-auto text-gray-300 mb-2" size={32} />
                          <p className="text-gray-500 text-sm">No assignments for this week yet.</p>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
