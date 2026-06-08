"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function RepoForm({ onSubmit, loading }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

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
    } catch {
      return null;
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const parsed = parseGithubUrl(url);
    if (!parsed) {
      setError("invalid url format");
      return;
    }
    onSubmit(parsed.owner, parsed.repo);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            placeholder="github.com/owner/repo"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            style={styles.input}
            required
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading
            ? <FontAwesomeIcon icon={faSpinner} spin />
            : <FontAwesomeIcon icon={faSearch} />
          }
        </button>
      </form>
      {error && <p style={styles.error}>! {error}</p>}
    </div>
  );
}

const styles = {
  form: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    background: "#121212",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    padding: "0 10px",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#edeced",
    fontSize: "12px",
    padding: "10px 0",
    outline: "none",
    fontFamily: "inherit",
  },
  button: {
    width: "36px",
    height: "36px",
    background: "#339649",
    border: "none",
    borderRadius: "6px",
    color: "#121212",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    flexShrink: 0,
  },
  error: {
    color: "#ff6b6b",
    fontSize: "11px",
    margin: "8px 0 0",
    letterSpacing: "0.05em",
  },
};