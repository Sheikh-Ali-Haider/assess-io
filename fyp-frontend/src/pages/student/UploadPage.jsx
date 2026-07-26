import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAssignment,
  submitCode,
  submitDocument,
  submitHandwritten,
  pollResult,
  getHistory,
} from '../../utils/api';
import { MainLayout } from '../../layout/MainLayout';
import {
  Upload, AlertCircle, FileIcon, Loader2,
  CheckCircle, FileText, ArrowLeft, Code
} from 'lucide-react';

export default function UploadPage() {
  const navigate         = useNavigate();
  const { user }         = useAuth();
  const fileInputRef     = useRef(null);
  const { assignmentId } = useParams();

  const [assignment, setAssignment]   = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive]   = useState(false);

  // Whether this student already submitted this assignment
  const [alreadySubmitted, setAlreadySubmitted]         = useState(false);
  const [existingSubmissionId, setExistingSubmissionId] = useState(null);

  // Page load state
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Submit flow — idle | submitting | polling | done | error
  const [submitState, setSubmitState] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [pollStatus, setPollStatus]   = useState('');

  // Fetch this specific assignment and check submission history on mount
  useEffect(() => {
    if (!assignmentId) {
      setLoadError('No assignment selected. Please go back and try again.');
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        // Fetch just this one assignment + student history at the same time
        const [assignmentData, history] = await Promise.all([
          getAssignment(assignmentId),
          getHistory(user.id),
        ]);

        setAssignment(assignmentData);

        // Check if student already has a completed submission for this assignment
        const existing = history.find(
          (s) =>
            String(s.assignment_id) === String(assignmentId) &&
            s.status === 'completed'
        );
        if (existing) {
          setAlreadySubmitted(true);
          setExistingSubmissionId(existing.submission_id || existing.id);
        }

      } catch (err) {
        setLoadError('Could not load assignment. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [assignmentId, user.id]);

  // Whether this is a document-type assignment
  const assignmentType = assignment?.assignment_type || "code";
  const isDoc = assignmentType === "document";
  const isHandwritten = assignmentType === "handwritten";
  const isCode = assignmentType === "code";

  // ── DRAG AND DROP HANDLERS ──

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // Validate file type and size based on assignment type
  const handleFile = (file) => {
    setSubmitError('');

    if (isDoc) {
      // Document assignments accept PDF and Word files only
      const allowed = ['.pdf', '.docx', '.doc'];
      const valid   = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!valid) {
        setSubmitError('Invalid file type. Allowed: .pdf, .docx, .doc');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setSubmitError('File is too large. Maximum size is 20MB.');
        return;
      }
      // Keep the raw File object — sent as multipart to backend
      setUploadedFile(file);
    } else if (isHandwritten) {
      const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
      const valid = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!valid) {
        setSubmitError('Invalid file type. Allowed: .pdf, .jpg, .jpeg, .png');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setSubmitError('File is too large. Maximum size is 20MB.');
        return;
      }
      setUploadedFile(file);
    } else {
      // Code assignments accept .py or .cpp/.cc/.c
      const lang    = assignment?.language || 'python';
      const allowed = lang === 'python' ? ['.py'] : ['.cpp', '.cc', '.c'];
      const valid   = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!valid) {
        setSubmitError(`Invalid file type. For ${lang}, allowed: ${allowed.join(', ')}`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError('File is too large. Maximum size is 10MB.');
        return;
      }
      setUploadedFile(file);
    }
  };

  // ── SUBMIT HANDLER ──

  const handleSubmit = async () => {
    if (!uploadedFile) {
      setSubmitError('Please upload a file before submitting.');
      return;
    }

    setSubmitError('');
    setSubmitState('submitting');

    try {
      let sid;

      if (isDoc) {
        // Document submission — send as multipart/form-data
        const formData = new FormData();
        formData.append('student_id',    String(user.id));
        formData.append('assignment_id', String(assignment.id));
        formData.append('file',          uploadedFile);

        setPollStatus('Uploading document...');
        const result = await submitDocument(formData);
        sid = result.submission_id;

        setSubmitState('polling');
        setPollStatus('Document uploaded! AI is grading your submission...');
      } else if (isHandwritten) {
        const formData = new FormData();
        formData.append('student_id', String(user.id));
        formData.append('assignment_id', String(assignment.id));
        formData.append('file', uploadedFile);

        setPollStatus('Uploading handwritten assignment...');
        const result = await submitHandwritten(formData);
        sid = result.submission_id;

        setSubmitState('polling');
        setPollStatus('Assignment uploaded! AI is grading your submission...');
      } else {
        // Code submission — read file as text then send as JSON
        const sourceCode = await readFileAsText(uploadedFile);
        const result     = await submitCode({
          student_id:    String(user.id),
          assignment_id: assignment.id,
          language:      assignment.language,
          source_code:   sourceCode,
        });
        sid = result.submission_id;

        setSubmitState('polling');
        setPollStatus('Code submitted! Running in secure sandbox...');
      }

      // Poll every 2 seconds until result is ready
      await pollResult(sid, (update) => {
        if (update.status === 'processing') {
          setPollStatus(
            isDoc
              ? "AI is analyzing your document..."
              : isHandwritten
              ? "AI is grading your handwritten assignment..."
              : "Running test cases...",
          );
        } else if (update.status === 'pending') {
          setPollStatus('Queued — waiting for worker...');
        }
      });

      setSubmitState('done');
      navigate(`/student/results/submission/${sid}`);

    } catch (err) {
      setSubmitState('error');
      setSubmitError(err.message || 'Submission failed. Please try again.');
    }
  };

  // Helper — read a file and return its text content as a promise
  const readFileAsText = (file) =>
    new Promise((resolve, reject) => {
      const reader   = new FileReader();
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });

  const isSubmitting = submitState === 'submitting' || submitState === 'polling';

  const acceptAttr = isDoc
    ? '.pdf,.docx,.doc'
    : isHandwritten
    ? '.pdf,.jpg,.jpeg,.png' 
    : assignment?.language === 'python'
    ? '.py'
    : '.cpp,.cc,.c';

  const acceptLabel = isDoc
    ? '.pdf, .docx, .doc • Max 20MB'
    : isHandwritten
    ? '.pdf, .jpg, .jpeg, .png • Max 20MB'  
    : assignment?.language === 'python'
    ? '.py files only • Max 10MB'
    : '.cpp / .cc / .c files only • Max 10MB';

  // ── LOADING STATE ──
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <Loader2 className="animate-spin text-primary-blue" size={48} />
          <p className="text-gray-600 font-medium">Loading assignment...</p>
        </div>
      </MainLayout>
    );
  }

  // ── ERROR STATE ──
  if (loadError || !assignment) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <AlertCircle className="text-red-500" size={48} />
          <p className="text-red-600 font-medium">
            {loadError || 'Assignment not found.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Go Back
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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-blue hover:underline mb-6 font-semibold transition"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-text-dark mb-1">
            Submit Assignment
          </h2>
          <p className="text-gray-500 text-sm">
            {isDoc
              ? "Upload your document and submit for AI grading."
              : isHandwritten
                ? "Upload your handwritten assignment for AI grading."
                : "Upload your code file and submit for AI evaluation."}
          </p>
        </div>

        {/* Assignment info card — read only, replaces the old dropdown */}
        <div
          className={`rounded-lg border p-5 mb-6 ${
            isDoc
              ? "bg-purple-50 border-purple-200"
              : isHandwritten
                ? "bg-orange-50 border-orange-200"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {isDoc ? (
              <FileText
                className="text-purple-600 flex-shrink-0 mt-1"
                size={22}
              />
            ) : isHandwritten ? (
              <FileText
                className="text-orange-600 flex-shrink-0 mt-1"
                size={22}
              />
            ) : (
              <Code
                className="text-primary-blue flex-shrink-0 mt-1"
                size={22}
              />
            )}
            <div className="flex-1">
              <h3
                className={`font-bold text-lg mb-1 ${
                  isDoc
                    ? "text-purple-900"
                    : isHandwritten
                      ? "text-orange-900"
                      : "text-blue-900"
                }`}
              >
                {assignment.title}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <span
                  className={
                    isDoc
                      ? "text-purple-700"
                      : isHandwritten
                        ? "text-orange-700"
                        : "text-blue-700"
                  }
                >
                  <span className="font-semibold">Topic:</span>{" "}
                  {assignment.topic}
                </span>
                <span
                  className={
                    isDoc
                      ? "text-purple-700"
                      : isHandwritten
                        ? "text-orange-700"
                        : "text-blue-700"
                  }
                >
                  <span className="font-semibold">Type:</span>{" "}
                  {isDoc ? "Document" : isHandwritten ? "Handwritten" : "Code"}
                </span>
                {isCode && (
                  <>
                    <span className="text-blue-700">
                      <span className="font-semibold">Language:</span>{" "}
                      {assignment.language === "cpp" ? "C++" : "Python"}
                    </span>
                    <span className="text-blue-700">
                      <span className="font-semibold">Test Cases:</span>{" "}
                      {assignment.num_test_cases}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Already submitted banner — blocks resubmission */}
        {alreadySubmitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle
              className="text-green-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Already Submitted</p>
              <p className="text-sm text-green-700 mb-2">
                You have already submitted this assignment and received
                feedback. Resubmission is not allowed.
              </p>
              {existingSubmissionId && (
                <button
                  onClick={() =>
                    navigate(
                      `/student/results/submission/${existingSubmissionId}`,
                    )
                  }
                  className="text-sm font-semibold text-green-700 underline hover:text-green-900"
                >
                  View your result →
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT — Context info panel ── */}
          <div className="lg:col-span-1">
            <div
              className={`rounded-lg border p-5 text-sm ${
                isDoc
                  ? "bg-purple-50 border-purple-200 text-purple-700"
                  : isHandwritten
                    ? "bg-orange-50 border-orange-200 text-orange-700"
                    : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              {isDoc ? (
                <>
                  <p className="font-semibold text-purple-800 mb-2">
                    AI Document Grading
                  </p>
                  <p>
                    Your document will be analyzed for content quality,
                    relevance, clarity of writing, and completeness. You will
                    receive a score out of 100 with detailed feedback and
                    suggestions.
                  </p>
                </>
              ) : isHandwritten ? (
                <>
                  <p className="font-semibold text-orange-800 mb-2">
                    AI Handwritten Grading
                  </p>
                  <p>
                    Your handwritten assignment will be read and graded by AI
                    based on content, accuracy, and the assignment criteria. You
                    will receive a score with detailed feedback.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-700 mb-2">
                    Secure Sandbox Execution
                  </p>
                  <p>
                    Your code runs in an isolated Docker container with no
                    network access, 128MB memory limit, and a 10-second timeout
                    per test case. Results include AI feedback on complexity,
                    readability, and improvement suggestions.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT — Upload zone + Submit button ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Drag and drop upload zone */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-text-dark mb-4">
                {isDoc
                  ? "Upload Document"
                  : isHandwritten
                    ? "Upload Handwritten Assignment"
                    : "Upload Code File"}
              </h3>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                  !alreadySubmitted && fileInputRef.current?.click()
                }
                className={`p-8 rounded-lg border-2 border-dashed transition-all ${
                  alreadySubmitted
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                    : dragActive
                      ? isDoc
                        ? "border-purple-500 bg-purple-50"
                        : isHandwritten
                          ? "border-orange-500 bg-orange-50"
                          : "border-primary-blue bg-blue-50"
                      : isDoc
                        ? "border-gray-300 bg-gray-50 hover:border-purple-500 hover:bg-purple-50 cursor-pointer"
                        : isHandwritten
                          ? "border-gray-300 bg-gray-50 hover:border-orange-500 hover:bg-orange-50 cursor-pointer"
                          : "border-gray-300 bg-gray-50 hover:border-primary-blue hover:bg-blue-50 cursor-pointer"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptAttr}
                  onChange={handleFileInput}
                  disabled={alreadySubmitted}
                  className="hidden"
                />

                {/* Show file info if uploaded, otherwise show upload prompt */}
                {uploadedFile ? (
                  <div className="text-center">
                    {isDoc ? (
                      <FileText
                        className="mx-auto mb-2 text-purple-600"
                        size={36}
                      />
                    ) : isHandwritten ? (
                      <FileText
                        className="mx-auto mb-2 text-orange-600"
                        size={36}
                      />
                    ) : (
                      <FileIcon
                        className="mx-auto mb-2 text-primary-blue"
                        size={36}
                      />
                    )}
                    <p className="font-semibold text-text-dark">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    {!alreadySubmitted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setSubmitError("");
                        }}
                        className="mt-2 text-xs text-red-500 hover:underline"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload
                      className={`mx-auto mb-3 ${
                        isDoc
                          ? "text-purple-500"
                          : isHandwritten
                            ? "text-orange-500"
                            : "text-primary-blue"
                      }`}
                      size={36}
                    />
                    <p className="font-semibold text-text-dark">
                      Drag and drop or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{acceptLabel}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submission error */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Polling status while waiting for result */}
            {isSubmitting && (
              <div
                className={`p-4 border rounded-lg flex items-center gap-3 ${
                  isDoc
                    ? "bg-purple-50 border-purple-200"
                    : isHandwritten
                      ? "bg-orange-50 border-orange-200"
                      : "bg-blue-50 border-blue-200"
                }`}
              >
                <Loader2
                  className={`animate-spin flex-shrink-0 ${
                    isDoc
                      ? "text-purple-600"
                      : isHandwritten
                        ? "text-orange-600"
                        : "text-primary-blue"
                  }`}
                  size={20}
                />
                <div>
                  <p
                    className={`font-semibold ${
                      isDoc
                        ? "text-purple-700"
                        : isHandwritten
                          ? "text-orange-700"
                          : "text-primary-blue"
                    }`}
                  >
                    {isDoc
                      ? "Grading your document..."
                      : isHandwritten
                        ? "Grading your handwritten assignment..."
                        : "Evaluating your code..."}
                  </p>
                  <p
                    className={`text-sm ${
                      isDoc
                        ? "text-purple-600"
                        : isHandwritten
                          ? "text-orange-600"
                          : "text-blue-700"
                    }`}
                  >
                    {pollStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Submit and Cancel buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !uploadedFile || alreadySubmitted}
                className={`flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                  isSubmitting || !uploadedFile || alreadySubmitted
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isDoc
                      ? "bg-purple-600 text-white hover:opacity-90"
                      : isHandwritten
                        ? "bg-orange-600 text-white hover:opacity-90"
                        : "bg-primary-blue text-white hover:opacity-90"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {submitState === "submitting"
                      ? "Submitting..."
                      : "Evaluating..."}
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    {isDoc
                      ? "Submit Document for Grading"
                      : isHandwritten
                        ? "Submit Handwritten Assignment for Grading"
                        : "Submit for AI Evaluation"}
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                className="px-5 py-3 bg-gray-100 text-text-dark rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
