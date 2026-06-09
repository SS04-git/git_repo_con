import { JetBrains_Mono } from "next/font/google";

const font = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata = {
  title: "GitHub Commit Viewer",
  description: "Monitor commits and contributors across any public GitHub repository",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>
        {children}
        <style>{`
          /* ── Reset ── */
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { font-size: 14px; scroll-behavior: smooth; }
          body {
            background: #121212;
            color: #edeced;
            font-family: inherit;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
          }

          /* ── Scanlines ── */
          body::before {
            content: "";
            position: fixed; inset: 0;
            background-image: repeating-linear-gradient(
              0deg, transparent, transparent 2px,
              rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px
            );
            pointer-events: none;
            z-index: 9999;
          }

          /* ══════════════════════════════════════════
             TYPOGRAPHY
          ══════════════════════════════════════════ */
          .t-logo    { font-size: 15px; font-weight: 700; letter-spacing: 0.15em; color: #edeced; }
          .t-heading { font-size: 22px; font-weight: 700; letter-spacing: 0.1em;  color: #edeced; }
          .t-label   { font-size: 10px; font-weight: 700; letter-spacing: 0.2em;  color: #555; }
          .t-body    { font-size: 13px; color: #edeced; line-height: 1.6; }
          .t-meta    { font-size: 12px; color: #7aad84; }
          .t-dim     { font-size: 12px; color: #666; }
          .t-accent  { color: #339649; }
          .t-danger  { color: #ff6b6b; }

          /* ══════════════════════════════════════════
             LAYOUT
          ══════════════════════════════════════════ */
          .app-shell   { display: flex; min-height: 100vh; }
          .main-scroll { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow-y: auto; height: 100vh; }

          /* ══════════════════════════════════════════
             SIDEBAR
          ══════════════════════════════════════════ */
          .sidebar {
            width: 264px; min-width: 264px;
            background: #0e0e0e;
            border-right: 1px solid #1f1f1f;
            display: flex; flex-direction: column;
            height: 100vh; position: sticky; top: 0;
            overflow: hidden; flex-shrink: 0;
          }
          .sidebar-logo {
            padding: 18px 16px;
            display: flex; align-items: center; gap: 10px;
            border-bottom: 1px solid #1f1f1f;
            cursor: pointer; text-decoration: none;
            transition: background 0.15s;
            flex-shrink: 0;
          }
          .sidebar-logo:hover { background: #141414; }
          .sidebar-section { padding: 14px 16px; flex-shrink: 0; }
          .sidebar-divider { height: 1px; background: #1f1f1f; flex-shrink: 0; }
          .sidebar-scroll  { flex: 1; overflow-y: auto; min-height: 0; }
          .sidebar-scroll-inner { padding: 0 16px 12px; }

          /* ══════════════════════════════════════════
             TOP BAR
          ══════════════════════════════════════════ */
          .topbar {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            background: #0e0e0e;
            border-bottom: 1px solid #1f1f1f;
            position: sticky; top: 0; z-index: 50;
            gap: 14px;
            height: 56px;
          }

          /* ══════════════════════════════════════════
             CARDS / SURFACES
          ══════════════════════════════════════════ */
          .card {
            background: #0e0e0e;
            border: 1px solid #1f1f1f;
            border-radius: 8px;
            transition: border-color 0.15s;
          }
          .card:hover { border-color: #339649; }
          .card:hover .click-hint { opacity: 1 !important; }

          /* ══════════════════════════════════════════
             BUTTONS
          ══════════════════════════════════════════ */
          .btn-icon {
            width: 36px; height: 36px;
            background: #339649; border: none; border-radius: 6px;
            color: #121212; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; flex-shrink: 0; font-family: inherit;
            transition: opacity 0.15s;
          }
          .btn-icon:hover { opacity: 0.85; }
          .btn-icon.lg { width: 48px; height: 48px; font-size: 16px; border-radius: 8px; }
          .btn-ghost {
            background: none; border: none; color: #666; cursor: pointer;
            font-family: inherit; font-size: 12px; padding: 4px 8px;
            transition: color 0.15s; letter-spacing: 0.1em;
          }
          .btn-ghost:hover { color: #edeced; }
          .btn-type {
            padding: 6px 14px; background: transparent;
            border: 1px solid #2a2a2a; border-radius: 6px;
            color: #666; font-size: 11px; font-weight: 700;
            letter-spacing: 0.12em; cursor: pointer;
            font-family: inherit; transition: all 0.15s; white-space: nowrap;
          }
          .btn-type.active { background: #0d2e16; border-color: #339649; color: #339649; }

          /* ══════════════════════════════════════════
             FORM INPUTS
          ══════════════════════════════════════════ */
          .field-input {
            width: 100%; background: #0e0e0e;
            border: 1px solid #2a2a2a; border-radius: 6px;
            color: #edeced; font-size: 13px;
            padding: 9px 14px; outline: none;
            font-family: inherit; transition: border-color 0.15s;
          }
          .field-input:focus { border-color: #339649; }
          .field-input::placeholder { color: #444; }
          .field-label {
            font-size: 11px; font-weight: 700;
            letter-spacing: 0.12em; color: #666;
            margin-bottom: 6px; display: block;
          }

          /* ══════════════════════════════════════════
             CONTRIBUTORS
          ══════════════════════════════════════════ */
          .contrib-row {
            display: flex; align-items: center;
            width: 100%; background: transparent;
            border: 1px solid transparent; border-radius: 6px;
            padding: 8px 10px; cursor: pointer;
            margin-bottom: 3px; color: #edeced;
            text-align: left; transition: all 0.15s;
            font-family: inherit;
          }
          .contrib-row:hover  { background: #141414; }
          .contrib-row.active { background: #0d2e16; border-color: #339649; }
          .contrib-name {
            font-size: 12px; color: #edeced; flex: 1;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .contrib-badge {
            font-size: 10px; background: #1a1a1a; color: #339649;
            padding: 2px 7px; border-radius: 4px; font-weight: 700;
            border: 1px solid #2a2a2a; flex-shrink: 0;
          }
          .contrib-avatar {
            width: 18px; height: 18px; border-radius: 50%;
            margin-right: 8px; object-fit: cover; flex-shrink: 0;
          }

          /* ══════════════════════════════════════════
             STAT ROWS
          ══════════════════════════════════════════ */
          .stat-row {
            display: flex; align-items: center;
            gap: 10px; padding: 7px 0;
            border-bottom: 1px solid #1a1a1a;
          }
          .stat-icon  { color: #339649; font-size: 11px; width: 14px; flex-shrink: 0; }
          .stat-label { font-size: 12px; color: #666; letter-spacing: 0.08em; flex: 1; }
          .stat-value { font-size: 13px; color: #edeced; font-weight: 700; }

          /* ══════════════════════════════════════════
             RECENTS
          ══════════════════════════════════════════ */
          .recent-entry {
            padding: 12px 16px; border-bottom: 1px solid #1a1a1a;
            cursor: pointer; transition: background 0.15s;
            border-left: 2px solid transparent;
          }
          .recent-entry:hover { background: #141414; border-left-color: #339649; }
          .recent-name { font-size: 13px; font-weight: 700; color: #edeced; }
          .recent-desc { font-size: 12px; color: #666; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .recent-meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
          .recent-meta-item { font-size: 11px; color: #555; display: flex; align-items: center; gap: 4px; }
          .recent-time { font-size: 11px; color: #444; margin-left: auto; }
          .recent-delete {
            background: none; border: none; color: #333;
            cursor: pointer; padding: 2px 4px;
            transition: color 0.15s; flex-shrink: 0;
          }
          .recent-delete:hover { color: #ff6b6b; }

          /* ══════════════════════════════════════════
             TAGS / BADGES
          ══════════════════════════════════════════ */
          .tag {
            font-size: 11px; color: #7aad84;
            background: #0d2e16; border: 1px solid #1a4d2e;
            border-radius: 4px; padding: 2px 8px;
            display: inline-flex; align-items: center; gap: 4px;
          }
          .status-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: #339649; flex-shrink: 0; display: inline-block;
          }
          .error-box {
            margin: 16px 24px; padding: 12px 16px;
            background: #1a0000; border: 1px solid #ff6b6b;
            border-radius: 6px; font-size: 12px; color: #adc9b0;
          }

          /* ══════════════════════════════════════════
             SECTION WRAPPER
          ══════════════════════════════════════════ */
          .section { padding: 24px; border-bottom: 1px solid #1a1a1a; }

          /* ══════════════════════════════════════════
             COMMIT CARD
          ══════════════════════════════════════════ */
          .commit-card {
            display: flex; align-items: center; gap: 16px;
            background: #1a1a1a; border: 1px solid #2a2a2a;
            border-radius: 8px; padding: 14px 18px;
            margin-bottom: 6px; transition: border-color 0.15s;
          }
          .commit-card:hover { border-color: #339649; }
          .commit-avatar-col { flex-shrink: 0; }
          .commit-avatar {
            width: 40px; height: 40px; border-radius: 50%;
            border: 2px solid #339649; cursor: pointer; object-fit: cover;
          }
          .commit-avatar-fallback {
            width: 40px; height: 40px; border-radius: 50%;
            background: #339649;
            display: flex; align-items: center; justify-content: center;
          }
          .commit-info { flex: 1; min-width: 0; }
          .commit-message {
            color: #edeced; font-size: 13px; font-weight: 500;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            margin-bottom: 4px;
          }
          .commit-meta { color: #7aad84; font-size: 12px; }
          .commit-author-btn {
            background: none; border: none; color: #339649;
            cursor: pointer; font-weight: 700; font-size: 12px;
            padding: 0; text-decoration: underline; font-family: inherit;
          }
          .commit-sha {
            color: #339649; font-family: monospace; font-size: 12px;
            text-decoration: none; flex-shrink: 0;
            display: flex; align-items: center; gap: 5px;
          }
          .commit-date { font-size: 12px; color: #7aad84; white-space: nowrap; }

          /* ══════════════════════════════════════════
             CONTRIBUTION GRAPH
          ══════════════════════════════════════════ */
          .graph-wrapper {
            background: #1a1a1a; border: 1px solid #2a2a2a;
            border-radius: 10px; padding: 20px;
          }
          .graph-toprow {
            display: flex; justify-content: space-between;
            align-items: flex-start; flex-wrap: wrap;
            gap: 14px; margin-bottom: 20px;
          }
          .graph-heading { color: #edeced; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 4px; }
          .graph-subheading { color: #7aad84; font-size: 12px; }
          .graph-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
          .graph-select {
            padding: 7px 11px; background: #121212;
            border: 1px solid #2a2a2a; border-radius: 6px;
            color: #edeced; font-size: 12px; cursor: pointer;
            outline: none; font-family: inherit;
            transition: border-color 0.15s;
          }
          .graph-select:focus { border-color: #339649; }
          .graph-toggle {
            display: flex; border: 1px solid #2a2a2a;
            border-radius: 6px; overflow: hidden;
          }
          .graph-toggle-btn {
            padding: 7px 13px; background: transparent; color: #666;
            border: none; cursor: pointer; font-size: 11px;
            font-weight: 700; letter-spacing: 0.1em; font-family: inherit;
            transition: all 0.15s;
          }
          .graph-toggle-btn.active { background: #339649; color: #121212; }
          .graph-toggle-btn:not(.active):hover { color: #edeced; }
          .graph-container { overflow-x: auto; }
          .graph-week-cell {
            width: 100%; border-radius: 4px;
            cursor: pointer; min-height: 20px; transition: opacity 0.15s;
          }
          .graph-cal-cell {
            border-radius: 4px; padding: 5px 3px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            min-height: 40px; cursor: pointer;
          }
          .graph-legend {
            display: flex; align-items: center; gap: 6px;
            margin-top: 14px; justify-content: flex-end;
          }
          .graph-legend-box { width: 12px; height: 12px; border-radius: 2px; }
          .graph-legend-label { color: #666; font-size: 11px; }

          /* ══════════════════════════════════════════
             SCROLLBAR
          ══════════════════════════════════════════ */
          .custom-scroll::-webkit-scrollbar { width: 4px; }
          .custom-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
          .custom-scroll::-webkit-scrollbar-thumb:hover { background: #339649; }

          /* ══════════════════════════════════════════
             REPO CARDS FOR GITHUB
          ══════════════════════════════════════════ */
          .repo-card {
          width: 100%;
          background: #0e0e0e;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          padding: 12px 14px;
          color: #edeced;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          }

          .repo-card:hover {
            border-color: #339649;
          }

          /* ══════════════════════════════════════════
             ANIMATIONS
          ══════════════════════════════════════════ */
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          .pulse { animation: pulse 1.5s ease-in-out infinite; }
        `}</style>
      </body>
    </html>
  );
}