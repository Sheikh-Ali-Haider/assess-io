import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getResult } from "../../utils/api";

// Format ISO date string to a readable local format
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Circular score badge showing standardized score out of 10
// Green above 7.5, amber above 5, red below 5
function ScoreBadge({ score }) {
  // score is out of 10 — convert to percentage for the circle fill
  const raw  = Number(score) || 0;
  const pct  = Math.min(100, Math.max(0, (raw / 10) * 100));
  const color = raw >= 7.5 ? "#22c55e" : raw >= 5 ? "#f59e0b" : "#ef4444";
  const r     = 42;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
        />
        {/* Show score as "X.X" inside the circle */}
        <text x="55" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="19" fontWeight="700" fill={color}>
          {raw % 1 === 0 ? raw.toFixed(1) : raw}
        </text>
        {/* "/ 10" label below the number inside circle */}
        <text x="55" y="71" textAnchor="middle" fontSize="10" fill="#9ca3af">
          / 10
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Score
      </span>
    </div>
  );
}

// Section heading with emoji icon
function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
        {label}
      </span>
    </div>
  );
}

// Two-column label/value row inside the student info card
function InfoRow({ label, value, capitalize }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", marginBottom: 10, gap: 8,
    }}>
      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 12, color: "#111827", fontWeight: 600,
        textAlign: "right", wordBreak: "break-all",
        textTransform: capitalize ? "capitalize" : "none",
      }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// Small card showing time or space complexity
function ComplexityCard({ label, value, note }) {
  return (
    <div style={{
      background: "#f8fafc", borderRadius: 10,
      padding: "14px 16px", border: "1px solid #e5e7eb",
    }}>
      <p style={{
        fontSize: 11, color: "#9ca3af", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 18, fontWeight: 700, color: "#111827",
        margin: "0 0 4px", fontFamily: "'Fira Code', monospace",
      }}>
        {value || "N/A"}
      </p>
      {note && (
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{note}</p>
      )}
    </div>
  );
}

// Code block used inside test case results — highlighted in red if failed
function CodeBlock({ label, value, highlight }) {
  return (
    <div>
      <p style={{
        fontSize: 11, color: "#9ca3af", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px",
      }}>
        {label}
      </p>
      <pre style={{
        margin: 0, padding: "8px 10px", borderRadius: 6,
        background: highlight ? "#fef2f2" : "#f8fafc",
        border: `1px solid ${highlight ? "#fecaca" : "#e5e7eb"}`,
        fontFamily: "'Fira Code', 'Consolas', monospace",
        fontSize: 12, color: highlight ? "#b91c1c" : "#1e293b",
        overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
        lineHeight: 1.6, minHeight: 36,
      }}>
        {String(value ?? "—")}
      </pre>
    </div>
  );
}

// Back arrow icon
function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

// Edit icon for override button
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// Download icon
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// Chevron icon for the code panel toggle button
function ChevronIcon({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResultView() {
  // Support both :id and :submissionId route param names
  const params = useParams();
  const id = params.id || params.submissionId;

  const navigate  = useNavigate();
  const location  = useLocation();

  // Detect teacher vs student view from URL path
  const isTeacher = location.pathname.includes("/teacher/");

  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Teacher grade override state
  const [overrideMode, setOverrideMode]     = useState(false);
  const [overrideScore, setOverrideScore]   = useState("");
  const [teacherComment, setTeacherComment] = useState("");
  const [savedComment, setSavedComment]     = useState("");
  const [savedScore, setSavedScore]         = useState(null);

  // Source code panel — open by default for teachers, closed for students
  const [codeOpen, setCodeOpen] = useState(isTeacher);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch the submission result on mount
  useEffect(() => {
    if (!id) {
      setError("No submission ID found.");
      setLoading(false);
      return;
    }
    getResult(id)
      .then((data) => {
        setResult(data);
        // Pre-fill override input with current standardized score
        setOverrideScore(String(data.standardized_score ?? ""));
      })
      .catch(() => setError("Could not load result. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  // Navigate back using react-router so we never hit a 404
  const handleBack = () => {
    if (isTeacher) {
      navigate("/teacher/grading");
    } else {
      navigate("/student/results");
    }
  };

  // Save the teacher override locally
  // Override is entered as a score out of 10 (e.g. 8.5)
  // TODO: wire up PUT /submissions/{id}/override when backend endpoint is ready
  const handleSaveOverride = () => {
    const parsed = Number(overrideScore);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) return;
    setSavedScore(parsed);
    setSavedComment(teacherComment);
    setOverrideMode(false);
  };

  // Loading spinner
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{
          width: 32, height: 32,
          border: "3px solid #e5e7eb",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: 40, color: "#ef4444", fontFamily: "sans-serif" }}>
        {error}
      </div>
    );
  }

  if (!result) return null;

  const isDoc         = result.submission_type === "document";
  const isHandwritten = result.submission_type === "handwritten";
  const fb            = result.ai_feedback || {};

  // Use override score if teacher saved one, otherwise use the standardized score from backend
  const displayScore = savedScore !== null ? savedScore : result.standardized_score;

  const tests  = result.test_results || [];
  const passed = tests.filter((t) => t.passed).length;

  // Shared white card style
  const card = {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "20px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Global responsive styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        /* Two-column layout on desktop */
        .rv-grid {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 20px;
          align-items: start;
        }

        /* Sidebar is a flex column by default */
        .rv-sidebar { display: flex; flex-direction: column; gap: 16px; }

        /* Mobile toggle button hidden on desktop */
        .rv-sidebar-toggle { display: none; }

        /* Complexity cards side by side on desktop */
        .rv-complexity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        /* Test case input/output side by side on desktop */
        .rv-test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* Tablet (max 900px) — stack sidebar below main content */
        @media (max-width: 900px) {
          .rv-grid { grid-template-columns: 1fr !important; }
          .rv-sidebar { display: none; }
          .rv-sidebar.open { display: flex !important; }
          .rv-sidebar-toggle { display: flex !important; }
        }

        /* Mobile (max 540px) — tighter padding, stack everything */
        @media (max-width: 540px) {
          .rv-topbar-title { display: none; }
          .rv-test-grid { grid-template-columns: 1fr !important; }
          .rv-complexity-grid { grid-template-columns: 1fr !important; }
          .rv-main-pad { padding: 16px 12px !important; }
          .rv-topbar { padding: 10px 14px !important; }
          .rv-page-title { font-size: 18px !important; }
        }
      `}</style>

      {/* Sticky top navigation bar */}
      <div
        className="rv-topbar"
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: 10,
        }}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#374151", fontSize: 14, fontWeight: 500,
            flexShrink: 0, padding: 0,
          }}
        >
          <BackIcon />
          <span className="rv-topbar-title">
            {isTeacher ? "Back to Grading Queue" : "Back to My Submissions"}
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Submission type pill badge */}
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
            textTransform: "uppercase", padding: "3px 10px", borderRadius: 20,
            background: isDoc ? "#f3e8ff" : isHandwritten ? "#fff7ed" : "#e0e7ff",
            color: isDoc ? "#7c3aed" : isHandwritten ? "#c2410c" : "#4338ca",
            flexShrink: 0,
          }}>
            {isDoc ? "Document" : isHandwritten ? "Handwritten" : result.language || "Code"}
          </span>

          {/* Mobile toggle button to show/hide the info sidebar */}
          <button
            className="rv-sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              fontSize: 12, fontWeight: 600, padding: "5px 12px",
              borderRadius: 8, background: "#f3f4f6", color: "#374151",
              border: "1px solid #e5e7eb", cursor: "pointer",
              alignItems: "center", gap: 4,
            }}
          >
            {sidebarOpen ? "Hide Info" : "Show Info"}
          </button>

          {/* Teacher override button — only visible in teacher view */}
          {isTeacher && !overrideMode && (
            <button
              onClick={() => setOverrideMode(true)}
              style={{
                fontSize: 13, fontWeight: 600, padding: "6px 14px",
                borderRadius: 8, background: "#fef3c7", color: "#92400e",
                border: "1px solid #fde68a", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
              }}
            >
              <EditIcon />
              Override Grade
            </button>
          )}
        </div>
      </div>

      {/* Page body */}
      <div
        className="rv-main-pad"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}
      >
        {/* Page heading */}
        <h1
          className="rv-page-title"
          style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px", wordBreak: "break-word" }}
        >
          {result.problem_id || "Assignment Result"}
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
          Submitted {fmtDate(result.submitted_at)}
          {savedComment && (
            <span style={{ marginLeft: 12, color: "#d97706", fontWeight: 500 }}>
              ✎ Teacher override applied
            </span>
          )}
        </p>

        {/* Two-column grid — sidebar on left, main content on right */}
        <div className="rv-grid">

          {/* Left sidebar */}
          <div className={`rv-sidebar${sidebarOpen ? " open" : ""}`}>

            {/* Score circle card — shows standardized score out of 10 */}
            <div style={{ ...card, textAlign: "center", padding: "24px 20px" }}>
              <ScoreBadge score={displayScore} />
              {/* Test pass count — only for code submissions */}
              {!isDoc && !isHandwritten && tests.length > 0 && (
                <div style={{ marginTop: 14, fontSize: 13, color: "#374151" }}>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>{passed}</span>
                  {" / "}
                  <span style={{ fontWeight: 600 }}>{tests.length}</span>
                  {" test cases passed"}
                </div>
              )}
            </div>

            {/* Student info card */}
            <div style={{ ...card, padding: "16px 20px" }}>
              <p style={{
                fontSize: 11, fontWeight: 600, color: "#9ca3af",
                letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 12px",
              }}>
                Student Info
              </p>
              <InfoRow label="Student ID" value={result.student_id} />
              <InfoRow label="Submitted"  value={fmtDate(result.submitted_at)} />
              <InfoRow label="Type"       value={result.submission_type} capitalize />
              {!isDoc && !isHandwritten && (
                <InfoRow label="Language" value={result.language || "N/A"} />
              )}

              {/* Download file link — for document and handwritten submissions */}
              {(isDoc || isHandwritten) && result.file_path && (
                <a
                  href={`http://localhost:8000/files/${result.file_path}`}
                  download
                  style={{
                    marginTop: 12, display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, color: "#7c3aed", fontWeight: 600, textDecoration: "none",
                  }}
                >
                  <DownloadIcon />
                  Download File
                </a>
              )}
            </div>

            {/* Teacher grade override form */}
            {isTeacher && overrideMode && (
              <div style={{
                background: "#fffbeb", borderRadius: 14,
                border: "1px solid #fde68a", padding: "16px 20px",
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, color: "#92400e",
                  margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Override Grade
                </p>

                <label style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                  New Score (0 – 10)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  style={{
                    display: "block", width: "100%", marginTop: 4, marginBottom: 12,
                    padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db",
                    fontSize: 15, fontWeight: 600, color: "#111827", boxSizing: "border-box",
                  }}
                />

                <label style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                  Teacher Comment
                </label>
                <textarea
                  rows={3}
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  placeholder="Add feedback or reason for override..."
                  style={{
                    display: "block", width: "100%", marginTop: 4, marginBottom: 12,
                    padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db",
                    fontSize: 13, color: "#374151", resize: "vertical",
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleSaveOverride}
                    style={{
                      flex: 1, padding: "8px", borderRadius: 8, border: "none",
                      background: "#d97706", color: "#fff", fontWeight: 600,
                      fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setOverrideMode(false)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: 8,
                      border: "1px solid #d1d5db", background: "#fff",
                      color: "#374151", fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Saved teacher comment — shown after override is applied */}
            {savedComment && (
              <div style={{
                background: "#fffbeb", borderRadius: 12,
                border: "1px solid #fde68a", padding: "14px 16px",
              }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: "#92400e",
                  margin: "0 0 6px", textTransform: "uppercase",
                }}>
                  Teacher Note
                </p>
                <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
                  {savedComment}
                </p>
              </div>
            )}
          </div>

          {/* Right main content column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* AI feedback summary */}
            <div style={card}>
              <SectionTitle
                icon="🤖"
                label={isDoc || isHandwritten ? "AI Assessment" : "AI Feedback"}
              />
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
                {fb.summary || "No summary available."}
              </p>
            </div>

            {/* Complexity analysis — only for code submissions */}
            {!isDoc && !isHandwritten && (fb.time_complexity || fb.space_complexity) && (
              <div style={card}>
                <SectionTitle icon="⚡" label="Complexity Analysis" />
                <div className="rv-complexity-grid">
                  <ComplexityCard label="Time Complexity"  value={fb.time_complexity}  note={fb.time_note} />
                  <ComplexityCard label="Space Complexity" value={fb.space_complexity} note={fb.space_note} />
                </div>
              </div>
            )}

            {/* Readability / writing clarity score */}
            {(fb.readability_score != null || fb.writing_clarity != null) && (
              <div style={card}>
                <SectionTitle
                  icon="📝"
                  label={isHandwritten || isDoc ? "Writing Clarity" : "Code Readability"}
                />
                {(() => {
                  const clarityScore = isHandwritten ? fb.writing_clarity : fb.readability_score;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                        <svg viewBox="0 0 48 48" width="48" height="48">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                          <circle
                            cx="24" cy="24" r="20" fill="none"
                            stroke={clarityScore >= 7 ? "#22c55e" : clarityScore >= 5 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="5"
                            strokeDasharray={`${(clarityScore / 10) * 125.7} 125.7`}
                            strokeLinecap="round"
                            transform="rotate(-90 24 24)"
                          />
                        </svg>
                        <span style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#111827",
                        }}>
                          {clarityScore}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>out of 10</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Improvement suggestions */}
            {fb.suggestions?.length > 0 && (
              <div style={card}>
                <SectionTitle icon="💡" label="Suggestions" />
                <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {fb.suggestions.map((s, i) => (
                    <li key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missed edge cases (code) or missed points (document/handwritten) */}
            {(fb.missed_edge_cases?.length > 0 || fb.missed_points?.length > 0) && (
              <div style={{ ...card, background: "#fef2f2", border: "1px solid #fecaca" }}>
                <SectionTitle
                  icon="⚠️"
                  label={isDoc || isHandwritten ? "Missed Points" : "Missed Edge Cases"}
                />
                <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {(isHandwritten ? fb.missed_points : fb.missed_edge_cases)?.map((m, i) => (
                    <li key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Test case results — only for code submissions */}
            {!isDoc && !isHandwritten && tests.length > 0 && (
              <div style={card}>
                <SectionTitle icon="🧪" label={`Test Cases — ${passed}/${tests.length} passed`} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tests.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        borderRadius: 10,
                        border: `1px solid ${t.passed ? "#bbf7d0" : "#fecaca"}`,
                        background: t.passed ? "#f0fdf4" : "#fef2f2",
                        overflow: "hidden",
                      }}
                    >
                      {/* Test case header */}
                      <div style={{
                        padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
                        background: t.passed ? "#dcfce7" : "#fee2e2",
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: t.passed ? "#15803d" : "#b91c1c" }}>
                          {t.passed ? "✓ Passed" : "✗ Failed"} — Case {i + 1}
                        </span>
                      </div>

                      {/* Expected vs actual output */}
                      <div className="rv-test-grid" style={{ padding: "10px 14px" }}>
                        <CodeBlock label="Expected" value={t.expected_output ?? t.expected} />
                        <CodeBlock label="Output"   value={t.actual_output ?? t.actual} highlight={!t.passed} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source code viewer — code submissions only, open by default for teachers */}
            {!isDoc && !isHandwritten && result.source_code && (
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                <button
                  onClick={() => setCodeOpen((o) => !o)}
                  style={{
                    width: "100%", padding: "16px 24px", background: "#f8fafc",
                    border: "none", borderBottom: codeOpen ? "1px solid #e5e7eb" : "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#111827",
                  }}
                >
                  <span>📄 Submitted Code</span>
                  <ChevronIcon open={codeOpen} />
                </button>

                {codeOpen && (
                  <pre style={{
                    margin: 0, padding: "20px 24px", overflowX: "auto",
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    fontSize: 13, lineHeight: 1.7, color: "#1e293b",
                    background: "#f8fafc", maxHeight: 420, overflowY: "auto",
                  }}>
                    {result.source_code}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
