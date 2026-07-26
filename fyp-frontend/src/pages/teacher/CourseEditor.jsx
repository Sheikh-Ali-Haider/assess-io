import React, { useState } from 'react';
import { MainLayout } from '../../layout/MainLayout';
import { useParams } from 'react-router-dom';
import {
  Plus, Trash2, X, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Pencil, Upload, Youtube,
  FileText, Film, File
} from 'lucide-react';
import { getCourseById, weeks as allWeeks } from '../../utils/mockData';

export default function CourseEditor() {
  const { courseId } = useParams();
  const course = getCourseById(parseInt(courseId));
  const courseWeeks = allWeeks.filter((w) => w.courseId === parseInt(courseId));

  // Which weeks are expanded
  const [expandedWeeks, setExpandedWeeks] = useState({});

  // Success toast message
  const [successMessage, setSuccessMessage] = useState('');

  // ── WEEK FORM STATE ──
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [weekErrors, setWeekErrors] = useState([]);
  const [weekFormData, setWeekFormData] = useState({
    weekNumber: '',
    title: '',
    startDate: '',
  });

  // ── STUDY MATERIAL STATE ──
  // materialTarget = which weekId the "+ Add Study Material" button was clicked for
  const [materialTarget, setMaterialTarget] = useState(null);
  const [materialTab, setMaterialTab] = useState('file'); // 'file' or 'video'
  const [materialFile, setMaterialFile] = useState(null);
  const [videoLink, setVideoLink] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [materialError, setMaterialError] = useState('');

  // Materials stored per week — { weekId: [ { type, name, url } ] }
  const [materialsByWeek, setMaterialsByWeek] = useState({});

  // ── WEEK HELPERS ──

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const toggleWeek = (weekId) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const openAddWeek = () => {
    setEditingWeek(null);
    setWeekFormData({ weekNumber: '', title: '', startDate: '' });
    setWeekErrors([]);
    setIsWeekModalOpen(true);
  };

  const openEditWeek = (e, week) => {
    // Stop click from toggling the accordion
    e.stopPropagation();
    setEditingWeek(week);
    setWeekFormData({
      weekNumber: String(week.weekNumber),
      title: week.topic || '',
      startDate: week.startDate || '',
    });
    setWeekErrors([]);
    setIsWeekModalOpen(true);
  };

  const handleDeleteWeek = (e, weekId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this week?')) {
      showSuccess('Week deleted successfully!');
    }
  };

  const handleWeekInputChange = (e) => {
    const { name, value } = e.target;
    setWeekFormData((prev) => ({ ...prev, [name]: value }));
    setWeekErrors([]);
  };

  const validateWeekForm = () => {
    const errors = [];
    if (!weekFormData.weekNumber.trim()) errors.push('Week Number is required');
    if (!weekFormData.title.trim()) errors.push('Week Title is required');
    if (!weekFormData.startDate.trim()) errors.push('Start Date is required');
    return errors;
  };

  const handleSaveWeek = (e) => {
    e.preventDefault();
    const errors = validateWeekForm();
    if (errors.length > 0) {
      setWeekErrors(errors);
      return;
    }
    showSuccess(editingWeek ? 'Week updated successfully!' : 'Week added successfully!');
    setIsWeekModalOpen(false);
    setEditingWeek(null);
    setWeekFormData({ weekNumber: '', title: '', startDate: '' });
  };

  // ── MATERIAL HELPERS ──

  const openMaterialPanel = (weekId) => {
    setMaterialTarget(weekId);
    setMaterialTab('file');
    setMaterialFile(null);
    setVideoLink('');
    setVideoTitle('');
    setMaterialError('');
  };

  const closeMaterialPanel = () => {
    setMaterialTarget(null);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(ext)) {
      setMaterialError('Only PDF, PPT, or Word files are allowed.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMaterialError('File must be under 20MB.');
      return;
    }
    setMaterialFile(file);
    setMaterialError('');
  };

  const handleSaveMaterial = () => {
    if (materialTab === 'file') {
      if (!materialFile) {
        setMaterialError('Please select a file to upload.');
        return;
      }
      const newMaterial = {
        type: 'file',
        name: materialFile.name,
        url: URL.createObjectURL(materialFile),
      };
      setMaterialsByWeek((prev) => ({
        ...prev,
        [materialTarget]: [...(prev[materialTarget] || []), newMaterial],
      }));
    } else {
      if (!videoLink.trim()) {
        setMaterialError('Please enter a YouTube link.');
        return;
      }
      // Extract YouTube video ID and build embed URL
      const match = videoLink.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const embedUrl = match
        ? `https://www.youtube.com/embed/${match[1]}`
        : videoLink;
      const newMaterial = {
        type: 'video',
        name: videoTitle.trim() || 'YouTube Video',
        url: embedUrl,
        thumb: match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null,
      };
      setMaterialsByWeek((prev) => ({
        ...prev,
        [materialTarget]: [...(prev[materialTarget] || []), newMaterial],
      }));
    }
    showSuccess('Study material added!');
    closeMaterialPanel();
  };

  const handleDeleteMaterial = (weekId, index) => {
    setMaterialsByWeek((prev) => ({
      ...prev,
      [weekId]: prev[weekId].filter((_, i) => i !== index),
    }));
  };

  // Return the right icon for a file based on its extension
  const getMaterialIcon = (material) => {
    if (material.type === 'video') return <Film size={16} className="text-red-500" />;
    const ext = material.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText size={16} className="text-red-400" />;
    if (['ppt', 'pptx'].includes(ext)) return <File size={16} className="text-orange-400" />;
    return <File size={16} className="text-blue-400" />;
  };

  if (!course) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <p className="text-gray-600 text-lg">Course not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Page header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-text-dark mb-2">Edit Course</h2>
            <p className="text-gray-600">Manage course content, weeks, and materials</p>
          </div>
          <a
            href="/teacher/dashboard"
            className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="font-semibold text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Course banner */}
        <div className="bg-gradient-to-r from-primary-blue to-blue-700 text-white rounded-lg shadow-md p-8 mb-8">
          <p className="text-sm font-semibold opacity-90 mb-2">
            {course.code} • Semester {course.semester} • {course.credits} Credits
          </p>
          <h3 className="text-3xl font-bold mb-3 text-left">{course.name}</h3>
          <p className="text-lg opacity-90 text-left">{course.description}</p>
        </div>

        {/* Three info cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-bold text-text-dark mb-4">Course Information</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Course Code</p>
                <p className="font-semibold text-text-dark">{course.code}</p>
              </div>
              <div>
                <p className="text-gray-600">Semester</p>
                <p className="font-semibold text-text-dark">{course.semester}</p>
              </div>
              <div>
                <p className="text-gray-600">Credits</p>
                <p className="font-semibold text-text-dark">{course.credits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-bold text-text-dark mb-4">Course Statistics</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Total Weeks</p>
                <p className="font-semibold text-text-dark">{courseWeeks.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Enrollment Status</p>
                <p className="font-semibold text-text-dark">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-bold text-text-dark mb-4">Quick Actions</h4>
            <button
              onClick={openAddWeek}
              className="w-full px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Week
            </button>
          </div>
        </div>

        {/* Course weeks accordion */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-text-dark">
              Course Weeks ({courseWeeks.length})
            </h3>
          </div>

          {courseWeeks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No weeks created yet. Add your first week!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {courseWeeks.map((week) => (
                <div key={week.id}>

                  {/* Week header row — clicking anywhere toggles expand */}
                  <div
                    onClick={() => toggleWeek(week.id)}
                    className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
                  >
                    {/* Left side — week number badge + title */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary-blue text-white rounded-lg flex items-center justify-center font-bold text-lg">
                        {week.weekNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-dark text-left truncate">
                          {week.topic}
                        </p>
                        {week.startDate && (
                          <p className="text-xs text-gray-500 text-left">
                            Starts: {week.startDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side — edit, delete, chevron */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                      {/* Edit week — stopPropagation so accordion doesn't toggle */}
                      <button
                        onClick={(e) => openEditWeek(e, week)}
                        className="p-2 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition"
                        title="Edit week"
                      >
                        <Pencil size={16} />
                      </button>
                      {/* Delete week */}
                      <button
                        onClick={(e) => handleDeleteWeek(e, week.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete week"
                      >
                        <Trash2 size={16} />
                      </button>
                      {/* Expand / collapse arrow */}
                      {expandedWeeks[week.id]
                        ? <ChevronUp className="text-gray-400 ml-1" size={20} />
                        : <ChevronDown className="text-gray-400 ml-1" size={20} />
                      }
                    </div>
                  </div>

                  {/* Expanded week body */}
                  {expandedWeeks[week.id] && (
                    <div className="px-4 sm:px-6 pb-6 bg-gray-50 space-y-5">

                      {/* Study Materials list */}
                      <div>
                        <h5 className="font-semibold text-text-dark mb-3 text-left">
                          Study Materials
                        </h5>

                        {/* Show uploaded materials if any */}
                        {(materialsByWeek[week.id] || []).length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {(materialsByWeek[week.id] || []).map((mat, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
                              >
                                {/* Left — icon and file name */}
                                <div className="flex items-center gap-3 min-w-0">
                                  {getMaterialIcon(mat)}
                                  <span className="text-sm text-text-dark font-medium truncate">
                                    {mat.name}
                                  </span>
                                </div>
                                {/* Right — delete button */}
                                <button
                                  onClick={() => handleDeleteMaterial(week.id, idx)}
                                  className="text-gray-400 hover:text-red-500 transition flex-shrink-0 ml-3"
                                  title="Remove material"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-left mb-3">
                            No study materials added yet.
                          </p>
                        )}
                      </div>

                      {/* Assignments list header */}
                      <div>
                        <h5 className="font-semibold text-text-dark mb-3 text-left">
                          Assignments
                        </h5>
                        <p className="text-sm text-gray-400 text-left">
                          No assignments yet for this week.
                        </p>
                      </div>

                      {/* Action buttons row — Create Assignment + Add Study Material */}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {/* Primary blue button — create assignment */}
                        <a
                          href={`/teacher/course/${courseId}/week/${week.id}/create-assignment`}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition"
                        >
                          <Plus size={15} /> Create Assignment for Week {week.weekNumber}
                        </a>

                        {/* Secondary button — add study material */}
                        <button
                          onClick={() => openMaterialPanel(week.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                        >
                          <Upload size={15} /> Add Study Material
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ADD / EDIT WEEK MODAL ── */}
      {isWeekModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">

            {/* Modal header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-text-dark">
                {editingWeek ? 'Edit Week' : 'Add New Week'}
              </h3>
              <button
                onClick={() => setIsWeekModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSaveWeek} className="p-6 space-y-4">

              {/* Validation errors */}
              {weekErrors.length > 0 && (
                <div className="space-y-2">
                  {weekErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                      <p className="text-sm text-red-700">{err}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Week Number — label strictly left-aligned above input */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-1 text-left">
                  Week Number *
                </label>
                <input
                  type="number"
                  name="weekNumber"
                  value={weekFormData.weekNumber}
                  onChange={handleWeekInputChange}
                  placeholder="e.g., 1"
                  min="1"
                  max="16"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                />
              </div>

              {/* Week Title — label strictly left-aligned */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-1 text-left">
                  Week Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={weekFormData.title}
                  onChange={handleWeekInputChange}
                  placeholder="e.g., Introduction to Linked Lists"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                />
              </div>

              {/* Start Date — label strictly left-aligned */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-1 text-left">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={weekFormData.startDate}
                  onChange={handleWeekInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                />
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
                >
                  {editingWeek ? 'Update Week' : 'Add Week'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWeekModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-text-dark rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD STUDY MATERIAL MODAL ── */}
      {materialTarget !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">

            {/* Modal header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-text-dark">Add Study Material</h3>
              <button
                onClick={closeMaterialPanel}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Tab switcher — File Upload vs Video Link */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => { setMaterialTab('file'); setMaterialError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition
                    ${materialTab === 'file'
                      ? 'bg-white shadow text-primary-blue'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Upload size={15} /> File Upload
                </button>
                <button
                  type="button"
                  onClick={() => { setMaterialTab('video'); setMaterialError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition
                    ${materialTab === 'video'
                      ? 'bg-white shadow text-red-500'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Youtube size={15} /> Video Link
                </button>
              </div>

              {/* Tab 1 — File upload with drag and drop */}
              {materialTab === 'file' && (
                <div>
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    htmlFor="material-file-input"
                    className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer transition
                      ${materialFile
                        ? 'border-primary-blue bg-blue-50'
                        : 'border-gray-300 hover:border-primary-blue hover:bg-blue-50'
                      }`}
                  >
                    {materialFile ? (
                      <>
                        <FileText className="text-primary-blue mb-2" size={28} />
                        <p className="text-sm font-semibold text-text-dark px-4 text-center truncate max-w-full">
                          {materialFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(materialFile.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="text-gray-400 mb-2" size={28} />
                        <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, PPT, Word — max 20MB</p>
                      </>
                    )}
                    <input
                      id="material-file-input"
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      onChange={handleFileDrop}
                      className="hidden"
                    />
                  </label>

                  {/* Remove selected file */}
                  {materialFile && (
                    <button
                      type="button"
                      onClick={() => setMaterialFile(null)}
                      className="mt-2 text-xs text-red-500 hover:underline"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              )}

              {/* Tab 2 — YouTube video link */}
              {materialTab === 'video' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-1 text-left">
                      Video Title
                      <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="e.g., Lecture 5 — Linked Lists"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-1 text-left">
                      YouTube Link *
                    </label>
                    <div className="flex items-center gap-2">
                      <Youtube size={18} className="text-red-500 flex-shrink-0" />
                      <input
                        type="url"
                        value={videoLink}
                        onChange={(e) => { setVideoLink(e.target.value); setMaterialError(''); }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                      />
                    </div>
                  </div>

                  {/* Live thumbnail preview if valid YouTube link */}
                  {(() => {
                    const match = videoLink.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    if (!match) return null;
                    return (
                      <div className="rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={`https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`}
                          alt="Video preview"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Validation error */}
              {materialError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                  <p className="text-sm text-red-700">{materialError}</p>
                </div>
              )}

              {/* Save and Cancel buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveMaterial}
                  className="flex-1 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                >
                  Add Material
                </button>
                <button
                  type="button"
                  onClick={closeMaterialPanel}
                  className="flex-1 py-2.5 bg-gray-100 text-text-dark rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
