import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import {
  ChevronDown, ChevronUp, Plus, ArrowLeft, BookOpen,
  FileText, Layers, Loader2, AlertCircle, X, Check,
  Eye, Pencil, Trash2, Save, Users, Upload, Youtube,
  Film, File,
} from 'lucide-react';
import {
  getCourse, getCourseWeeks, getAssignmentsByCourseAndWeek,
  createWeek, deleteWeek, updateWeek, updateAssignment, deleteAssignment,
  getCourseEnrollments, getWeekMaterials,
  addWeekMaterialFile, addWeekMaterialVideo, deleteWeekMaterial,
} from '../../utils/api';


// ─────────────────────────────────────────────
//  VIEW ASSIGNMENT MODAL — read only details
// ─────────────────────────────────────────────

function ViewModal({ assignment, onClose }) {
  if (!assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">

        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Assignment Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Title</p>
            <p className="text-gray-800 font-medium">{assignment.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Type</p>
              <p className="capitalize text-gray-800">{assignment.assignment_type || 'code'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status</p>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {assignment.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Topic</p>
              <p className="text-gray-800">{assignment.topic}</p>
            </div>
            {assignment.assignment_type === 'code' && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Language</p>
                <p className="text-gray-800">
                  {assignment.language === 'cpp' ? 'C++' : assignment.language}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Due Date</p>
              <p className="text-gray-800">{assignment.due_date || 'Not set'}</p>
            </div>
            {assignment.assignment_type === 'code' && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Test Cases</p>
                <p className="text-gray-800">{assignment.num_test_cases ?? 0}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
              {assignment.description}
            </p>
          </div>
          {assignment.file_path && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Instructions File</p>
              <a
                href={`http://localhost:8000${assignment.file_path}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline text-sm"
              >
                Download File
              </a>
            </div>
          )}
        </div>

        <div className="p-5 pt-0">
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


// ─────────────────────────────────────────────
//  EDIT ASSIGNMENT MODAL
// ─────────────────────────────────────────────

function EditModal({ assignment, onClose, onSave }) {
  const isDocument = (assignment.assignment_type || 'code') !== 'code';

  const [form, setForm] = useState({
    title:           assignment.title           || '',
    description:     assignment.description     || '',
    topic:           assignment.topic           || '',
    language:        assignment.language        || '',
    due_date:        assignment.due_date        || '',
    status:          assignment.status          || 'ready',
    sample_solution: assignment.sample_solution || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim())       { setError('Title is required.');       return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    if (!form.due_date)           { setError('Due date is required.');    return; }
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('title',           form.title.trim());
      data.append('description',     form.description.trim());
      data.append('topic',           form.topic);
      data.append('language',        form.language);
      data.append('due_date',        form.due_date);
      data.append('status',          form.status);
      data.append('sample_solution', form.sample_solution.trim());
      await onSave(assignment.id, data);
    } catch (err) {
      setError(err.message || 'Failed to update assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Edit Assignment</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 text-left">Title *</label>
            <input
              name="title" value={form.title} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 text-left">Description *</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className={`grid gap-3 ${(assignment.assignment_type || 'code') === 'code' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 text-left">Topic</label>
              <select
                name="topic" value={form.topic} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="PF">PF</option>
                <option value="OOP">OOP</option>
                <option value="DSA">DSA</option>
                <option value="ML">ML</option>
                <option value="OS">OS</option>
                <option value="DB">DB</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {(assignment.assignment_type || 'code') === 'code' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 text-left">Language</label>
                <select
                  name="language" value={form.language} onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 text-left">Due Date *</label>
              <input
                type="date" name="due_date" value={form.due_date} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 text-left">Status</label>
              <select
                name="status" value={form.status} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="ready">Ready</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 text-left">
              {isDocument ? 'Grading Criteria' : 'Sample Solution'}
            </label>
            <textarea
              name="sample_solution" value={form.sample_solution} onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
//  DELETE ASSIGNMENT MODAL — confirmation
// ─────────────────────────────────────────────

function DeleteModal({ assignment, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(assignment.id);
    } catch (err) {
      setError(err.message || 'Failed to delete assignment.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="text-red-500" size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Delete Assignment?</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Are you sure you want to delete{' '}
          <span className="font-semibold">"{assignment.title}"</span>? This cannot be undone.
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Note: Assignments with student submissions cannot be deleted.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Yes, Delete
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
//  ENROLLED STUDENTS MODAL
// ─────────────────────────────────────────────

function EnrolledStudentsModal({ courseId, courseName, courseCode, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    getCourseEnrollments(courseId)
      .then(setStudents)
      .catch(() => setError('Failed to load enrolled students.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-primary-blue" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enrolled Students</h3>
              <p className="text-xs text-gray-500 mt-0.5">{courseCode} — {courseName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-primary-blue" size={28} />
              <p className="text-gray-500 text-sm font-medium">Loading students...</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}
          {!loading && !error && students.length === 0 && (
            <div className="text-center py-16">
              <Users className="mx-auto text-gray-200 mb-3" size={48} />
              <p className="text-gray-500 font-medium">No students enrolled yet.</p>
            </div>
          )}
          {!loading && !error && students.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold rounded-lg">
                  {students.length} Student{students.length !== 1 ? 's' : ''} Enrolled
                </span>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <p className="col-span-1 text-xs font-bold text-gray-500 uppercase">#</p>
                  <p className="col-span-7 text-xs font-bold text-gray-500 uppercase">Student Name</p>
                  <p className="col-span-4 text-xs font-bold text-gray-500 uppercase">Student ID</p>
                </div>
                {students.map((student, idx) => (
                  <div
                    key={student.student_id}
                    className={`grid grid-cols-12 items-center px-4 py-3.5 border-b border-gray-100 last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <div className="col-span-1">
                      <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                    </div>
                    <div className="col-span-7 flex items-center gap-2.5">
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

        <div className="px-5 py-4 border-t border-gray-100">
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


// ─────────────────────────────────────────────
//  ADD STUDY MATERIAL MODAL
//  Two tabs: File Upload and YouTube Video Link
//  On save it calls the real API and updates the list
// ─────────────────────────────────────────────

function StudyMaterialModal({ week, onClose, onSaved }) {
  const [tab, setTab]               = useState('file');
  const [file, setFile]             = useState(null);
  const [videoLink, setVideoLink]   = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleFilePick = (e) => {
    const picked = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!picked) return;
    const ext = picked.name.split('.').pop().toLowerCase();
    if (!['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(ext)) {
      setError('Only PDF, PPT, or Word files are allowed.');
      return;
    }
    if (picked.size > 20 * 1024 * 1024) {
      setError('File must be under 20MB.');
      return;
    }
    setFile(picked);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();

      if (tab === 'file') {
        if (!file) { setError('Please select a file.'); setLoading(false); return; }
        formData.append('type', 'file');
        formData.append('name', file.name);
        formData.append('file', file);
        await addWeekMaterialFile(week.id, formData);

      } else {
        if (!videoLink.trim()) { setError('Please enter a YouTube link.'); setLoading(false); return; }

        // Extract the YouTube video ID and build the embed URL
        const match = videoLink.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const embedUrl = match
          ? `https://www.youtube.com/embed/${match[1]}`
          : videoLink.trim();

        formData.append('type', 'video');
        formData.append('name', videoTitle.trim() || 'YouTube Video');
        formData.append('url', embedUrl);
        await addWeekMaterialVideo(week.id, formData);
      }

      // Tell the parent to refresh the materials list for this week
      await onSaved(week.id);
      onClose();

    } catch (err) {
      setError(err.message || 'Failed to save material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pull YouTube video ID just for the thumbnail preview
  const ytMatch = videoLink.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add Study Material</h3>
            <p className="text-xs text-gray-500 mt-0.5">Week {week.number} — {week.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setTab('file'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition
                ${tab === 'file' ? 'bg-white shadow text-primary-blue' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Upload size={14} /> File Upload
            </button>
            <button
              type="button"
              onClick={() => { setTab('video'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition
                ${tab === 'video' ? 'bg-white shadow text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Youtube size={14} /> Video Link
            </button>
          </div>

          {/* Tab 1 — drag and drop file upload */}
          {tab === 'file' && (
            <div>
              <label
                htmlFor="material-file"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFilePick(e); }}
                className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer transition
                  ${file ? 'border-primary-blue bg-blue-50' : 'border-gray-300 hover:border-primary-blue hover:bg-blue-50'}`}
              >
                {file ? (
                  <>
                    <FileText className="text-primary-blue mb-2" size={28} />
                    <p className="text-sm font-semibold text-text-dark px-4 text-center truncate max-w-full">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={28} />
                    <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, PPT, Word — max 20MB</p>
                  </>
                )}
                <input
                  id="material-file" type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFilePick}
                  className="hidden"
                />
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-2 text-xs text-red-500 hover:underline"
                >
                  Remove file
                </button>
              )}
            </div>
          )}

          {/* Tab 2 — YouTube link with live thumbnail preview */}
          {tab === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-1 text-left">
                  Video Title <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Lecture 5 — Linked Lists"
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
                    onChange={(e) => { setVideoLink(e.target.value); setError(''); }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue text-sm"
                  />
                </div>
              </div>
              {/* Live thumbnail preview — shows as soon as a valid YouTube URL is pasted */}
              {ytMatch && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`}
                    alt="Video preview"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Validation / API error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-500 flex-shrink-0" size={15} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {loading ? 'Saving...' : 'Add Material'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-gray-100 text-text-dark rounded-lg font-semibold hover:bg-gray-200 transition text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────

export default function TeacherCourseManager() {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course, setCourse]           = useState(null);
  const [weeks, setWeeks]             = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Which modal is open
  const [viewTarget, setViewTarget]     = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showEnrolled, setShowEnrolled] = useState(false);

  // Which week's "Add Study Material" modal is open (stores the week object)
  const [materialWeek, setMaterialWeek] = useState(null);

  // Materials stored per week — { weekId: [ { id, type, name, url } ] }
  // This is loaded from the API, not local state anymore
  const [materialsByWeek, setMaterialsByWeek] = useState({});
  const [materialsLoading, setMaterialsLoading] = useState({});

  // Success toast
  const [successMsg, setSuccessMsg] = useState('');

  // Week creation inline form
  const [showWeekForm, setShowWeekForm]       = useState(false);
  const [weekForm, setWeekForm]               = useState({ number: '', title: '', start_date: '' });
  const [weekFormError, setWeekFormError]     = useState('');
  const [weekFormLoading, setWeekFormLoading] = useState(false);
  const [weekFormSuccess, setWeekFormSuccess] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);

  // Load course, weeks, and assignments on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [courseData, weeksData] = await Promise.all([
          getCourse(courseId),
          getCourseWeeks(courseId),
        ]);
        setCourse(courseData);
        setWeeks(weeksData);
        const assignmentsData = await getAssignmentsByCourseAndWeek(courseId);
        setAssignments(assignmentsData);
      } catch {
        setError('Failed to load course data. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [courseId]);

  // Load materials for a week from the API
  const loadMaterials = async (weekId) => {
    setMaterialsLoading((prev) => ({ ...prev, [weekId]: true }));
    try {
      const data = await getWeekMaterials(weekId);
      setMaterialsByWeek((prev) => ({ ...prev, [weekId]: data }));
    } catch {
      // If materials fail to load, just show empty — not a fatal error
      setMaterialsByWeek((prev) => ({ ...prev, [weekId]: [] }));
    } finally {
      setMaterialsLoading((prev) => ({ ...prev, [weekId]: false }));
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getWeekAssignments = (weekId) =>
    assignments.filter((a) => String(a.week_id) === String(weekId));

  // Toggle week open/closed — load materials the first time a week is opened
  const toggleWeek = (weekId) => {
    const isCurrentlyOpen = expandedWeeks[weekId];
    setExpandedWeeks((prev) => ({ ...prev, [weekId]: !prev[weekId] }));

    // Load materials only when opening and not already loaded
    if (!isCurrentlyOpen && materialsByWeek[weekId] === undefined) {
      loadMaterials(weekId);
    }
  };

  const handleEditSave = async (assignmentId, formData) => {
    await updateAssignment(assignmentId, formData);
    const updated = await getAssignmentsByCourseAndWeek(courseId);
    setAssignments(updated);
    setEditTarget(null);
    showSuccess('Assignment updated successfully!');
  };

  const handleDeleteConfirm = async (assignmentId) => {
    await deleteAssignment(assignmentId);
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    setDeleteTarget(null);
    showSuccess('Assignment deleted successfully!');
  };

  // Create week — only asks for number, title, start_date
  const handleCreateWeek = async () => {
    setWeekFormError("");
    if (!weekForm.number || !weekForm.title.trim()) {
      setWeekFormError("Week number and title are required.");
      return;
    }
    setWeekFormLoading(true);
    try {
      if (editingWeek) {
        // Edit existing week
        const formData = new FormData();
        formData.append("title", weekForm.title.trim());
        formData.append("start_date", weekForm.start_date || "");
        await updateWeek(editingWeek.id, {
          title: weekForm.title.trim(),
          start_date: weekForm.start_date || null,
        }); // reuse update endpoint? No — use updateWeek

        // Refresh weeks list
        const updated = await getCourseWeeks(courseId);
        setWeeks(updated);
        setEditingWeek(null);
      } else {
        // Create new week
        const newWeek = await createWeek(parseInt(courseId), {
          number: parseInt(weekForm.number),
          title: weekForm.title.trim(),
          start_date: weekForm.start_date || null,
          lessons: [],
        });
        setWeeks((prev) =>
          [...prev, newWeek].sort((a, b) => a.number - b.number),
        );
      }
      setWeekForm({ number: "", title: "", start_date: "" });
      setWeekFormSuccess(true);
      setTimeout(() => {
        setWeekFormSuccess(false);
        setShowWeekForm(false);
      }, 1500);
    } catch {
      setWeekFormError("Failed to save week. Please try again.");
    } finally {
      setWeekFormLoading(false);
    }
  };

  // Delete a week — calls real API, also removes its materials from local state
  const handleDeleteWeek = async (week) => {
    if (!window.confirm(`Delete Week ${week.number}: "${week.title}"?\n\nThis will also delete all study materials for this week.`)) return;
    try {
      await deleteWeek(week.id);
      setWeeks((prev) => prev.filter((w) => w.id !== week.id));
      setMaterialsByWeek((prev) => {
        const updated = { ...prev };
        delete updated[week.id];
        return updated;
      });
      showSuccess('Week deleted successfully!');
    } catch (err) {
      showSuccess(`Error: ${err.message}`);
    }
  };

  // Called by the modal after a material is saved — refreshes the list from the API
  const handleMaterialSaved = async (weekId) => {
    await loadMaterials(weekId);
    showSuccess('Study material added!');
  };

  // Delete a material — calls real API then refreshes the list
  const handleDeleteMaterial = async (weekId, materialId) => {
    try {
      await deleteWeekMaterial(materialId);
      await loadMaterials(weekId);
      showSuccess('Material removed.');
    } catch (err) {
      showSuccess(`Error: ${err.message}`);
    }
  };

  // Return the right icon based on material type or file extension
  const getMaterialIcon = (mat) => {
    if (mat.type === 'video') return <Film size={15} className="text-red-500 flex-shrink-0" />;
    const ext = mat.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText size={15} className="text-red-400 flex-shrink-0" />;
    if (['ppt', 'pptx'].includes(ext)) return <File size={15} className="text-orange-400 flex-shrink-0" />;
    return <File size={15} className="text-blue-400 flex-shrink-0" />;
  };

  const getTopicBadge = (topic) => {
    const map = {
      DSA: 'bg-purple-100 text-purple-700',
      OOP: 'bg-orange-100 text-orange-700',
      PF:  'bg-teal-100 text-teal-700',
    };
    return map[topic] || 'bg-gray-100 text-gray-700';
  };

  const getTypeBadge = (assignment) => {
    const type = assignment.assignment_type || 'code';
    if (type === 'document')    return { label: 'Document',    className: 'bg-purple-100 text-purple-700' };
    if (type === 'handwritten') return { label: 'Handwritten', className: 'bg-orange-100 text-orange-700' };
    return { label: assignment.language === 'cpp' ? 'C++' : 'Python', className: 'bg-blue-100 text-blue-700' };
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <Loader2 className="animate-spin text-primary-blue" size={48} />
          <p className="text-gray-600 font-medium">Loading course data...</p>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <AlertCircle className="text-red-500" size={48} />
          <p className="text-red-600 font-medium">{error || 'Course not found.'}</p>
          <button
            onClick={() => navigate('/teacher/courses')}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition"
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
          onClick={() => navigate("/teacher/courses")}
          className="flex items-center gap-2 text-primary-blue hover:underline mb-6 font-semibold text-sm"
        >
          <ArrowLeft size={18} /> Back to My Courses
        </button>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex items-center gap-3">
            <Check className="text-green-600 flex-shrink-0" size={20} />
            <p className="font-semibold text-green-800">{successMsg}</p>
          </div>
        )}

        {/* Course header banner */}
        <div className="bg-gradient-to-r from-primary-blue to-blue-700 text-white rounded-xl p-5 sm:p-8 mb-8">
          <p className="text-sm font-semibold opacity-90 mb-1 text-left">
            {course.code} • {course.semester} • {course.credit_hours} Credit
            Hours
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-left">
            {course.title}
          </h2>
          <p className="opacity-80 mb-5 text-left leading-relaxed text-sm sm:text-base">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1.5 rounded-full">
              <FileText size={14} />
              <span className="text-sm font-semibold">
                {assignments.length} Assignment
                {assignments.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={() => setShowEnrolled(true)}
              className="inline-flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 rounded-full transition"
            >
              <Users size={14} />
              <span className="text-sm font-semibold">
                View Enrolled Students
              </span>
            </button>
          </div>
        </div>

        {/* Section header — weeks list + add week button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-text-dark">
              Course Weeks
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Expand a week to view or manage assignments.
            </p>
          </div>
          <button
            onClick={() => {
              setShowWeekForm(true);
              setWeekFormError("");
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition text-sm"
          >
            <Plus size={16} />{" "}
            <span className="hidden sm:inline">Add Week</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Inline week creation form */}
        {showWeekForm && (
          <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-text-dark">
                {editingWeek ? "Edit Week" : "Create New Week"}
              </h4>
              <button
                onClick={() => {
                  setShowWeekForm(false);
                  setWeekFormError("");
                  setEditingWeek(null);
                }}
              >
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 text-left">
                  Week Number *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={weekForm.number}
                  onChange={(e) =>
                    setWeekForm({ ...weekForm, number: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 text-left">
                  Week Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to OOP"
                  value={weekForm.title}
                  onChange={(e) =>
                    setWeekForm({ ...weekForm, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 text-left">
                  Start Date{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={weekForm.start_date}
                  onChange={(e) =>
                    setWeekForm({ ...weekForm, start_date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
            </div>

            {weekFormError && (
              <p className="text-red-500 text-sm mt-3">{weekFormError}</p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCreateWeek}
                disabled={weekFormLoading || weekFormSuccess}
                className="flex items-center gap-2 px-5 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition text-sm disabled:opacity-60"
              >
                {weekFormLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : weekFormSuccess ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {weekFormLoading
                  ? editingWeek
                    ? "Updating..."
                    : "Creating..."
                  : weekFormSuccess
                    ? editingWeek
                      ? "Updated!"
                      : "Created!"
                    : editingWeek
                      ? "Update Week"
                      : "Create Week"}
              </button>
              <button
                onClick={() => {
                  setShowWeekForm(false);
                  setWeekFormError("");
                  setEditingWeek(null);
                }}
                className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Weeks list */}
        {weeks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">
              No weeks found. Use "Add Week" to create your first week.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {weeks.map((week) => {
              const weekAssignments = getWeekAssignments(week.id);
              const weekMaterials = materialsByWeek[week.id] || [];
              const isLoadingMats = materialsLoading[week.id];

              return (
                <div
                  key={week.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Week header row */}
                  <div
                    onClick={() => toggleWeek(week.id)}
                    className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
                  >
                    {/* Left — number badge and title */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-blue text-white rounded-lg flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                        {week.number}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-dark text-left truncate text-sm sm:text-base">
                          {week.title}
                        </p>
                        {week.start_date && (
                          <p className="text-xs text-gray-500 text-left">
                            Starts: {week.start_date}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right — edit icon, delete icon, assignment count badge, chevron */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {/* Edit week button — does NOT toggle the accordion */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWeek(week);
                          setWeekForm({
                            number: String(week.number),
                            title: week.title,
                            start_date: week.start_date || "",
                          });
                          setShowWeekForm(true);
                          setWeekFormError("");
                        }}
                        className="p-2 text-gray-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition"
                        title="Edit week"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Delete week button — does NOT toggle the accordion */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWeek(week);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete week"
                      >
                        <Trash2 size={15} />
                      </button>

                      {/* Assignment count badge */}
                      {weekAssignments.length > 0 && (
                        <span className="px-2 py-1 bg-primary-blue text-white text-xs font-bold rounded-full ml-1">
                          {weekAssignments.length}
                        </span>
                      )}

                      {/* Expand / collapse arrow */}
                      {expandedWeeks[week.id] ? (
                        <ChevronUp className="text-gray-400 ml-1" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400 ml-1" size={20} />
                      )}
                    </div>
                  </div>

                  {/* Expanded week body */}
                  {expandedWeeks[week.id] && (
                    <div className="px-4 sm:px-6 pb-6 pt-4 bg-gray-50 border-t border-gray-100 space-y-5">
                      {/* Study materials section */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3 text-left">
                          Study Materials
                        </p>

                        {/* Loading spinner while materials are being fetched */}
                        {isLoadingMats ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2
                              size={14}
                              className="animate-spin text-gray-400"
                            />
                            <span className="text-sm text-gray-400">
                              Loading materials...
                            </span>
                          </div>
                        ) : weekMaterials.length > 0 ? (
                          <div className="space-y-2 mb-2">
                            {weekMaterials.map((mat) => (
                              <div
                                key={mat.id}
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
                              >
                                {/* Left — icon and name */}
                                <div className="flex items-center gap-3 min-w-0">
                                  {getMaterialIcon(mat)}
                                  {/* File opens in new tab, video opens its embed URL */}
                                  {mat.type === "file" ? (
                                    <a
                                      href={`http://localhost:8000${mat.url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-blue-600 font-medium truncate hover:underline"
                                    >
                                      {mat.name}
                                    </a>
                                  ) : (
                                    <a
                                      href={mat.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-blue-600 font-medium truncate hover:underline"
                                    >
                                      {mat.name}
                                    </a>
                                  )}
                                </div>
                                {/* Right — delete button */}
                                <button
                                  onClick={() =>
                                    handleDeleteMaterial(week.id, mat.id)
                                  }
                                  className="text-gray-400 hover:text-red-500 transition flex-shrink-0 ml-3 p-1"
                                  title="Remove material"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 text-left mb-2">
                            No study materials added yet.
                          </p>
                        )}
                      </div>

                      {/* Assignments section */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3 text-left">
                          Assignments ({weekAssignments.length})
                        </p>

                        {weekAssignments.length > 0 ? (
                          <div className="space-y-3">
                            {weekAssignments.map((assignment) => {
                              const typeBadge = getTypeBadge(assignment);
                              return (
                                <div
                                  key={assignment.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                >
                                  {/* Assignment info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-semibold ${getTopicBadge(assignment.topic)}`}
                                      >
                                        {assignment.topic}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs font-semibold ${typeBadge.className}`}
                                      >
                                        {typeBadge.label}
                                      </span>
                                      {(assignment.assignment_type ||
                                        "code") === "code" &&
                                        assignment.num_test_cases > 0 && (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                            {assignment.num_test_cases} test
                                            cases
                                          </span>
                                        )}
                                      {assignment.due_date && (
                                        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">
                                          Due: {assignment.due_date}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-semibold text-text-dark text-sm text-left truncate">
                                      {assignment.title}
                                    </p>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => setViewTarget(assignment)}
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                                    >
                                      <Eye size={13} /> View
                                    </button>
                                    <button
                                      onClick={() => setEditTarget(assignment)}
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                                    >
                                      <Pencil size={13} /> Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteTarget(assignment)
                                      }
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                                    >
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 bg-white border border-dashed border-gray-300 rounded-lg text-center">
                            <Layers
                              className="mx-auto text-gray-300 mb-2"
                              size={28}
                            />
                            <p className="text-sm text-gray-400">
                              No assignments yet for this week.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons row */}
                      <div className="flex flex-wrap gap-3 pt-1">
                        <button
                          onClick={() =>
                            navigate(
                              `/teacher/course/${courseId}/week/${week.id}/create-assignment`,
                            )
                          }
                          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition text-sm"
                        >
                          <Plus size={15} />
                          <span className="hidden sm:inline">
                            Create Assignment for Week {week.number}
                          </span>
                          <span className="sm:hidden">Create Assignment</span>
                        </button>

                        <button
                          onClick={() => setMaterialWeek(week)}
                          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
                        >
                          <Upload size={15} /> Add Study Material
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* All modals */}
        {viewTarget && (
          <ViewModal
            assignment={viewTarget}
            onClose={() => setViewTarget(null)}
          />
        )}
        {editTarget && (
          <EditModal
            assignment={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={handleEditSave}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            assignment={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirm}
          />
        )}
        {showEnrolled && (
          <EnrolledStudentsModal
            courseId={courseId}
            courseName={course.title}
            courseCode={course.code}
            onClose={() => setShowEnrolled(false)}
          />
        )}
        {materialWeek && (
          <StudyMaterialModal
            week={materialWeek}
            onClose={() => setMaterialWeek(null)}
            onSaved={handleMaterialSaved}
          />
        )}
      </div>
    </MainLayout>
  );
}
