"use client";
import { useState, useMemo } from "react";

function getColor(count, max) {
  if (count === 0) return "#1a1a1a";
  const intensity = count / max;
  if (intensity <= 0.25) return "#1a4d2e";
  if (intensity <= 0.5)  return "#339649";
  if (intensity <= 0.75) return "#4db863";
  return "#80d98a";
}

function getIntensityLevel(count, max) {
  if (count === 0) return 0;

  const intensity = count / max;

  if (intensity <= 0.25) return 1;
  if (intensity <= 0.5) return 2;
  if (intensity <= 0.75) return 3;
  return 4;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ContributionGraph({ commits }) {
  const [filter, setFilter] = useState("year");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedIntensity, setSelectedIntensity] = useState(null);

  // Unique users
  const users = useMemo(() => {
    const seen = new Set();
    commits.forEach((c) => {
      const key = c.githubLogin || c.authorName;
      if (key) seen.add(key);
    });
    return ["all", ...Array.from(seen)];
  }, [commits]);

  // All available months that have commits
  const availableMonths = useMemo(() => {
    const seen = new Set();
    commits.forEach((c) => {
      const d = new Date(c.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      seen.add(key);
    });
    return Array.from(seen).sort().reverse(); // most recent first
  }, [commits]);

  // All available years that have commits
  const availableYears = useMemo(() => {
    const seen = new Set();
    commits.forEach((c) => seen.add(new Date(c.date).getFullYear()));
    return Array.from(seen).sort().reverse();
  }, [commits]);

  // Filter commits by selected user
  const filteredCommits = useMemo(() => {
    if (selectedUser === "all") return commits;
    return commits.filter(
      (c) => (c.githubLogin || c.authorName) === selectedUser
    );
  }, [commits, selectedUser]);

  // Build day counts for selected month view
  const monthData = useMemo(() => {
    if (filter !== "month") return null;
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

    // Build day count map
    const dayCounts = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dayCounts[key] = 0;
    }
    filteredCommits.forEach((c) => {
      const d = new Date(c.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (dayCounts[key] !== undefined) dayCounts[key]++;
    });

    const max = Math.max(1, ...Object.values(dayCounts));

    // Build calendar grid (weeks as rows)
    const grid = [];
    let week = new Array(firstDayOfWeek).fill(null); // pad start
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      week.push({ day: d, key, count: dayCounts[key] });
      if (week.length === 7) { grid.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null); // pad end
      grid.push(week);
    }

    const total = Object.values(dayCounts).reduce((a, b) => a + b, 0);
    return { grid, max, dayCounts, total, year, month };
  }, [filteredCommits, filter, selectedMonth]);

  // Build year view (GitHub-style 52-week grid)
  const yearData = useMemo(() => {
    if (filter !== "year") return null;

    const start = new Date(selectedYear, 0, 1);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday

    const end = new Date(selectedYear, 11, 31);

    const allDays = [];
    const d = new Date(start);
    while (d <= end) {
      allDays.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    const dayCounts = {};
    allDays.forEach((day) => (dayCounts[day] = 0));
    filteredCommits.forEach((c) => {
      const day = new Date(c.date).toISOString().split("T")[0];
      if (dayCounts[day] !== undefined) dayCounts[day]++;
    });

    // Group into weeks
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    // Month label positions
    const monthLabels = {};
    weeks.forEach((week, wi) => {
      const firstDay = new Date(week[0]);
      if (firstDay.getFullYear() !== selectedYear) return;
      const key = `${firstDay.getFullYear()}-${firstDay.getMonth()}`;
      if (!monthLabels[key]) {
        monthLabels[key] = { wi, label: MONTH_NAMES[firstDay.getMonth()] };
      }
    });

    const max = Math.max(1, ...Object.values(dayCounts));
    const total = filteredCommits.filter((c) => new Date(c.date).getFullYear() === selectedYear).length;

    return { weeks, dayCounts, max, monthLabels, total };
  }, [filteredCommits, filter, selectedYear]);

  // Week view (last 7 days)
  const weekData = useMemo(() => {
    if (filter !== "week") return null;
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    const dayCounts = {};
    days.forEach((d) => (dayCounts[d] = 0));
    filteredCommits.forEach((c) => {
      const day = new Date(c.date).toISOString().split("T")[0];
      if (dayCounts[day] !== undefined) dayCounts[day]++;
    });
    const max = Math.max(1, ...Object.values(dayCounts));
    const total = Object.values(dayCounts).reduce((a, b) => a + b, 0);
    return { days, dayCounts, max, total };
  }, [filteredCommits, filter]);

  const total = filter === "month" ? monthData?.total
    : filter === "year" ? yearData?.total
    : weekData?.total;

  const periodLabel = filter === "week" ? "last 7 days"
    : filter === "month" ? `${FULL_MONTH_NAMES[parseInt(selectedMonth.split("-")[1]) - 1]} ${selectedMonth.split("-")[0]}`
    : `${selectedYear}`;

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.heading}>Contribution Graph</h2>
          <p style={styles.subheading}>
            <span style={styles.accent}>{total}</span> commits
            {selectedUser !== "all" && <> by <span style={styles.accent}>@{selectedUser}</span></>}
            {" "}in {periodLabel}
          </p>
        </div>

        <div style={styles.controls}>
          {/* User filter */}
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} style={styles.select}>
            {users.map((u) => (
              <option key={u} value={u}>{u === "all" ? "All Contributors" : `@${u}`}</option>
            ))}
          </select>

          {/* Month picker — only shown in month view */}
          {filter === "month" && (
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.select}>
              {availableMonths.map((m) => {
                const [y, mo] = m.split("-").map(Number);
                return (
                  <option key={m} value={m}>
                    {FULL_MONTH_NAMES[mo - 1]} {y}
                  </option>
                );
              })}
            </select>
          )}

          {/* Year picker — only shown in year view */}
          {filter === "year" && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={styles.select}>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {/* Filter toggle */}
          <div style={styles.toggle}>
            {["week", "month", "year"].map((f) => (
              <button
                key={f}
                style={{ ...styles.toggleBtn, ...(filter === f ? styles.toggleActive : {}) }}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div style={styles.graphContainer}>
        {filter === "week" && weekData && (
  <WeekView
    data={weekData}
    selectedIntensity={selectedIntensity}
  />
)}

{filter === "month" && monthData && (
  <MonthCalendarView
    data={monthData}
    selectedIntensity={selectedIntensity}
  />
)}

{filter === "year" && yearData && (
  <YearView
    data={yearData}
    selectedIntensity={selectedIntensity}
  />
)}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
  <span style={styles.legendLabel}>Less</span>

  {["#1a1a1a", "#1a4d2e", "#339649", "#4db863", "#80d98a"].map((c, index) => (
    <div
      key={c}
      onClick={() =>
        setSelectedIntensity(
          selectedIntensity === index ? null : index
        )
      }
      style={{
        ...styles.legendBox,
        background: c,
        cursor: "pointer",
        border:
          selectedIntensity === index
            ? "2px solid #edeced"
            : "1px solid transparent",
      }}
    />
  ))}

  <span style={styles.legendLabel}>More</span>

  {selectedIntensity !== null && (
    <button
      onClick={() => setSelectedIntensity(null)}
      style={{
        marginLeft: "10px",
        background: "transparent",
        border: "1px solid #339649",
        color: "#339649",
        borderRadius: "4px",
        cursor: "pointer",
        padding: "2px 8px",
      }}
    >
      Clear
    </button>
  )}
</div>
    </div>
  );
}

// --- Week View ---
function WeekView({ data, selectedIntensity }) {
  const { days, dayCounts, max } = data;
  const [tooltip, setTooltip] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        {days.map((day) => {
          const count = dayCounts[day];
          const level = getIntensityLevel(count, max);
          const faded =
          selectedIntensity !== null &&
          level !== selectedIntensity;
          const d = new Date(day);
          const label = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
          return (
            <div key={day} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ color: "#7aad84", fontSize: "11px", marginBottom: "6px" }}>{label}</div>
              <div
                style={{
                  ...styles.weekCell,
                  background: getColor(count, max),
                  height: `${Math.max(20, (count / max) * 100)}px`,
                  opacity: faded ? 0.15 : 1,
                }}
                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, day, count })}
                onMouseLeave={() => setTooltip(null)}
              />
              <div style={{ color: "#7aad84", fontSize: "11px", marginTop: "6px" }}>{count}</div>
            </div>
          );
        })}
      </div>
      {tooltip && <Tooltip {...tooltip} />}
    </div>
  );
}

// --- Month Calendar View ---
function MonthCalendarView({ data, selectedIntensity }) {
  const { grid, max, year, month } = data;
  const [tooltip, setTooltip] = useState(null);

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "6px" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", color: "#7aad84", fontSize: "12px", fontWeight: "600" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {grid.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "6px" }}>
          {week.map((cell, di) => {
  if (cell === null) {
    return <div key={di} />;
  }

  const level = getIntensityLevel(cell.count, max);

  const faded =
    selectedIntensity !== null &&
    level !== selectedIntensity;

  return (
    <div
      key={cell.key}
      style={{
        ...styles.calCell,
        background: getColor(cell.count, max),
        border: cell.count > 0 ? "1px solid #339649" : "1px solid #2a2a2a",
        opacity: faded ? 0.15 : 1,
      }}
      onMouseEnter={(e) =>
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          day: cell.key,
          count: cell.count,
        })
      }
      onMouseLeave={() => setTooltip(null)}
    >
      <span
        style={{
          fontSize: "11px",
          color: cell.count > 0 ? "#edeced" : "#555",
        }}
      >
        {cell.day}
      </span>

      {cell.count > 0 && (
        <span
          style={{
            fontSize: "10px",
            color: "#80d98a",
            fontWeight: "700",
          }}
        >
          {cell.count}
        </span>
      )}
    </div>
  );
})}
        </div>
      ))}
      {tooltip && <Tooltip {...tooltip} />}
    </div>
  );
}

// --- Year View (GitHub-style) ---
function YearView({ data, selectedIntensity }) {
  const { weeks, dayCounts, max, monthLabels } = data;
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Month labels */}
      <div style={{ display: "flex", marginLeft: "32px", marginBottom: "4px" }}>
        {weeks.map((week, wi) => {
          const label = Object.values(monthLabels).find((m) => m.wi === wi);
          return (
            <div key={wi} style={{ width: "14px", marginRight: "3px", fontSize: "10px", color: "#7aad84", flexShrink: 0 }}>
              {label ? label.label : ""}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex" }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginRight: "6px" }}>
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{ height: "14px", fontSize: "10px", color: i % 2 === 1 ? "#7aad84" : "transparent", lineHeight: "14px" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "flex", gap: "3px" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {week.map((day) => {
                const count = dayCounts[day] || 0;
                const level = getIntensityLevel(count, max);
                const faded =
                selectedIntensity !== null &&
                level !== selectedIntensity;
                return (
                  <div
                    key={day}
                    style={{ width: "14px", height: "14px", borderRadius: "3px", background: getColor(count, max), 
                      cursor: count > 0 ? "pointer" : "default",  opacity: faded ? 0.15 : 1}}
                    onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, day, count })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tooltip && <Tooltip {...tooltip} />}
    </div>
  );
}

// --- Tooltip ---
function Tooltip({ x, y, day, count }) {
  return (
    <div style={{
      position: "fixed",
      left: x + 12, top: y - 36,
      background: "#1a1a1a",
      border: "1px solid #339649",
      borderRadius: "6px",
      padding: "6px 10px",
      fontSize: "12px",
      color: "#edeced",
      pointerEvents: "none",
      zIndex: 9999,
      whiteSpace: "nowrap",
    }}>
      <strong style={{ color: "#339649" }}>{count} commit{count !== 1 ? "s" : ""}</strong> · {day}
    </div>
  );
}

const styles = {
  wrapper: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "36px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  heading: { color: "#edeced", margin: "0 0 4px", fontSize: "18px" },
  subheading: { color: "#7aad84", margin: 0, fontSize: "13px" },
  accent: { color: "#339649", fontWeight: "700" },
  controls: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  select: {
    padding: "8px 12px",
    background: "#121212",
    border: "1px solid #339649",
    borderRadius: "8px",
    color: "#edeced",
    fontSize: "13px",
    cursor: "pointer",
    outline: "none",
  },
  toggle: {
    display: "flex",
    border: "1px solid #339649",
    borderRadius: "8px",
    overflow: "hidden",
  },
  toggleBtn: {
    padding: "8px 16px",
    background: "transparent",
    color: "#7aad84",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  toggleActive: {
    background: "#339649",
    color: "#121212",
  },
  graphContainer: { overflowX: "auto" },
  weekCell: {
    width: "100%",
    borderRadius: "6px",
    cursor: "pointer",
    minHeight: "20px",
    transition: "opacity 0.15s",
  },
  calCell: {
    borderRadius: "6px",
    padding: "6px 4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "16px",
    justifyContent: "flex-end",
  },
  legendBox: { width: "14px", height: "14px", borderRadius: "3px" },
  legendLabel: { color: "#7aad84", fontSize: "12px" },
};