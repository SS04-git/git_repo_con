"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCodeCommit, faCode, faFileCode, faDownload,
  faPlus, faMinus, faXmark, faChevronDown, faChevronUp, faSpinner, } from "@fortawesome/free-solid-svg-icons";

export default function CommitCard({ commit, onUserClick, owner, repo, token }) {
  const [showCode, setShowCode]         = useState(false);
  const [codeData, setCodeData]         = useState(null);
  const [codeLoading, setCodeLoading]   = useState(false);
  const [codeError, setCodeError]       = useState("");
  const [fileContent, setFileContent]   = useState({});
  const [fileLoading, setFileLoading]   = useState({});
  const [expandedFile, setExpandedFile] = useState(null);
  const [activeTab, setActiveTab]       = useState({});

  const shortSha  = commit.sha.substring(0, 7);
  const date      = new Date(commit.date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  const firstLine = commit.message.split("\n")[0];

  const statusColor = { added: "#4db863", modified: "#339649", removed: "#ff6b6b", renamed: "#f0c040" };
  const statusLabel = { added: "A", modified: "M", removed: "R", renamed: "RN" };

  async function handleCodeClick() {
    if (showCode) { setShowCode(false); return; }
    setShowCode(true);
    if (codeData) return;
    setCodeLoading(true);
    setCodeError("");
    try {
      const params = new URLSearchParams({ owner, repo, sha: commit.sha });
      if (token) params.set("token", token);
      const res  = await fetch(`/api/github/file?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");
      setCodeData(data);
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setCodeLoading(false);
    }
  }

  async function handleViewFile(file, index) {
    if (expandedFile === index && activeTab[index] === "file") {
      setExpandedFile(null);
      return;
    }
    setExpandedFile(index);
    setActiveTab((prev) => ({ ...prev, [index]: "file" }));
    if (fileContent[index]) return;
    setFileLoading((prev) => ({ ...prev, [index]: true }));
    try {
      let text;
      const params = new URLSearchParams();
      params.set("url", file.rawUrl);
      if (token) params.set("token", token);
      const res = await fetch(`/api/github/file?${params.toString()}`);
      if (!res.ok) throw new Error("Could not fetch file");
        // Ensure it's always treated as text
        text = await res.text();

      setFileContent((prev) => ({ ...prev, [index]: text }));
    } catch (err) {
      setFileContent((prev) => ({ ...prev, [index]: `Error: ${err.message}` }));
    } finally {
      setFileLoading((prev) => ({ ...prev, [index]: false }));
    }
  }

  function handleDiffClick(index) {
    if (expandedFile === index && activeTab[index] === "diff") {
      setExpandedFile(null);
      return;
    }
    setExpandedFile(index);
    setActiveTab((prev) => ({ ...prev, [index]: "diff" }));
  }
 
  function downloadAsTxt(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename.replace(/\//g, "_") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* ── Commit row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "16px",
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: showCode ? "10px 10px 0 0" : "10px",
        padding: "14px 18px",
        marginBottom: "2px",
        transition: "border-color 0.15s",
      }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {commit.userDetail?.avatar_url ? (
            <img
              src={commit.userDetail.avatar_url}
              alt={commit.githubLogin}
              style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #339649", cursor: "pointer", objectFit: "cover" }}
              onClick={handleCodeClick}
              title="View changed files"
            />
          ) : (
            <div
              style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#339649", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onClick={handleCodeClick}
            >
              <FontAwesomeIcon icon={faUser} style={{ fontSize: "16px", color: "#121212" }} />
            </div>
          )}
        </div>

        {/* Commit info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#edeced", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>
            <FontAwesomeIcon icon={faCodeCommit} style={{ marginRight: "8px", color: "#339649", fontSize: "11px" }} />
            {firstLine}
          </div>
          <div style={{ color: "#7aad84", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            {commit.userDetail ? (
              <button
                style={{ background: "none", border: "none", color: "#339649", cursor: "pointer", fontWeight: "700", fontSize: "12px", padding: 0, textDecoration: "underline", fontFamily: "inherit" }}
                onClick={() => onUserClick(commit.userDetail)}
              >
                @{commit.githubLogin}
              </button>
            ) : (
              <span style={{ fontWeight: "600" }}>{commit.authorName}</span>
            )}
            <span style={{ color: "#444" }}>·</span>
            <span>{date}</span>
          </div>
        </div>

        {/* Right: CODE button*/}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <button
            className={`commit-code-btn${showCode ? " active" : ""}`}
            onClick={handleCodeClick}
          >
            {codeLoading
              ? <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: "11px" }} />
              : <><FontAwesomeIcon icon={faCode} style={{ fontSize: "11px" }} /> CODE</>
            }
          </button>
        </div>
      </div>

      {/* ── Code diff panel ── */}
      {showCode && (
        <div className="diff-panel">

          {/* Panel header */}
          <div className="diff-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <FontAwesomeIcon icon={faCode} style={{ color: "#339649", fontSize: "12px", flexShrink: 0 }} />
              <span className="diff-panel-title">{firstLine}</span>
              <span className="diff-panel-sha">{shortSha}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              {codeData?.stats && (
                <span style={{ fontSize: "12px" }}>
                  <span style={{ color: "#4db863" }}>+{codeData.stats.additions}</span>
                  {" / "}
                  <span style={{ color: "#ff6b6b" }}>-{codeData.stats.deletions}</span>
                </span>
              )}
              <button className="diff-close-btn" onClick={() => setShowCode(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>

          {/* Loading */}
          {codeLoading && (
            <div className="diff-panel-center">
              <FontAwesomeIcon icon={faSpinner} spin style={{ color: "#339649", fontSize: "20px" }} />
              <span className="t-dim" style={{ marginTop: "8px" }}>Loading changed files…</span>
            </div>
          )}

          {/* Error */}
          {codeError && (
            <div className="diff-panel-center">
              <span className="t-danger">! {codeError}</span>
            </div>
          )}

          {/* File list */}
          {!codeLoading && !codeError && codeData && (
            <div className="diff-file-list custom-scroll">

              {codeData.files?.length === 0 && (
                <div className="diff-no-files">No file changes recorded</div>
              )}

              {codeData.files?.map((file, i) => {
                const isExpanded = expandedFile === i;
                const tab        = activeTab[i] || "diff";

                return (
                  <div key={i} className="diff-file-entry">

                    {/* File row */}
                    <div className="diff-file-row">
                      <span
                        className="diff-status-badge"
                        style={{ background: statusColor[file.status] || "#555" }}
                      >
                        {statusLabel[file.status] || "?"}
                      </span>
                      <FontAwesomeIcon icon={faFileCode} style={{ color: "#555", fontSize: "10px", flexShrink: 0 }} />
                      <span className="diff-file-name">{file.filename}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", flexShrink: 0 }}>
                        {file.additions > 0 && (
                          <span className="diff-add-stat">
                            <FontAwesomeIcon icon={faPlus} style={{ fontSize: "9px" }} />{file.additions}
                          </span>
                        )}
                        {file.deletions > 0 && (
                          <span className="diff-del-stat">
                            <FontAwesomeIcon icon={faMinus} style={{ fontSize: "9px" }} />{file.deletions}
                          </span>
                        )}
                        {file.patch && (
                          <button
                            className={`diff-tab-btn${isExpanded && tab === "diff" ? " active" : ""}`}
                            onClick={() => handleDiffClick(i)}
                          >
                            DIFF
                          </button>
                        )}
                        {file.status !== "removed" && file.rawUrl && (
                          <>
                            <button
                              className={`diff-tab-btn${isExpanded && tab === "file" ? " active" : ""}`}
                              onClick={() => handleViewFile(file, i)}
                            >
                              {fileLoading[i]
                                ? <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: "10px" }} />
                                : "FILE"
                              }
                            </button>
                            {fileContent[i] && !fileContent[i].startsWith("Error:") && (
                              <button
                                className="diff-tab-btn"
                                onClick={() => downloadAsTxt(file.filename, fileContent[i])}
                                title="Download as .txt"
                              >
                                <FontAwesomeIcon icon={faDownload} style={{ fontSize: "10px" }} />
                              </button>
                            )}
                          </>
                        )}
                        <FontAwesomeIcon
                          icon={isExpanded ? faChevronUp : faChevronDown}
                          style={{ color: "#444", fontSize: "10px" }}
                        />
                      </div>
                    </div>

                    {/* DIFF view */}
                    {isExpanded && tab === "diff" && file.patch && (
                      <div className="diff-patch custom-scroll">
                        {file.patch.split("\n").map((line, li) => {
                          const isAdd  = line.startsWith("+") && !line.startsWith("+++");
                          const isDel  = line.startsWith("-") && !line.startsWith("---");
                          const isHunk = line.startsWith("@@");
                          const cls    = isAdd ? "diff-line-add"
                                       : isDel  ? "diff-line-del"
                                       : isHunk ? "diff-line-hunk"
                                       :          "diff-line-ctx";
                          return (
                            <div key={li} className={`diff-line ${cls}`}>
                              {line || " "}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* FILE view */}
                    {isExpanded && tab === "file" && (
                      <div className="diff-patch custom-scroll">
                        {fileLoading[i] ? (
                          <div className="diff-panel-center">
                            <FontAwesomeIcon icon={faSpinner} spin style={{ color: "#339649" }} />
                          </div>
                        ) : (
                          (fileContent[i] || "").split("\n").map((line, li) => (
                            <div key={li} className="diff-file-line">
                              <span className="diff-line-num">{li + 1}</span>
                              <span style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}> {line || " "} </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* No patch fallback */}
                    {isExpanded && tab === "diff" && !file.patch && (
                      <div className="diff-no-patch">
                        No diff available — binary or too large
                        {file.rawUrl && (
                          <> · <a href={file.rawUrl} target="_blank" rel="noreferrer" style={{ color: "#339649" }}>View raw</a></>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}