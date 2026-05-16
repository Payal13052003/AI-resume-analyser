"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import styles from "./page.module.css";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const [coverLetter, setCoverLetter] = useState("");
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    linkedIn: "",
  });
  const [resumeSummary, setResumeSummary] = useState([]);
  const [skillsGapMap, setSkillsGapMap] = useState({
    Technical: [],
    Tools: [],
    "Soft Skills": [],
  });
  const [keywordOptimizer, setKeywordOptimizer] = useState([]);
  const [bulletRewrites, setBulletRewrites] = useState([]);
  const [interviewPrep, setInterviewPrep] = useState([]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!jobDescription.trim()) {
      setError("Please add a job description.");
      return;
    }

    if (!resumeFile) {
      setError("Please upload a PDF resume.");
      return;
    }

    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    formData.append("resume", resumeFile);

    try {
      setLoading(true);
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        const detail = payload?.details ? ` ${payload.details}` : "";
        setError(`${payload?.error || "Analysis failed."}${detail}`.trim());
        return;
      }

      setResult(payload);
      setActiveTab("analysis");
      setCoverLetter(payload.coverLetter || "");
      setContact({
        name: payload.contact?.name || "",
        email: payload.contact?.email || "",
        phone: payload.contact?.phone || "",
        linkedIn: payload.contact?.linkedIn || "",
      });
      setResumeSummary(Array.isArray(payload.resumeSummary) ? payload.resumeSummary : []);
      setSkillsGapMap(payload.skillsGapMap || {
        Technical: [],
        Tools: [],
        "Soft Skills": [],
      });
      setKeywordOptimizer(
        Array.isArray(payload.keywordOptimizer) ? payload.keywordOptimizer : []
      );
      setBulletRewrites(
        Array.isArray(payload.bulletRewrites) ? payload.bulletRewrites : []
      );
      setInterviewPrep(
        Array.isArray(payload.interviewPrep) ? payload.interviewPrep : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 54;
    let cursorY = margin;

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(contact.name || "", margin, cursorY);
    cursorY += 18;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const contactLine = [contact.email, contact.phone, contact.linkedIn]
      .filter(Boolean)
      .join(" | ");
    if (contactLine) {
      doc.text(contactLine, margin, cursorY);
      cursorY += 18;
    }

    const dateText = new Date().toLocaleDateString();
    doc.text(dateText, margin, cursorY);
    cursorY += 24;

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const text = coverLetter || "";
    const lines = doc.splitTextToSize(text, 540);
    doc.text(lines, margin, cursorY);

    doc.save("cover-letter.pdf");
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandTag}>Hirelyzer Studio</span>
          <h1 className={styles.brandTitle}>Resume Intelligence</h1>
        </div>
        <span className={styles.badge}>Gemini 2.0 Flash</span>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>
            Turn every resume into a laser-focused match story.
          </h2>
          <p className={styles.heroCopy}>
            Hirelyzer compares your resume with any job description and delivers a
            clear ATS-style score, missing keyword map, and tailored improvement
            advice in seconds.
          </p>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Signal clarity</div>
              <div className={styles.statValue}>Role-aligned insights</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Output format</div>
              <div className={styles.statValue}>ATS-ready JSON summary</div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Analyze your resume</h2>
            <p>
              Upload a PDF and paste the job description. We will extract the
              text, run Gemini, and surface the strongest optimization path.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              <div className={styles.label}>Job description</div>
              <textarea
                className={styles.textarea}
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
              />
            </label>

            <label>
              <div className={styles.label}>Resume PDF</div>
              <input
                className={styles.fileInput}
                type="file"
                accept="application/pdf"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>

            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>
            <div className={styles.helper}>
              Your data stays in-memory during the analysis request.
            </div>
          </form>

          {error && <div className={styles.error}>{error}</div>}

          {result && (
            <div className={styles.result}>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "analysis" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("analysis")}
                >
                  Analysis
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "cover" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("cover")}
                >
                  Cover Letter
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "summary" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("summary")}
                >
                  Resume Summary
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "skills" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("skills")}
                >
                  Skills Gap
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "keywords" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("keywords")}
                >
                  Keyword Optimizer
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "bullets" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("bullets")}
                >
                  Bullet Rewrites
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "interview" ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab("interview")}
                >
                  Interview Prep
                </button>
              </div>

              {activeTab === "analysis" ? (
                <div>
                  <div className={styles.resultHeader}>
                    <div>
                      <div className={styles.label}>JD Match Score</div>
                      <div className={styles.score}>{result.jdMatch}</div>
                    </div>
                    <span className={styles.badge}>Insights ready</span>
                  </div>

                  <div>
                    <div className={styles.label}>Missing keywords</div>
                    <div className={styles.chipGroup}>
                      {Array.isArray(result.missingKeywords) &&
                      result.missingKeywords.length > 0 ? (
                        result.missingKeywords.map((keyword) => (
                          <span key={keyword} className={styles.chip}>
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className={styles.helper}>
                          No major keywords missing.
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className={styles.label}>Profile summary</div>
                    <div className={styles.summary}>{result.profileSummary}</div>
                  </div>
                </div>
              ) : null}

              {activeTab === "cover" ? (
                <div className={styles.coverPane}>
                  <div className={styles.coverGrid}>
                    <label>
                      <div className={styles.label}>Name</div>
                      <input
                        className={styles.input}
                        value={contact.name}
                        onChange={(event) =>
                          setContact({ ...contact, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <div className={styles.label}>Email</div>
                      <input
                        className={styles.input}
                        value={contact.email}
                        onChange={(event) =>
                          setContact({ ...contact, email: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <div className={styles.label}>Phone</div>
                      <input
                        className={styles.input}
                        value={contact.phone}
                        onChange={(event) =>
                          setContact({ ...contact, phone: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      <div className={styles.label}>LinkedIn</div>
                      <input
                        className={styles.input}
                        value={contact.linkedIn}
                        onChange={(event) =>
                          setContact({ ...contact, linkedIn: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    <div className={styles.label}>Cover letter</div>
                    <textarea
                      className={styles.textarea}
                      value={coverLetter}
                      onChange={(event) => setCoverLetter(event.target.value)}
                    />
                  </label>

                  <div className={styles.coverActions}>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={handleDownloadPdf}
                      disabled={!coverLetter.trim()}
                    >
                      Download PDF
                    </button>
                    <span className={styles.helper}>
                      Edit any details before downloading the cover letter.
                    </span>
                  </div>
                </div>
              ) : null}

              {activeTab === "summary" ? (
                <div className={styles.simplePanel}>
                  <div className={styles.label}>Resume summary</div>
                  {resumeSummary.length ? (
                    <ul className={styles.list}>
                      {resumeSummary.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className={styles.helper}>No summary generated yet.</span>
                  )}
                </div>
              ) : null}

              {activeTab === "skills" ? (
                <div className={styles.simplePanel}>
                  <div className={styles.label}>Skills gap map</div>
                  <div className={styles.gapGrid}>
                    {Object.entries(skillsGapMap || {}).map(([group, items]) => (
                      <div key={group} className={styles.gapCard}>
                        <div className={styles.gapTitle}>{group}</div>
                        <div className={styles.chipGroup}>
                          {Array.isArray(items) && items.length ? (
                            items.map((item, index) => (
                              <span key={`${item}-${index}`} className={styles.chip}>
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className={styles.helper}>No gaps listed.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "keywords" ? (
                <div className={styles.simplePanel}>
                  <div className={styles.label}>Keyword optimizer</div>
                  {keywordOptimizer.length ? (
                    <div className={styles.keywordGrid}>
                      {keywordOptimizer.map((item, index) => (
                        <div key={`${item.keyword}-${index}`} className={styles.keywordCard}>
                          <div className={styles.keyword}>{item.keyword}</div>
                          <div className={styles.keywordTag}>{item.importance}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.helper}>No keywords generated yet.</span>
                  )}
                </div>
              ) : null}

              {activeTab === "bullets" ? (
                <div className={styles.simplePanel}>
                  <div className={styles.label}>Tailored bullet rewrites</div>
                  {bulletRewrites.length ? (
                    <ul className={styles.list}>
                      {bulletRewrites.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className={styles.helper}>No bullet rewrites yet.</span>
                  )}
                </div>
              ) : null}

              {activeTab === "interview" ? (
                <div className={styles.simplePanel}>
                  <div className={styles.label}>Interview prep</div>
                  {interviewPrep.length ? (
                    <div className={styles.qaList}>
                      {interviewPrep.map((item, index) => (
                        <div key={`${item.question}-${index}`} className={styles.qaCard}>
                          <div className={styles.qaQuestion}>{item.question}</div>
                          <ul className={styles.qaPoints}>
                            {(item.talkingPoints || []).map((point, pointIndex) => (
                              <li key={`${point}-${pointIndex}`}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.helper}>No interview prep yet.</span>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
