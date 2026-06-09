"use client";
import { useState, useMemo, useEffect } from "react";

function getColor(count, max) {
  if (count === 0) return "#1a1a1a";
  const intensity = count / max;
  if (intensity <= 0.25) return "#1a4d2e";
  if (intensity <= 0.5)  return "#339649";
  if (intensity <= 0.75) return "#4db863";
  return "#80d98a";
}

const DAY_LABELS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ContributionGraph({ commits }) {
  const [filter, setFilter] = useState("year");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  

  const users = useMemo(() => {
    const seen = new Set();
    commits.forEach((c) => { const k = c.githubLogin || c.authorName; if (k) seen.add(k); });
    return ["all", ...Array.from(seen)];
  }, [commits]);

  const availableMonths = useMemo(() => {
    const seen = new Set();
    commits.forEach((c) => {
      const d = new Date(c.date);
      seen.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
    });
    return Array.from(seen).sort().reverse();
  }, [commits]);

  const availableYears = useMemo(() => {
    const seen = new Set();
    commits.forEach((c) => seen.add(new Date(c.date).getFullYear()));
    return Array.from(seen).sort().reverse();
  }, [commits]);
  useEffect(() => {
  if (availableYears.length > 0) {
    setSelectedYear(availableYears[0]);
  }
}, [availableYears]);

  const filteredCommits = useMemo(() => {
    if (selectedUser === "all") return commits;
    return commits.filter((c) => (c.githubLogin || c.authorName) === selectedUser);
  }, [commits, selectedUser]);

  const monthData = useMemo(() => {
    if (filter !== "month") return null;
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth   = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month-1, 1).getDay();
    const dayCounts = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dayCounts[`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`] = 0;
    }
    filteredCommits.forEach((c) => {
      const d = new Date(c.date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      if (dayCounts[k] !== undefined) dayCounts[k]++;
    });
    const max = Math.max(1, ...Object.values(dayCounts));
    const grid = [];
    let week = new Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      week.push({ day: d, key, count: dayCounts[key] });
      if (week.length === 7) { grid.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); grid.push(week); }
    return { grid, max, dayCounts, total: Object.values(dayCounts).reduce((a,b)=>a+b,0), year, month };
  }, [filteredCommits, filter, selectedMonth]);

  const yearData = useMemo(() => {
    if (filter !== "year") return null;
    const start = new Date(selectedYear, 0, 1);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(selectedYear, 11, 31);
    const allDays = [];
    const d = new Date(start);
    while (d <= end) { allDays.push(d.toISOString().split("T")[0]); d.setDate(d.getDate()+1); }
    const dayCounts = {};
    allDays.forEach((day) => (dayCounts[day] = 0));
    filteredCommits.forEach((c) => {
      const day = new Date(c.date).toISOString().split("T")[0];
      if (dayCounts[day] !== undefined) dayCounts[day]++;
    });
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i+7));
    const monthLabels = {};
    weeks.forEach((week, wi) => {
      const first = new Date(week[0]);
      if (first.getFullYear() !== selectedYear) return;
      const k = `${first.getFullYear()}-${first.getMonth()}`;
      if (!monthLabels[k]) monthLabels[k] = { wi, label: MONTH_NAMES[first.getMonth()] };
    });
    const max = Math.max(1, ...Object.values(dayCounts));
    const total = filteredCommits.filter((c) => new Date(c.date).getFullYear() === selectedYear).length;
    return { weeks, dayCounts, max, monthLabels, total };
  }, [filteredCommits, filter, selectedYear]);

  const weekData = useMemo(() => {
    if (filter !== "week") return null;
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate()-i); days.push(d.toISOString().split("T")[0]); }
    const dayCounts = {};
    days.forEach((d) => (dayCounts[d] = 0));
    filteredCommits.forEach((c) => { const day = new Date(c.date).toISOString().split("T")[0]; if (dayCounts[day] !== undefined) dayCounts[day]++; });
    const max = Math.max(1, ...Object.values(dayCounts));
    return { days, dayCounts, max, total: Object.values(dayCounts).reduce((a,b)=>a+b,0) };
  }, [filteredCommits, filter]);

  const total = filter === "month" ? monthData?.total : filter === "year" ? yearData?.total : weekData?.total;
  const periodLabel =
    filter === "week"  ? "last 7 days" :
    filter === "month" ? `${FULL_MONTHS[parseInt(selectedMonth.split("-")[1])-1]} ${selectedMonth.split("-")[0]}` :
    `${selectedYear}`;

  return (
    <div className="graph-wrapper">
      <div className="graph-toprow">
        <div>
          <div className="graph-heading">CONTRIBUTION GRAPH</div>
          <div className="graph-subheading">
            <span className="t-accent" style={{ fontWeight: 700 }}>{total}</span> commits
            {selectedUser !== "all" && <> by <span className="t-accent">@{selectedUser}</span></>}
            {" "}in {periodLabel}
          </div>
        </div>
        <div className="graph-controls">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="graph-select">
            {users.map((u) => <option key={u} value={u}>{u === "all" ? "All Contributors" : `@${u}`}</option>)}
          </select>
          {filter === "month" && (
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="graph-select">
              {availableMonths.map((m) => {
                const [y, mo] = m.split("-").map(Number);
                return <option key={m} value={m}>{FULL_MONTHS[mo-1]} {y}</option>;
              })}
            </select>
          )}
          {filter === "year" && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="graph-select">
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <div className="graph-toggle">
            {["week","month","year"].map((f) => (
              <button
                key={f}
                className={`graph-toggle-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="graph-container">
        {filter === "week"  && weekData  && <WeekView  data={weekData} />}
        {filter === "month" && monthData && <MonthCalendarView data={monthData} />}
        {filter === "year"  && yearData  && <YearView  data={yearData} />}
      </div>

      <div className="graph-legend">
        <span className="graph-legend-label">Less</span>
        {["#1a1a1a","#1a4d2e","#339649","#4db863","#80d98a"].map((c) => (
          <div key={c} className="graph-legend-box" style={{ background: c }} />
        ))}
        <span className="graph-legend-label">More</span>
      </div>
    </div>
  );
}

function WeekView({ data }) {
  const { days, dayCounts, max } = data;
  const [tooltip, setTooltip] = useState(null);
  return (
    <div>
      <div style={{ display:"flex", gap:"8px", alignItems:"flex-end" }}>
        {days.map((day) => {
          const count = dayCounts[day];
          const d = new Date(day);
          const label = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
          return (
            <div key={day} style={{ textAlign:"center", flex:1 }}>
              <div style={{ color:"#666", fontSize:"11px", marginBottom:"6px" }}>{label}</div>
              <div
                className="graph-week-cell"
                style={{ background: getColor(count,max), height:`${Math.max(20,(count/max)*100)}px` }}
                onMouseEnter={(e) => setTooltip({ x:e.clientX, y:e.clientY, day, count })}
                onMouseLeave={() => setTooltip(null)}
              />
              <div style={{ color:"#666", fontSize:"11px", marginTop:"6px" }}>{count}</div>
            </div>
          );
        })}
      </div>
      {tooltip && <Tooltip {...tooltip} />}
    </div>
  );
}

function MonthCalendarView({ data }) {
  const { grid, max } = data;
  const [tooltip, setTooltip] = useState(null);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px", marginBottom:"5px" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign:"center", color:"#666", fontSize:"11px", fontWeight:"700" }}>{d}</div>
        ))}
      </div>
      {grid.map((week, wi) => (
        <div key={wi} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"5px", marginBottom:"5px" }}>
          {week.map((cell, di) =>
            cell === null ? <div key={di} /> : (
              <div
                key={cell.key}
                className="graph-cal-cell"
                style={{ background: getColor(cell.count,max), border: cell.count > 0 ? "1px solid #339649" : "1px solid #2a2a2a" }}
                onMouseEnter={(e) => setTooltip({ x:e.clientX, y:e.clientY, day:cell.key, count:cell.count })}
                onMouseLeave={() => setTooltip(null)}
              >
                <span style={{ fontSize:"11px", color: cell.count > 0 ? "#edeced" : "#555" }}>{cell.day}</span>
                {cell.count > 0 && <span style={{ fontSize:"10px", color:"#80d98a", fontWeight:"700" }}>{cell.count}</span>}
              </div>
            )
          )}
        </div>
      ))}
      {tooltip && <Tooltip {...tooltip} />}
    </div>
  );
}

function YearView({ data }) {
  const { weeks, dayCounts, max, monthLabels } = data;
  const [tooltip, setTooltip] = useState(null);
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"flex", marginLeft:"32px", marginBottom:"4px" }}>
        {weeks.map((week, wi) => {
          const label = Object.values(monthLabels).find((m) => m.wi === wi);
          return (
            <div key={wi} style={{ width:"14px", marginRight:"3px", fontSize:"10px", color:"#666", flexShrink:0 }}>
              {label ? label.label : ""}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"3px", marginRight:"6px" }}>
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{ height:"14px", fontSize:"10px", color: i%2===1 ? "#666" : "transparent", lineHeight:"14px" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"flex", gap:"3px" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
              {week.map((day) => {
                const count = dayCounts[day] || 0;
                return (
                  <div
                    key={day}
                    style={{ width:"14px", height:"14px", borderRadius:"3px", background:getColor(count,max), cursor: count>0?"pointer":"default" }}
                    onMouseEnter={(e) => setTooltip({ x:e.clientX, y:e.clientY, day, count })}
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

function Tooltip({ x, y, day, count }) {
  return (
    <div style={{
      position:"fixed", left:x+12, top:y-36,
      background:"#1a1a1a", border:"1px solid #339649",
      borderRadius:"6px", padding:"6px 10px",
      fontSize:"12px", color:"#edeced",
      pointerEvents:"none", zIndex:9999, whiteSpace:"nowrap",
    }}>
      <strong style={{ color:"#339649" }}>{count} commit{count!==1?"s":""}</strong> · {day}
    </div>
  );
}