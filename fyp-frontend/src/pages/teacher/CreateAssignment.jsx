import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import {
  CheckCircle, AlertCircle, Loader2, Sparkles,
  ArrowLeft, Upload, FileText, X, Calendar,
  Code, FileCheck, Plus, Trash2, Edit3, Save, RefreshCw,
  Hash
} from 'lucide-react';
import {
  createAssignment,
  getCourse,
  getWeek,
  generateTestCases,
  extractAssignmentFile,
} from "../../utils/api";
 
// ─────────────────────────────────────────────
//  VALIDATION MODAL
//  Shows a list of missing required fields
// ─────────────────────────────────────────────
 
function ValidationModal({ errors, onClose }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-red-500" size={22} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Missing Required Fields</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Please fill in the following fields before creating the assignment:
        </p>
        <ul className="space-y-2 mb-6">
          {errors.map((err, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
              {err}
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition"
        >
          OK, Go Back
        </button>
      </div>
    </div>
  );
}
 
// ─────────────────────────────────────────────
//  EDITABLE TEST CASE CARD
//  Each test case can be edited inline or deleted
// ─────────────────────────────────────────────
 
function TestCaseCard({ tc, index, onChange, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ input: tc.input, expected_output: tc.expected_output });
 
  const handleSave = () => {
    onChange(index, draft);
    setIsEditing(false);
  };
 
  const handleCancel = () => {
    setDraft({ input: tc.input, expected_output: tc.expected_output });
    setIsEditing(false);
  };
 
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
 
      {/* Card header — test case number and action buttons */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Test Case #{index + 1}
        </span>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
              >
                <Edit3 size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(index)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition"
              >
                <Trash2 size={12} /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-semibold transition"
              >
                <Save size={12} /> Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-semibold transition"
              >
                <X size={12} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>
 
      {/* Card body — view mode or edit mode */}
      <div className="p-4 space-y-3">
        {!isEditing ? (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Input</p>
              <pre className="text-sm text-gray-800 bg-gray-50 rounded px-3 py-2 font-mono whitespace-pre-wrap break-all border border-gray-100">
                {tc.input || '(empty — no input required)'}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expected Output</p>
              <pre className="text-sm text-green-800 bg-green-50 rounded px-3 py-2 font-mono whitespace-pre-wrap break-all border border-green-100">
                {tc.expected_output || '(empty)'}
              </pre>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block text-left">
                Input (stdin)
              </label>
              <textarea
                value={draft.input}
                onChange={(e) => setDraft((prev) => ({ ...prev, input: e.target.value }))}
                rows={2}
                placeholder="Enter input for this test case (or leave empty)"
                className="w-full px-3 py-2 text-sm font-mono border border-blue-300 rounded focus:outline-none focus:border-blue-500 resize-none bg-blue-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block text-left">
                Expected Output (stdout)
              </label>
              <textarea
                value={draft.expected_output}
                onChange={(e) => setDraft((prev) => ({ ...prev, expected_output: e.target.value }))}
                rows={2}
                placeholder="Enter the exact expected output"
                className="w-full px-3 py-2 text-sm font-mono border border-green-300 rounded focus:outline-none focus:border-green-500 resize-none bg-green-50"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
 
// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
 
export default function CreateAssignment() {
  const { courseId, weekId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [week, setWeek] = useState(null);

  // Assignment type — 'code', 'document', or 'handwritten'
  const [assignmentType, setAssignmentType] = useState("code");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "cpp",
    sample_solution: "",
    num_test_cases: 5,
    due_date: "",
    total_marks: "", // professor sets how many marks this assignment is worth
  });

  // Test cases managed separately so teacher can review and edit before saving
  const [testCases, setTestCases] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [casesGenerated, setCasesGenerated] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Load course and week info on mount
  useEffect(() => {
    if (courseId)
      getCourse(courseId)
        .then(setCourse)
        .catch(() => {});
    if (weekId)
      getWeek(weekId)
        .then(setWeek)
        .catch(() => {});
  }, [courseId, weekId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // ── FILE HANDLERS ──

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setError("Only PDF or DOCX files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const removeFile = () => {
    setSelectedFile(null);
    const input = document.getElementById("file-input");
    if (input) input.value = "";
  };

  // ── FILE EXTRACTION ──

  const handleExtractFromFile = async () => {
    if (!selectedFile) {
      setExtractError("Please upload an assignment file first.");
      return;
    }
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);

      const result = await extractAssignmentFile(fd);

      setFormData((prev) => ({
        ...prev,
        description: result.description || prev.description,
      }));
      setExtractSuccess(true);
      setTimeout(() => setExtractSuccess(false), 3000);
    } catch (err) {
      setExtractError(
        err.message || "Failed to extract from file. Please try again.",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // ── TEST CASE GENERATION ──

  const handleGenerateTestCases = async () => {
    if (!formData.description.trim()) {
      setGenerateError(
        "Please fill in the Problem Description before generating test cases.",
      );
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const data = await generateTestCases({
        title: formData.title || "Untitled",
        description: formData.description,
        topic: "General",
        language: formData.language,
        sample_solution: formData.sample_solution,
        num_test_cases: Number(formData.num_test_cases),
      });
      setTestCases(data.test_cases);
      setCasesGenerated(true);
    } catch (err) {
      setGenerateError(
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestCaseChange = (index, updated) => {
    setTestCases((prev) => prev.map((tc, i) => (i === index ? updated : tc)));
  };

  const handleDeleteTestCase = (index) => {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTestCase = () => {
    setTestCases((prev) => [...prev, { input: "", expected_output: "" }]);
  };

  // ── FORM VALIDATION ──

  const validate = () => {
    const errors = [];
    if (!formData.title.trim()) errors.push("Assignment Title is required");
    if (!formData.description.trim())
      errors.push("Assignment Description is required");
    if (!formData.due_date) errors.push("Due Date is required");
    if (!formData.total_marks || Number(formData.total_marks) <= 0)
      errors.push("Total Marks must be a positive number");
    if (assignmentType === "code" && testCases.length === 0)
      errors.push("At least one test case must be generated or added");
    return errors;
  };

  // ── FORM SUBMIT ──

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("description", formData.description.trim());
      // Topic is sent as 'General' since we no longer ask the teacher for it
      data.append("topic", "General");
      data.append(
        "language",
        assignmentType === "document" || assignmentType === "handwritten"
          ? "N/A"
          : formData.language,
      );
      data.append("assignment_type", assignmentType);
      data.append("sample_solution", formData.sample_solution.trim());
      data.append("due_date", formData.due_date);
      data.append("total_marks", Number(formData.total_marks));
      if (courseId) data.append("course_id", parseInt(courseId));
      if (weekId) data.append("week_id", parseInt(weekId));
      if (selectedFile) data.append("file", selectedFile);

      if (assignmentType === "code") {
        data.append("test_cases", JSON.stringify(testCases));
        data.append("num_test_cases", testCases.length);
      } else {
        data.append("num_test_cases", 0);
      }

      const result = await createAssignment(data);

      setSuccess({
        assignment_id: result.assignment_id,
        title: result.title,
        assignment_type: result.assignment_type,
        test_cases_generated: result.test_cases_generated,
        test_cases: result.test_cases,
        due_date: result.due_date,
        file_path: result.file_path,
        total_marks: result.total_marks,
      });

      // Reset form after success
      setFormData({
        title: "",
        description: "",
        language: "cpp",
        sample_solution: "",
        num_test_cases: 5,
        due_date: "",
        total_marks: "",
      });
      setTestCases([]);
      setCasesGenerated(false);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message || "Failed to create assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Minimum allowed due date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const isDocument = assignmentType === "document";
  const isHandwritten = assignmentType === "handwritten";
  const isCode = assignmentType === "code";

  const handleBottomButton = (e) => {
    if (isCode && !casesGenerated) {
      e.preventDefault();
      handleGenerateTestCases();
    }
  };

  // ── TOTAL MARKS INPUT ──
  // Shared across all three assignment types — placed in the details card
  const TotalMarksField = () => (
    <div className="w-full sm:w-1/2">
      <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
        <span className="flex items-center gap-1">
          <Hash size={14} /> Total Marks *
        </span>
      </label>
      <input
        type="number"
        name="total_marks"
        value={formData.total_marks}
        onChange={handleChange}
        min={1}
        max={1000}
        placeholder="e.g., 40"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
      />
      <p className="text-xs text-gray-400 mt-1 text-left">
        Used to normalize the score out of 10 for all students.
      </p>
    </div>
  );

  return (
    <MainLayout>
      {showValidationModal && (
        <ValidationModal
          errors={validationErrors}
          onClose={() => setShowValidationModal(false)}
        />
      )}
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-blue hover:underline mb-6 font-semibold text-sm"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Page header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-text-dark mb-3">
            Create Assignment
          </h2>

          {course && (
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {course.code} — {course.title}
              </span>
              {week && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Week {week.number}: {week.title}
                </span>
              )}
            </div>
          )}

          <p className="text-gray-600">
            {isDocument
              ? "Create a document assignment — students will upload a PDF or DOCX file."
              : isHandwritten
                ? "Create a handwritten assignment — students will upload a PDF or image file."
                : "Fill in the details below, then click the button at the bottom to generate AI test cases and save."}
          </p>
        </div>

        {/* Assignment type toggle */}
        {!success && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <p className="text-sm font-semibold text-text-dark mb-3 text-left">
              Assignment Type
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType("code");
                  setError(null);
                  setTestCases([]);
                  setCasesGenerated(false);
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 font-semibold text-sm transition
                  ${
                    isCode
                      ? "border-primary-blue bg-blue-50 text-primary-blue"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
              >
                <Code size={18} /> Code Assignment
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignmentType("document");
                  setError(null);
                  setTestCases([]);
                  setCasesGenerated(false);
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 font-semibold text-sm transition
                  ${
                    isDocument
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
              >
                <FileCheck size={18} /> Document Assignment
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignmentType("handwritten");
                  setError(null);
                  setTestCases([]);
                  setCasesGenerated(false);
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 font-semibold text-sm transition
                  ${
                    isHandwritten
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
              >
                <FileText size={18} /> Handwritten Assignment
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS PANEL ── */}
        {success && (
          <div className="mb-6 p-5 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="text-green-600" size={22} />
              <p className="font-bold text-green-800 text-lg">
                Assignment Created Successfully!
              </p>
            </div>
            <p className="text-sm text-green-700 mb-1">
              <span className="font-semibold">Title:</span> {success.title}
            </p>
            <p className="text-sm text-green-700 mb-1">
              <span className="font-semibold">Type:</span>{" "}
              <span className="capitalize">{success.assignment_type}</span>
            </p>
            <p className="text-sm text-green-700 mb-1">
              <span className="font-semibold">Total Marks:</span>{" "}
              {success.total_marks}
            </p>
            <p className="text-sm text-green-700 mb-1">
              <span className="font-semibold">Assignment ID:</span>{" "}
              {success.assignment_id}
            </p>
            <p className="text-sm text-green-700 mb-1">
              <span className="font-semibold">Due Date:</span>{" "}
              {success.due_date}
            </p>

            {success.file_path && (
              <p className="text-sm text-green-700 mb-1">
                <span className="font-semibold">Instructions File: </span>
                <a
                  href={`http://localhost:8000${success.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Download
                </a>
              </p>
            )}

            {success.assignment_type === "code" &&
              success.test_cases?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-green-800 mb-3">
                    Final Test Cases ({success.test_cases.length})
                  </p>
                  <div className="space-y-2">
                    {success.test_cases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-green-200 rounded-lg p-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                              Input
                            </p>
                            <pre className="text-xs font-mono text-gray-700 bg-gray-50 rounded px-2 py-1 whitespace-pre-wrap">
                              {tc.input || "(empty)"}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                              Expected Output
                            </p>
                            <pre className="text-xs font-mono text-green-700 bg-green-50 rounded px-2 py-1 whitespace-pre-wrap">
                              {tc.expected_output || "(empty)"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {success.assignment_type === "document" && (
              <p className="text-sm text-green-700 mt-2">
                Students can now upload their PDF or DOCX submissions for this
                assignment.
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => setSuccess(null)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
              >
                Create Another
              </button>
              <button
                onClick={() => navigate(`/teacher/course/${courseId}/manage`)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
              >
                Back to Course
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle
              className="text-red-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── MAIN FORM ── */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── ASSIGNMENT DETAILS CARD ── */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
              <h3 className="text-xl font-bold text-text-dark text-left">
                Assignment Details
              </h3>

              {/* Row 1 — Title (full width) */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={
                    isDocument
                      ? "e.g., Research Report on Neural Networks"
                      : isHandwritten
                        ? "e.g., Phishing Attack Defense Mechanisms"
                        : "e.g., Linked List Implementation"
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                />
              </div>

              {/* Row 2 — Language left half (code only) */}
              {isCode && (
                <div className="w-full sm:w-1/2">
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    Language *
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                  </select>
                </div>
              )}

              {/*
                Row 3 — Due Date + Number of Test Cases (code) / Due Date + Total Marks (doc/handwritten)
                For code: 3 columns — Due Date | Test Cases | Total Marks
                For document/handwritten: 2 columns — Due Date | Total Marks
              */}
              <div
                className={`grid grid-cols-1 gap-4 ${isCode ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
              >
                {/* Due Date — shown for all types */}
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> Due Date *
                    </span>
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    min={minDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                </div>

                {/* Number of Test Cases — code only */}
                {isCode && (
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                      Number of Test Cases *
                    </label>
                    <select
                      name="num_test_cases"
                      value={formData.num_test_cases}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                    >
                      <option value={3}>3 Test Cases</option>
                      <option value={4}>4 Test Cases</option>
                      <option value={5}>5 Test Cases</option>
                      <option value={8}>8 Test Cases</option>
                      <option value={10}>10 Test Cases</option>
                    </select>
                  </div>
                )}

                {/* Total Marks — shown for all types */}
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    <span className="flex items-center gap-1">
                      <Hash size={14} /> Total Marks *
                    </span>
                  </label>
                  <input
                    type="number"
                    name="total_marks"
                    value={formData.total_marks}
                    onChange={handleChange}
                    min={1}
                    max={1000}
                    placeholder="e.g., 40"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Score will be shown as X.X / 10
                  </p>
                </div>
              </div>

              {/* Instructions file upload */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                  Instructions File
                  <span className="text-gray-400 font-normal ml-1">
                    (PDF or DOCX — students will download this)
                  </span>
                </label>

                {!selectedFile ? (
                  <label
                    htmlFor="file-input"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition"
                  >
                    <Upload className="text-gray-400 mb-2" size={28} />
                    <p className="text-sm text-gray-500">
                      Click to upload PDF or DOCX
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <FileText
                        className="text-primary-blue flex-shrink-0"
                        size={24}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-dark truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExtractFromFile}
                      disabled={isExtracting}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />{" "}
                          Extracting from file...
                        </>
                      ) : extractSuccess ? (
                        <>
                          <CheckCircle size={15} /> Description filled
                          successfully!
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} /> Auto-fill Description from File
                        </>
                      )}
                    </button>

                    {extractError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> {extractError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── AI GUIDELINES CARD (code assignments only) ── */}
            {isCode && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary-blue" size={22} />
                  <h3 className="text-xl font-bold text-text-dark">
                    AI Guidelines
                  </h3>
                </div>
                <p className="text-sm text-gray-500 text-left">
                  The more detailed your description and sample solution, the
                  more accurate the AI-generated test cases will be.
                </p>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    Problem Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the problem clearly. Include: what input the program should read, what it should compute, and what the exact output format should be."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    Expected Behavior / Sample Solution
                    <span className="text-gray-400 font-normal ml-1">
                      (Strongly recommended — improves test case quality)
                    </span>
                  </label>
                  <textarea
                    name="sample_solution"
                    value={formData.sample_solution}
                    onChange={handleChange}
                    placeholder="Paste a correct solution or describe exactly what the output should look like for various inputs."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue resize-none"
                  />
                </div>

                {generateError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {generateError}
                  </p>
                )}
              </div>
            )}

            {/* ── DOCUMENT ASSIGNMENT DESCRIPTION CARD ── */}
            {isDocument && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <FileCheck className="text-purple-600" size={22} />
                  <h3 className="text-xl font-bold text-text-dark">
                    Assignment Description
                  </h3>
                </div>
                <p className="text-sm text-gray-500 text-left">
                  Describe what students need to write about. AI will use this
                  description to grade their submitted documents.
                </p>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    Assignment Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Write a detailed report on the applications of machine learning in healthcare. Cover at least 3 real-world use cases, challenges, and future prospects."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    Grading Criteria
                    <span className="text-gray-400 font-normal ml-1">
                      (Optional — helps AI grade more accurately)
                    </span>
                  </label>
                  <textarea
                    name="sample_solution"
                    value={formData.sample_solution}
                    onChange={handleChange}
                    placeholder="e.g., Award marks for: clear introduction (20%), relevant use cases (40%), critical analysis (30%), references (10%)."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── HANDWRITTEN ASSIGNMENT DESCRIPTION CARD ── */}
            {isHandwritten && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <FileText className="text-orange-600" size={22} />
                  <h3 className="text-xl font-bold text-text-dark">
                    Assignment Description
                  </h3>
                </div>
                <p className="text-sm text-gray-500 text-left">
                  Describe the assignment. AI will use this to grade the
                  student's handwritten submission.
                </p>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    Assignment Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Write a detailed answer on the topic of phishing attacks and defense mechanisms."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2 text-left">
                    Grading Criteria
                    <span className="text-gray-400 font-normal ml-1">
                      (Optional — helps AI grade more accurately)
                    </span>
                  </label>
                  <textarea
                    name="sample_solution"
                    value={formData.sample_solution}
                    onChange={handleChange}
                    placeholder="e.g., Scenario Clarity: 5 marks. Layer Identification: 5 marks. Prevention Mechanism: 5 marks."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── EDITABLE TEST CASES SECTION (shown after generation for code assignments) ── */}
            {isCode && testCases.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-text-dark text-left">
                      Test Cases
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5 text-left">
                      Review the AI-generated test cases. You can edit, delete,
                      or add your own before saving.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold flex-shrink-0">
                    {testCases.length} case{testCases.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-5 text-xs text-amber-800">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p>
                    Always verify that <strong>Expected Output</strong> is
                    mathematically correct before saving. Incorrect expected
                    outputs will cause unfair grading.
                  </p>
                </div>

                <div className="space-y-3">
                  {testCases.map((tc, idx) => (
                    <TestCaseCard
                      key={idx}
                      tc={tc}
                      index={idx}
                      onChange={handleTestCaseChange}
                      onDelete={handleDeleteTestCase}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="mt-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 font-semibold transition w-full justify-center"
                >
                  <Plus size={16} /> Add Test Case Manually
                </button>
              </div>
            )}

            {/* ── SINGLE BOTTOM ACTION BUTTON ── */}
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-100 text-text-dark rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>

              <button
                type={isCode && !casesGenerated ? "button" : "submit"}
                onClick={handleBottomButton}
                disabled={isSubmitting || isGenerating}
                className={`px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2
                  ${
                    isSubmitting || isGenerating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : isDocument
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : isHandwritten
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "bg-primary-blue text-white hover:opacity-90"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Creating
                    Assignment...
                  </>
                ) : isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Generating
                    Test Cases...
                  </>
                ) : isDocument ? (
                  <>
                    <FileCheck size={18} /> Create Document Assignment
                  </>
                ) : isHandwritten ? (
                  <>
                    <FileText size={18} /> Create Handwritten Assignment
                  </>
                ) : casesGenerated ? (
                  <>
                    <CheckCircle size={18} /> Save Assignment with{" "}
                    {testCases.length} Test Cases
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate AI Test Cases & Save
                  </>
                )}
              </button>
            </div>

            {/* Regenerate option — shown below button only after first generation */}
            {isCode && casesGenerated && !isSubmitting && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateTestCases}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 font-semibold transition"
                >
                  <RefreshCw size={13} /> Regenerate test cases with AI
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </MainLayout>
  );
}