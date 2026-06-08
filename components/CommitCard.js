"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCodeCommit, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function CommitCard({ commit, onUserClick }) {
  const shortSha = commit.sha.substring(0, 7);
  const date = new Date(commit.date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  const firstLine = commit.message.split("\n")[0];

  return (
    <div style={styles.card}>
      {/* Avatar */}
      <div style={styles.avatarCol}>
        {commit.userDetail?.avatar_url ? (
          <img
            src={commit.userDetail.avatar_url}
            alt={commit.githubLogin}
            style={styles.avatar}
            onClick={() => commit.userDetail && onUserClick(commit.userDetail)}
          />
        ) : (
          <div style={styles.avatarFallback}>
            <FontAwesomeIcon icon={faUser} style={{ fontSize: "18px", color: "#121212" }} />
          </div>
        )}
      </div>

      {/* Commit info */}
      <div style={styles.info}>
        <p style={styles.message}>
          <FontAwesomeIcon icon={faCodeCommit} style={{ marginRight: "8px", color: "#339649", fontSize: "13px" }} />
          {firstLine}
        </p>
        <p style={styles.meta}>
          <span style={styles.author}>
            {commit.userDetail ? (
              <button style={styles.authorBtn} onClick={() => onUserClick(commit.userDetail)}>
                @{commit.githubLogin}
              </button>
            ) : (
              commit.authorName
            )}
          </span>
          {" · "}
          <span>{date}</span>
        </p>
      </div>

      {/* SHA link */}
      <a href={commit.htmlUrl} target="_blank" rel="noreferrer" style={styles.sha}>
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ marginRight: "5px", fontSize: "11px" }} />
        {shortSha}
      </a>
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "12px",
  },
  avatarCol: { flexShrink: 0 },
  avatar: {
    width: "44px", height: "44px",
    borderRadius: "50%",
    border: "2px solid #339649",
    cursor: "pointer",
    objectFit: "cover",
  },
  avatarFallback: {
    width: "44px", height: "44px",
    borderRadius: "50%",
    background: "#339649",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0 },
  message: {
    color: "#edeced", margin: "0 0 6px 0",
    fontSize: "15px", fontWeight: "500",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  meta: { color: "#7aad84", margin: 0, fontSize: "13px" },
  author: { fontWeight: "600" },
  authorBtn: {
    background: "none", border: "none",
    color: "#339649", cursor: "pointer",
    fontWeight: "700", fontSize: "13px", padding: 0,
    textDecoration: "underline",
  },
  sha: {
    color: "#339649", fontFamily: "monospace",
    fontSize: "13px", textDecoration: "none",
    flexShrink: 0, display: "flex", alignItems: "center",
  },
};