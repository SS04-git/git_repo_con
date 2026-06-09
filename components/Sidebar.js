"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faClock } from "@fortawesome/free-solid-svg-icons";

export default function Sidebar({ children, showRecentsLink = true }) {
  const pathname = usePathname();
  const onRecents = pathname === "/recents";

  return (
    <aside className="sidebar">
      {/* Logo — always goes home */}
      <Link href="/" className="sidebar-logo" onClick={() => window.location.href = "/"}>
        <FontAwesomeIcon icon={faCode} style={{ color: "#339649", fontSize: "14px" }} />
        <span className="t-logo">
          COMMIT<span className="t-accent">_</span>LENS
        </span>
      </Link>

      {/* Recents link */}
      {showRecentsLink && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            <Link
              href="/recents"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                color: onRecents ? "#339649" : "#666",
                background: onRecents ? "#0d2e16" : "transparent",
                border: onRecents ? "1px solid #339649" : "1px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <FontAwesomeIcon icon={faClock} style={{ fontSize: "12px" }} />
              RECENTS
            </Link>
          </div>
        </>
      )}

      {/* Page-specific sidebar content */}
      {children && (
        <>
          <div className="sidebar-divider" />
          {children}
        </>
      )}
    </aside>
  );
}