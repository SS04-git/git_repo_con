"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark, faBuilding, faLocationDot,
  faLink, faArrowUpRightFromSquare
} from "@fortawesome/free-solid-svg-icons";

export default function UserModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.close} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <img src={user.avatar_url} alt={user.login} style={styles.avatar} />
        <h2 style={styles.name}>{user.name || user.login}</h2>
        <p style={styles.login}>@{user.login}</p>

        {user.bio && <p style={styles.bio}>{user.bio}</p>}

        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statNum}>{user.public_repos}</span>
            <span style={styles.statLabel}>Repos</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNum}>{user.followers}</span>
            <span style={styles.statLabel}>Followers</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNum}>{user.following}</span>
            <span style={styles.statLabel}>Following</span>
          </div>
        </div>

        {user.company && (
          <p style={styles.detail}>
            <FontAwesomeIcon icon={faBuilding} style={styles.detailIcon} />
            {user.company}
          </p>
        )}
        {user.location && (
          <p style={styles.detail}>
            <FontAwesomeIcon icon={faLocationDot} style={styles.detailIcon} />
            {user.location}
          </p>
        )}
        {user.blog && (
  <p style={styles.detail}>
    <FontAwesomeIcon icon={faLink} style={styles.detailIcon} />
    <a
      href={user.blog.startsWith("http")
        ? user.blog
        : `https://${user.blog}`}
      target="_blank"
      rel="noreferrer"
      style={styles.link}
    >
      {user.blog}
    </a>
  </p>
)}

        <a href={user.html_url} target="_blank" rel="noreferrer" style={styles.profileBtn}>
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ marginRight: "8px" }} />
          View GitHub Profile
        </a>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#1a1a1a",
    border: "2px solid #339649",
    borderRadius: "14px",
    padding: "36px 32px",
    maxWidth: "400px", width: "90%",
    textAlign: "center",
    position: "relative",
    color: "#edeced",
  },
  close: {
    position: "absolute", top: "14px", right: "14px",
    background: "none", border: "none",
    color: "#edeced", fontSize: "18px", cursor: "pointer",
  },
  avatar: {
    width: "90px", height: "90px", borderRadius: "50%",
    border: "3px solid #339649", marginBottom: "14px",
  },
  name: { margin: "0 0 4px", fontSize: "22px", color: "#edeced" },
  login: { color: "#339649", margin: "0 0 12px", fontSize: "15px" },
  bio: { color: "#adc9b0", fontSize: "14px", margin: "0 0 20px" },
  stats: {
    display: "flex", justifyContent: "center", gap: "28px",
    margin: "0 0 20px",
    padding: "14px 0",
    borderTop: "1px solid #2a2a2a",
    borderBottom: "1px solid #2a2a2a",
  },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontSize: "20px", fontWeight: "700", color: "#339649" },
  statLabel: { fontSize: "12px", color: "#7aad84" },
  detail: {
    color: "#adc9b0", fontSize: "14px", margin: "6px 0",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  },
  detailIcon: { color: "#339649", fontSize: "13px" },
  link: { color: "#339649" },
  profileBtn: {
    display: "inline-flex", alignItems: "center",
    marginTop: "20px",
    padding: "10px 24px",
    background: "#339649",
    color: "#121212",
    borderRadius: "8px",
    fontWeight: "700",
    textDecoration: "none",
    fontSize: "14px",
  },
};