"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch, faSpinner, faLock, faLockOpen,
  faCodeBranch, faKey, faChevronDown, faChevronUp, faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";

export default function RepoForm({ onSubmit, loading, mode = "topbar" }) {
  const [url, setUrl]                   = useState("");
  const [repoType, setRepoType]         = useState("public");
  const [token, setToken]               = useState("");
  const [branch, setBranch]             = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError]               = useState("");
  const [githubConnected, setGithubConnected] = useState(false);
  const [repos, setRepos] = useState([]);

  useEffect(() => {
  const connected =
    document.cookie.includes("github_connected=true");
  setGithubConnected(connected);
  if (connected) { setRepoType("oauth"); } }, []);

  useEffect(() => {
  if (!githubConnected) return;

  fetch("/api/github/repos")
    .then((r) => r.json())
    .then((data) => { if (Array.isArray(data)) { setRepos(data); } });
}, [githubConnected]);

  function parseGithubUrl(input) {
    try {
      const cleaned = input.trim().replace(/\.git$/, "");
      if (cleaned.includes("github.com")) {
        const urlObj = new URL(cleaned.startsWith("http") ? cleaned : "https://" + cleaned);
        const parts = urlObj.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
      }
      const parts = cleaned.split("/").filter(Boolean);
      if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
      return null;
    } catch { return null; }
  }

  function handleSubmit(e) {
  e.preventDefault();
  setError("");

  if (repoType === "oauth") return;

  const parsed = parseGithubUrl(url);

  if (!parsed) {
    setError("Enter a valid GitHub URL");
    return;
  }

  if (repoType === "private" && !token) {
    setError("Token required for private repos");
    return;
  }

  onSubmit(parsed.owner, parsed.repo, {
    token: repoType === "private" ? token : "",
    branch,
  });
}


  const isLanding = mode === "landing";

  /* ── LANDING MODE ─────────────────────────── */
  if (isLanding) {
    return (
      <div style={{ width: "100%" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", marginBottom:"14px" }}>
            <button type="button" className={`btn-type ${repoType==="public"?"active":""}`}
              onClick={() => { setRepoType("public"); setShowAdvanced(false); }}>
              <FontAwesomeIcon icon={faLockOpen} style={{ marginRight:"6px", fontSize:"10px" }} />PUBLIC
            </button>
            <button type="button" className={`btn-type ${repoType==="private"?"active":""}`}
              onClick={() => { setRepoType("private"); setShowAdvanced(true); }}>
              <FontAwesomeIcon icon={faLock} style={{ marginRight:"6px", fontSize:"10px" }} />PRIVATE
            </button>
            <button type="button" className={`btn-type ${repoType==="oauth"?"active":""}`}
              onClick={() => {
              if (!githubConnected) { window.location.href = "/api/github/oauth"; return; }
              setRepoType("oauth"); setShowAdvanced(false); }} >
              <FontAwesomeIcon icon={faRightToBracket} style={{ marginRight:"6px", fontSize:"10px" }} />GITHUB
            </button>
          </div>

          {/* Big centred search row */}
          {repoType !== "oauth" && (
          <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", background:"#0e0e0e", border:"1px solid #339649", borderRadius:"8px", padding:"0 20px", }}>
          <input type="text" placeholder="github.com/owner/repo" value={url} onChange={(e) => 
          { setUrl(e.target.value); setError("");}}
         style={{ flex:1, background:"transparent", border:"none", color:"#edeced", fontSize:"16px", padding:"15px 0", outline:"none", fontFamily:"inherit", }} />
          </div>
          <button type="submit" disabled={loading} className="btn-icon lg">
           {loading ? ( <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
           <FontAwesomeIcon icon={faSearch} />
            )}
          </button>
          </div>
          )}

          {repoType === "oauth" && githubConnected && ( <>
          <div style={{ height: "48px", border: "1px solid #339649", borderRadius: "8px", display: "flex", 
            alignItems: "center", justifyContent: "center", color: "#339649",}}> CONNECTED TO GITHUB </div>
         <div style={{ marginTop: "14px", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", }} >
          {repos.map((repo) => (
        <button key={repo.id} type="button" className="repo-card"
          onClick={() => { const [owner, name] = repo.full_name.split("/");
            onSubmit(owner, name, {});  }} >
          <div>{repo.full_name}</div>
          <div className="t-meta">
            {repo.private ? "PRIVATE" : "PUBLIC"}
            {repo.language && ` · ${repo.language}`}
          </div>
        </button>
        ))}
        </div>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
        <button type="button" className="btn-type"
        onClick={() => { window.location.href = "/api/github/logout";
        }} > DISCONNECT
        </button>
        </div>
        </>
        )}

          {/* More options toggle */}
          {repoType === "private" && (
          <div style={{ display:"flex", justifyContent:"center", marginTop:"12px" }}>
            <button type="button" className="btn-ghost" onClick={() => setShowAdvanced(!showAdvanced)}>
              <FontAwesomeIcon icon={showAdvanced ? faChevronUp : faChevronDown} style={{ marginRight:"6px", fontSize:"10px" }} />
              {showAdvanced ? "HIDE OPTIONS" : "MORE OPTIONS"}
            </button>
          </div>
          )}

          {/* Advanced fields */}
          {showAdvanced && (
            <div style={{ width:"100%", maxWidth:"760px", margin:"14px auto 0", display:"flex", flexDirection:"column", gap:"10px" }}>
              <div>
                <label className="field-label">
                  <FontAwesomeIcon icon={faCodeBranch} style={{ marginRight:"6px", color:"#339649" }} />BRANCH
                </label>
                <input type="text" placeholder="main (optional)" value={branch}
                  onChange={(e) => setBranch(e.target.value)} className="field-input" style={{ width:"100%" }} />
              </div>
              <div>
                <label className="field-label">
                  <FontAwesomeIcon icon={faKey} style={{ marginRight:"6px", color:"#339649" }} />
                  PERSONAL ACCESS TOKEN
                  {repoType==="public" && <span style={{ color:"#444", fontWeight:400, fontSize:"10px" }}> (optional)</span>}
                </label>
                <input type="password"
                  placeholder={repoType==="private" ? "ghp_xxxxxxxxxxxx (required)" : "ghp_xxxxxxxxxxxx (raises rate limit)"}
                  value={token} onChange={(e) => setToken(e.target.value)} className="field-input" style={{ width:"100%" }} />
              </div>
            </div>
          )}
        </form>
        {error && <p style={{ color:"#ff6b6b", fontSize:"12px", marginTop:"10px", textAlign:"center" }}>! {error}</p>}
      </div>
    );
  }

  /* ── TOPBAR MODE ──────────────────────────── */
  return (
    <div style={{ width:"100%" }}>
      <form onSubmit={handleSubmit}>
        {/* Single inline row: [PUBLIC|PRIVATE] [url input ··· ] [branch?] [token?] [search btn] */}
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>

          {/* Public / Private toggle — right side of bar */}
          <div style={{ display:"flex", gap:"4px", flexShrink:0 }}>
            <button type="button" className={`btn-type ${repoType==="public"?"active":""}`}
              style={{ padding:"5px 10px", fontSize:"10px" }}
              onClick={() => setRepoType("public")}>
              <FontAwesomeIcon icon={faLockOpen} style={{ marginRight:"5px", fontSize:"9px" }} />PUB
            </button>
            <button type="button" className={`btn-type ${repoType==="private"?"active":""}`}
              style={{ padding:"5px 10px", fontSize:"10px" }}
              onClick={() => setRepoType("private")}>
              <FontAwesomeIcon icon={faLock} style={{ marginRight:"5px", fontSize:"9px" }} />PRIV
            </button>
            <button type="button" className={`btn-type ${repoType==="oauth"?"active":""}`} style={{ padding:"5px 10px", fontSize:"10px" }}
            onClick={() => { if (!githubConnected) { window.location.href = "/api/github/oauth"; return;} setRepoType("oauth"); }}>GH 
            </button>
          </div>

          {/* URL input */}
          {repoType !== "oauth" && (
          <div style={{
            flex:1, display:"flex", alignItems:"center",
            background:"#0e0e0e", border:"1px solid #2a2a2a",
            borderRadius:"6px", padding:"0 14px",
            transition:"border-color 0.15s", minWidth:0,
          }}>
            <input
              type="text"
              placeholder="github.com/owner/repo"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              style={{
                flex:1, background:"transparent", border:"none",
                color:"#edeced", fontSize:"13px", padding:"8px 0",
                outline:"none", fontFamily:"inherit", minWidth:0,
              }}
            />
          </div>
          )}

          {/* Branch — only for private */}
          {repoType === "private" && (
            <div style={{
              display:"flex", alignItems:"center",
              background:"#0e0e0e", border:"1px solid #2a2a2a",
              borderRadius:"6px", padding:"0 10px", gap:"6px",
              flexShrink:0,
            }}>
              <FontAwesomeIcon icon={faCodeBranch} style={{ color:"#339649", fontSize:"10px", flexShrink:0 }} />
              <input
                type="text"
                placeholder="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{
                  background:"transparent", border:"none",
                  color:"#edeced", fontSize:"12px", padding:"8px 0",
                  outline:"none", fontFamily:"inherit", width:"140px",
                }}
              />
            </div>
          )}

          {/* Token — only for private */}
          {repoType === "private" && (
            <div style={{
              display:"flex", alignItems:"center",
              background:"#0e0e0e", border:"1px solid #2a2a2a",
              borderRadius:"6px", padding:"0 10px", gap:"6px",
              flexShrink:0,
            }}>
              <FontAwesomeIcon icon={faKey} style={{ color:"#339649", fontSize:"10px", flexShrink:0 }} />
              <input
                type="password"
                placeholder="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{
                  background:"transparent", border:"none",
                  color:"#edeced", fontSize:"12px", padding:"8px 0",
                  outline:"none", fontFamily:"inherit", width:"140px",
                }}
              />
            </div>
          )}

          {/* Search button */}
          {repoType !== "oauth" && (
          <button type="submit" disabled={loading} className="btn-icon" style={{ flexShrink:0 }}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
          </button>
          )}
        </div>
      </form>

      {error && <p style={{ color:"#ff6b6b", fontSize:"11px", marginTop:"6px" }}>! {error}</p>}
    </div>
  );
}