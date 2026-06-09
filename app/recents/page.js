"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock, faTrash, faCodeBranch,
  faLock, faLockOpen, faKey, faSearch,
  faCodeCommit, faUser,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "@/components/Sidebar";
import { loadRecents, deleteRecent, timeAgo } from "@/lib/recents";

export default function RecentsPage() {
  const router = useRouter();
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    setRecents(loadRecents());
  }, []);

  function handleDelete(id, e) {
    e.stopPropagation();
    setRecents((prev) => deleteRecent(id, prev));
  }

  function handleClick(r) {
    const params = new URLSearchParams({ owner: r.owner, repo: r.repo });
    if (r.branch) params.set("branch", r.branch);
    if (r.token)  params.set("token",  r.token);
    router.push(`/?${params.toString()}`);
  }

  function clearAll() {
    try { localStorage.removeItem("commitlens_recents"); } catch {}
    setRecents([]);
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-scroll">
        {/* Top bar */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="status-dot" />
            <span className="t-meta" style={{ letterSpacing: "0.1em" }}>RECENTS</span>
          </div>
          {recents.length > 0 && (
            <button className="btn-ghost" onClick={clearAll}>
              CLEAR ALL
            </button>
          )}
        </div>

        {recents.length === 0 ? (
          <div style={pageStyles.empty}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: "48px", color: "#2a2a2a", marginBottom: "20px" }} />
            <p className="t-body" style={{ color: "#555", letterSpacing: "0.1em" }}>NO RECENT SEARCHES</p>
            <p className="t-dim" style={{ marginTop: "8px" }}>Repositories you search will appear here</p>
          </div>
        ) : (
          <div style={pageStyles.grid}>
            {recents.map((r) => (
              <div
                key={r.id}
                className="card"
                style={pageStyles.card}
                onClick={() => handleClick(r)}
              >
                {/* Card header */}
                <div style={pageStyles.cardHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <FontAwesomeIcon
                      icon={r.isPrivate ? faLock : faLockOpen}
                      style={{ fontSize: "12px", color: r.isPrivate ? "#ff6b6b" : "#339649", flexShrink: 0 }}
                    />
                    <span className="recent-name">{r.owner}/{r.repo}</span>
                  </div>
                  <button
                    className="recent-delete"
                    onClick={(e) => handleDelete(r.id, e)}
                    title="Remove"
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />
                  </button>
                </div>

                {/* Description */}
                {r.description && (
                  <p className="recent-desc" style={{ marginTop: "8px", whiteSpace: "normal", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {r.description}
                  </p>
                )}

                {/* Tags */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
                  {r.language && <span className="tag">{r.language}</span>}
                  {r.stars > 0 && <span className="tag">★ {r.stars.toLocaleString()}</span>}
                  {r.branch && (
                    <span className="tag">
                      <FontAwesomeIcon icon={faCodeBranch} style={{ fontSize: "10px" }} />
                      {r.branch}
                    </span>
                  )}
                  {r.hasToken && (
                    <span className="tag" style={{ color: "#aaa", borderColor: "#2a2a2a", background: "#1a1a1a" }}>
                      <FontAwesomeIcon icon={faKey} style={{ fontSize: "10px" }} />
                      token saved
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div style={pageStyles.cardFooter}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {r.commitCount && (
                      <span className="t-dim" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <FontAwesomeIcon icon={faCodeCommit} style={{ fontSize: "10px", color: "#339649" }} />
                        {r.commitCount} commits
                      </span>
                    )}
                    {r.authorCount && (
                      <span className="t-dim" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <FontAwesomeIcon icon={faUser} style={{ fontSize: "10px", color: "#339649" }} />
                        {r.authorCount} authors
                      </span>
                    )}
                  </div>
                  <span className="recent-time">
                    <FontAwesomeIcon icon={faClock} style={{ marginRight: "4px", fontSize: "10px" }} />
                    {timeAgo(r.searchedAt)}
                  </span>
                </div>

                {/* Click hint */}
                <div style={pageStyles.clickHint}>
                  <FontAwesomeIcon icon={faSearch} style={{ marginRight: "6px", fontSize: "10px" }} />
                  ANALYSE AGAIN
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const pageStyles = {
  empty: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "80px 40px", textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
    padding: "24px",
    alignContent: "start",
  },
  card: {
    padding: "18px",
    cursor: "pointer",
    transition: "border-color 0.15s, transform 0.1s",
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: "8px",
  },
  cardFooter: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid #1f1f1f",
  },
  clickHint: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "8px 18px",
    background: "linear-gradient(to top, #0d2e16, transparent)",
    fontSize: "10px", color: "#339649",
    letterSpacing: "0.15em", fontWeight: "700",
    opacity: 0, transition: "opacity 0.2s",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};