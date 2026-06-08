"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faCodeCommit, faUser, faCircle, faCode } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import RepoForm from "@/components/RepoForm";
import CommitCard from "@/components/CommitCard";
import UserModal from "@/components/UserModal";
import ContributionGraph from "@/components/ContributionGraph";

export default function Home() {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repoName, setRepoName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeContributor, setActiveContributor] = useState("all");

  async function fetchCommits(owner, repo) {
    setLoading(true);
    setError("");
    setCommits([]);
    setRepoName(`${owner}/${repo}`);
    setActiveContributor("all");

    try {
      const res = await fetch(`/api/github?owner=${owner}&repo=${repo}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setCommits(data.commits);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const userCommitCount = {};
  commits.forEach((c) => {
    const key = c.githubLogin || c.authorName;
    userCommitCount[key] = (userCommitCount[key] || 0) + 1;
  });

  const sortedContributors = Object.entries(userCommitCount).sort((a, b) => b[1] - a[1]);

  const filteredCommits = activeContributor === "all"
    ? commits
    : commits.filter((c) => (c.githubLogin || c.authorName) === activeContributor);

  return (
    <div style={styles.root}>
      {/* Scanline overlay */}
      <div style={styles.scanlines} />

      {/* LEFT SIDEBAR */}
      <aside style={styles.sidebar}>

        {/* TOP SECTION — fixed, never scrolls */}
        <div style={styles.sidebarTop}>
          {/* Logo */}
          <div style={styles.sidebarLogo}>
            <FontAwesomeIcon icon={faCode} style={{ color: "#339649", marginRight: "10px" }} />
            <span style={styles.logoText}>GITHUB COMMITS<span style={{ color: "#339649" }}></span></span>
          </div>

          <div style={styles.divider} />

          {/* Repo input */}
          <div style={styles.sidebarSection}>
            <p style={styles.sectionLabel}>
              <FontAwesomeIcon icon={faGithub} style={{ marginRight: "6px" }} />
              REPOSITORY
            </p>
            <RepoForm onSubmit={fetchCommits} loading={loading} />
            {error && (
              <div style={styles.errorBox}>
                <span style={{ color: "#ff6b6b" }}>ERR &gt;</span> {error}
              </div>
            )}
          </div>

          {/* Stats */}
          {commits.length > 0 && (
            <>
              <div style={styles.divider} />
              <div style={styles.sidebarSection}>
                <p style={styles.sectionLabel}>REPO STATS</p>
                <div style={styles.statRow}>
                  <FontAwesomeIcon icon={faBox} style={styles.statIcon} />
                  <span style={styles.statLabel}>REPO</span>
                  <span style={styles.statValue}>{repoName.split("/")[1]}</span>
                </div>
                <div style={styles.statRow}>
                  <FontAwesomeIcon icon={faCodeCommit} style={styles.statIcon} />
                  <span style={styles.statLabel}>COMMITS</span>
                  <span style={styles.statValue}>{commits.length}</span>
                </div>
                <div style={styles.statRow}>
                  <FontAwesomeIcon icon={faUser} style={styles.statIcon} />
                  <span style={styles.statLabel}>AUTHORS</span>
                  <span style={styles.statValue}>{sortedContributors.length}</span>
                </div>
              </div>
            </>
          )}

          {/* Contributors label + ALL button */}
          {commits.length > 0 && (
            <>
              <div style={styles.divider} />
              <div style={styles.sidebarSection}>
                <p style={styles.sectionLabel}>CONTRIBUTORS</p>
                <button
                  style={{ ...styles.contributorRow, ...(activeContributor === "all" ? styles.contributorActive : {}) }}
                  onClick={() => setActiveContributor("all")}
                >
                  <FontAwesomeIcon icon={faCircle} style={{ fontSize: "6px", color: "#339649", marginRight: "8px" }} />
                  <span style={styles.contributorName}>ALL</span>
                  <span style={styles.contributorBadge}>{commits.length}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* SCROLLABLE CONTRIBUTORS LIST */}
        {commits.length > 0 && (
          <div style={styles.contributorScroll}>
            <div style={styles.contributorScrollInner}>
              {sortedContributors.map(([login, count]) => {
                const user = commits.find((c) => (c.githubLogin || c.authorName) === login)?.userDetail;
                const isActive = activeContributor === login;
                return (
                  <button
                    key={login}
                    style={{ ...styles.contributorRow, ...(isActive ? styles.contributorActive : {}) }}
                    onClick={() => setActiveContributor(login)}
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={login} style={styles.contributorAvatar} />
                    ) : (
                      <FontAwesomeIcon icon={faUser} style={{ fontSize: "10px", color: "#339649", marginRight: "8px", width: "18px" }} />
                    )}
                    <span style={styles.contributorName}>@{login}</span>
                    <span style={styles.contributorBadge}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM PADDING */}
        <div style={{ flexShrink: 0, height: "16px" }} />
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            {loading ? (
              <span style={styles.statusPulse}>
                <FontAwesomeIcon icon={faCircle} style={{ color: "#339649", marginRight: "8px", fontSize: "8px" }} />
                FETCHING {repoName.toUpperCase()}…
              </span>
            ) : commits.length > 0 ? (
              <span style={styles.statusText}>
                <FontAwesomeIcon icon={faCircle} style={{ color: "#339649", marginRight: "8px", fontSize: "8px" }} />
                {repoName.toUpperCase()} &mdash; {filteredCommits.length} COMMITS
                {activeContributor !== "all" && ` BY @${activeContributor.toUpperCase()}`}
              </span>
            ) : (
              <span style={styles.statusIdle}>AWAITING REPOSITORY INPUT</span>
            )}
          </div>
          <div style={styles.topBarRight}>
            <FontAwesomeIcon icon={faGithub} style={{ color: "#339649", fontSize: "18px" }} />
          </div>
        </div>

        {/* Empty state */}
        {commits.length === 0 && !loading && (
          <div style={styles.emptyState}>
            <FontAwesomeIcon icon={faCode} style={{ fontSize: "48px", color: "#2a2a2a", marginBottom: "20px" }} />
            <p style={styles.emptyText}>PASTE A GITHUB REPO URL IN THE SIDEBAR</p>
            <p style={styles.emptySubtext}>e.g. https://github.com/vercel/next.js</p>
          </div>
        )}

        {/* Contribution graph */}
        {commits.length > 0 && (
          <div style={styles.section}>
            <ContributionGraph commits={filteredCommits} allCommits={commits} />
          </div>
        )}

        {/* Commit feed */}
        {commits.length > 0 && (
          <div style={styles.section}>
            <div style={styles.feedHeader}>
              <span style={styles.feedTitle}>
                <FontAwesomeIcon icon={faCodeCommit} style={{ marginRight: "8px", color: "#339649" }} />
                COMMIT LOG
              </span>
              <span style={styles.feedCount}>{filteredCommits.length} entries</span>
            </div>
            <div style={styles.commitFeed}>
              {filteredCommits.map((commit) => (
                <CommitCard
                  key={commit.sha}
                  commit={commit}
                  onUserClick={setSelectedUser}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .blink { animation: blink 1s step-end infinite; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }

        /* Custom scrollbar for contributors */
        .contributor-scroll::-webkit-scrollbar { width: 4px; }
        .contributor-scroll::-webkit-scrollbar-track { background: transparent; }
        .contributor-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        .contributor-scroll::-webkit-scrollbar-thumb:hover { background: #339649; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#121212",
    position: "relative",
  },
  scanlines: {
    position: "fixed", inset: 0,
    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
    pointerEvents: "none",
    zIndex: 100,
  },

  // Sidebar — full height, no scroll on the outer container
  sidebar: {
    width: "280px",
    minWidth: "280px",
    background: "#0e0e0e",
    borderRight: "1px solid #1f1f1f",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0,
    overflow: "hidden",       // ← outer sidebar never scrolls
  },

  // Everything above the contributors list — never scrolls
  sidebarTop: {
    flexShrink: 0,            // ← stays fixed height, won't grow
  },

  // The contributors list — takes remaining space and scrolls
  contributorScroll: {
    flex: 1,                  // ← fills leftover space
    overflowY: "auto",        // ← only this scrolls
    minHeight: 0,             // ← required for flex + overflow to work
  },
  contributorScrollInner: {
    padding: "0 20px 8px",
  },

  sidebarLogo: {
    padding: "24px 20px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #1f1f1f",
  },
  logoText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#edeced",
    letterSpacing: "0.15em",
  },
  divider: {
    height: "1px",
    background: "#1f1f1f",
  },
  sidebarSection: {
    padding: "16px 20px",
  },
  sectionLabel: {
    fontSize: "10px",
    color: "#555",
    letterSpacing: "0.2em",
    margin: "0 0 12px",
    fontWeight: "700",
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "7px 0",
    borderBottom: "1px solid #1a1a1a",
  },
  statIcon: { color: "#339649", fontSize: "11px", width: "14px" },
  statLabel: { fontSize: "10px", color: "#555", letterSpacing: "0.1em", flex: 1 },
  statValue: { fontSize: "12px", color: "#edeced", fontWeight: "700" },
  contributorRow: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: "6px",
    padding: "8px 10px",
    cursor: "pointer",
    marginBottom: "4px",
    color: "#edeced",
    textAlign: "left",
    transition: "all 0.15s",
    boxSizing: "border-box",
  },
  contributorActive: {
    background: "#0d2e16",
    border: "1px solid #339649",
  },
  contributorAvatar: {
    width: "18px", height: "18px",
    borderRadius: "50%",
    marginRight: "8px",
    objectFit: "cover",
    flexShrink: 0,
  },
  contributorName: {
    fontSize: "12px",
    color: "#edeced",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  contributorBadge: {
    fontSize: "10px",
    background: "#1a1a1a",
    color: "#339649",
    padding: "2px 7px",
    borderRadius: "4px",
    fontWeight: "700",
    border: "1px solid #2a2a2a",
    flexShrink: 0,
  },
  errorBox: {
    marginTop: "10px",
    padding: "10px",
    background: "#1a0000",
    border: "1px solid #ff6b6b",
    borderRadius: "6px",
    fontSize: "11px",
    color: "#adc9b0",
    lineHeight: "1.6",
  },

  // Main content scrolls normally with the page
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    borderBottom: "1px solid #1f1f1f",
    background: "#0e0e0e",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  topBarLeft: { fontSize: "12px", letterSpacing: "0.1em" },
  topBarRight: {},
  statusPulse: { color: "#339649" },
  statusText: { color: "#7aad84" },
  statusIdle: { color: "#333", fontSize: "12px" },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 40px",
    textAlign: "center",
  },
  emptyText: { color: "#333", fontSize: "13px", letterSpacing: "0.2em", margin: "0 0 10px" },
  emptySubtext: { color: "#2a2a2a", fontSize: "11px", margin: 0 },
  section: {
    padding: "24px 28px",
    borderBottom: "1px solid #1a1a1a",
  },
  feedHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  feedTitle: { fontSize: "11px", color: "#555", letterSpacing: "0.2em", fontWeight: "700" },
  feedCount: { fontSize: "11px", color: "#339649" },
  commitFeed: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
};