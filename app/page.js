"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCodeCommit, faUser, faCircle, faCode,
  faLock, faLockOpen, faStar, faCodeBranch,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Sidebar from "@/components/Sidebar";
import RepoForm from "@/components/RepoForm";
import CommitCard from "@/components/CommitCard";
import UserModal from "@/components/UserModal";
import ContributionGraph from "@/components/ContributionGraph";
import { loadRecents, saveRecent } from "@/lib/recents";

function HomeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [commits, setCommits]               = useState([]);
  const [repoInfo, setRepoInfo]             = useState(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [repoName, setRepoName]             = useState("");
  const [selectedUser, setSelectedUser]     = useState(null);
  const [activeContributor, setActiveContributor] = useState("all");
  const [hasSearched, setHasSearched]       = useState(false);
  const [recents, setRecents]               = useState([]);

  useEffect(() => {
    setRecents(loadRecents());
    // Auto-fetch if navigated from recents page
    const owner  = searchParams.get("owner");
    const repo   = searchParams.get("repo");
    const branch = searchParams.get("branch") || "";
    const token  = searchParams.get("token")  || "";
    if (owner && repo) {
      fetchCommits(owner, repo, { branch, token });
      // Clean URL
      router.replace("/", { scroll: false });
    }
  }, []);

  async function fetchCommits(owner, repo, opts = {}) {
    setLoading(true);
    setError("");
    setCommits([]);
    setRepoInfo(null);
    setRepoName(`${owner}/${repo}`);
    setActiveContributor("all");
    setHasSearched(true);

    const params = new URLSearchParams({ owner, repo });
    if (opts.branch) params.set("branch", opts.branch);
    if (opts.token)  params.set("token",  opts.token);

    try {
      const res  = await fetch(`/api/github?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setCommits(data.commits);
      setRepoInfo(data.repoInfo);

      const entry = {
        id: `${owner}/${repo}`,
        owner, repo,
        displayName: data.repoInfo?.name || repo,
        description: data.repoInfo?.description || "",
        isPrivate:   data.repoInfo?.private || false,
        language:    data.repoInfo?.language || "",
        stars:       data.repoInfo?.stars || 0,
        defaultBranch: data.repoInfo?.defaultBranch || "",
        branch:      opts.branch || data.repoInfo?.defaultBranch || "",
        hasToken:    !!opts.token,
        token:       opts.token || "",
        commitCount: data.commits.length,
        authorCount: new Set(data.commits.map(c => c.githubLogin || c.authorName)).size,
        searchedAt:  new Date().toISOString(),
      };
      setRecents((prev) => saveRecent(entry, prev));
    } catch (err) {
      setError(err.message);
      setHasSearched(false);
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
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <Sidebar>
        {hasSearched && commits.length > 0 && (
          <>
            {/* Current repo info */}
            <div className="sidebar-section">
              <p className="t-label" style={{ marginBottom: "10px" }}>CURRENT</p>
              <div style={sideStyles.repoBlock}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <FontAwesomeIcon
                    icon={repoInfo?.private ? faLock : faLockOpen}
                    style={{ fontSize: "11px", color: repoInfo?.private ? "#ff6b6b" : "#339649", flexShrink: 0 }}
                  />
                  <span style={sideStyles.repoFullName}>{repoName.toUpperCase()}</span>
                </div>
                <p style={sideStyles.repoSub}>
                  {commits.length} commits · {sortedContributors.length} authors
                </p>
                {repoInfo?.description && (
                  <p style={sideStyles.repoDesc}>{repoInfo.description}</p>
                )}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  {repoInfo?.language && <span className="tag">{repoInfo.language}</span>}
                  {repoInfo?.stars > 0 && <span className="tag">★ {repoInfo.stars.toLocaleString()}</span>}
                  {repoInfo?.defaultBranch && (
                    <span className="tag">
                      <FontAwesomeIcon icon={faCodeBranch} style={{ fontSize: "10px" }} />
                      {repoInfo.defaultBranch}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="sidebar-divider" />

            {/* Contributors */}
            <div className="sidebar-section">
              <p className="t-label" style={{ marginBottom: "10px" }}>CONTRIBUTORS</p>
              <button
                className={`contrib-row ${activeContributor === "all" ? "active" : ""}`}
                onClick={() => setActiveContributor("all")}
              >
                <FontAwesomeIcon icon={faCircle} style={{ fontSize: "6px", color: "#339649", marginRight: "8px", flexShrink: 0 }} />
                <span className="contrib-name">ALL</span>
                <span className="contrib-badge">{commits.length}</span>
              </button>
            </div>

            {/* Scrollable contributor list */}
            <div className="sidebar-scroll custom-scroll">
              <div className="sidebar-scroll-inner">
                {sortedContributors.map(([login, count]) => {
                  const user = commits.find((c) => (c.githubLogin || c.authorName) === login)?.userDetail;
                  return (
                    <button
                      key={login}
                      className={`contrib-row ${activeContributor === login ? "active" : ""}`}
                      onClick={() => setActiveContributor(login)}
                    >
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={login} className="contrib-avatar" />
                      ) : (
                        <FontAwesomeIcon icon={faUser} style={{ fontSize: "10px", color: "#339649", marginRight: "8px", width: "18px", flexShrink: 0 }} />
                      )}
                      <span className="contrib-name">@{login}</span>
                      <span className="contrib-badge">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </Sidebar>

      {/* ── MAIN ── */}
      <main className="main-scroll">

        {/* Top bar — only show after a search */}
        {hasSearched && (
        <div className="topbar" style={{ justifyContent: "center", position: "relative" }}>
        <div style={{ width: "100%", maxWidth: "760px" }}>
       <RepoForm
        onSubmit={fetchCommits}
        loading={loading}
        mode="topbar"
         />
        </div>

       {/* Status — absolute right so it doesn't push search */}
       {commits.length > 0 && !loading && (
       <div
        style={{
          position: "absolute",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        >
        <div className="status-dot" />
        <span
          className="t-meta"
          style={{
            fontSize: "11px",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {filteredCommits.length} COMMITS
          {activeContributor !== "all" &&
            ` · @${activeContributor.toUpperCase()}`}
        </span>
        </div>
         )}
        </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-box">
            <span className="t-danger">ERR &nbsp;</span>{error}
          </div>
        )}

        {/* Landing state */}
        {!hasSearched && !loading && (
        <div style={pageStyles.landing}>
        <FontAwesomeIcon icon={faCode} style={{ fontSize: "52px", color: "#2a2a2a", marginBottom: "24px", }}/>
        <h1 className="t-heading" style={{ marginBottom: "12px", letterSpacing: "0.15em", }} >
        COMMIT<span className="t-accent">_</span>LENS </h1>
        <p className="t-dim" style={{ maxWidth: "360px", textAlign: "center", lineHeight: "1.8", marginBottom: "24px", }}>
        Paste any GitHub repository URL to explore commits and contributors
        </p>
        <div style={{ width: "100%", maxWidth: "760px", marginBottom: "32px", }}>
        <RepoForm onSubmit={fetchCommits} loading={loading} mode="landing" />
        </div>

        {recents.length > 0 && (
        <p className="t-meta" style={{ fontSize: "12px" }}>
        Or visit{" "}
        <a
          href="/recents"
          style={{
            color: "#339649",
            textDecoration: "none",
          }}
        >
          Recents
        </a>{" "}
        to re-analyse a previous search
        </p>
        )}
        </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={pageStyles.landing}>
            <FontAwesomeIcon icon={faCodeCommit} className="pulse" style={{ fontSize: "36px", color: "#339649", marginBottom: "20px" }} />
            <p className="t-meta" style={{ letterSpacing: "0.1em" }}>FETCHING {repoName.toUpperCase()}…</p>
          </div>
        )}

        {/* Results */}
        {!loading && commits.length > 0 && (
          <>
            <div className="section">
              <ContributionGraph commits={filteredCommits} allCommits={commits} />
            </div>
            <div className="section">
              <div style={pageStyles.feedHeader}>
                <span className="t-label">
                  <FontAwesomeIcon icon={faCodeCommit} style={{ marginRight: "8px", color: "#339649" }} />
                  COMMIT LOG
                </span>
                <span className="t-meta" style={{ fontSize: "12px" }}>{filteredCommits.length} entries</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {filteredCommits.map((commit) => (
                  <CommitCard key={commit.sha} commit={commit} onUserClick={setSelectedUser} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

const pageStyles = {
  landing: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "80px 40px", textAlign: "center",
    minHeight: "60vh",
  },
  feedHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "16px",
  },
};

const sideStyles = {
  repoBlock: { padding: "2px 0" },
  repoFullName: {
    fontSize: "12px", fontWeight: "700",
    color: "#edeced", letterSpacing: "0.05em",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  repoSub: { fontSize: "12px", color: "#7aad84", marginTop: "2px" },
  repoDesc: { fontSize: "12px", color: "#666", marginTop: "6px", lineHeight: "1.5" },
};