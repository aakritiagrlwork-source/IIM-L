"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "Not started" | "In progress" | "Completed";
type Priority = "Low" | "Medium" | "High";
type Task = {
  id: string;
  title: string;
  description: string;
  project: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "taskflow-tasks-v1";
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = {
  title: "", description: "", project: "", startDate: today(), dueDate: "",
  priority: "Medium" as Priority, status: "Not started" as Status, progress: 0
};

function dateLabel(value: string) {
  if (!value) return "No due date";
  return new Date(value + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function getTiming(task: Task) {
  if (task.status === "Completed") return "Completed";
  if (!task.dueDate) return "No deadline";
  const now = today();
  if (task.dueDate < now) return "Overdue";
  if (task.dueDate === now) return "Due today";
  const diff = Math.ceil((new Date(task.dueDate + "T00:00:00").getTime() - new Date(now + "T00:00:00").getTime()) / 86400000);
  if (diff <= 3) return "Due soon";
  return "On track";
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("All tasks");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("due");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTasks(JSON.parse(saved));
    } catch {
      setNotice("We couldn't load saved tasks from this browser.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === "In progress").length,
    completed: tasks.filter(t => t.status === "Completed").length,
    overdue: tasks.filter(t => getTiming(t) === "Overdue").length,
    average: tasks.length ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : 0
  }), [tasks]);

  const visibleTasks = useMemo(() => {
    let result = tasks.filter(task => {
      const q = search.toLowerCase();
      const matchesSearch = [task.title, task.description, task.project].some(v => v.toLowerCase().includes(q));
      const timing = getTiming(task);
      const matchesFilter =
        filter === "All tasks" ||
        (filter === "My day" && (task.dueDate === today() || task.startDate === today()) && task.status !== "Completed") ||
        (filter === "Upcoming" && task.dueDate >= today() && task.status !== "Completed") ||
        (filter === "Overdue" && timing === "Overdue") ||
        (filter === "In progress" && task.status === "In progress") ||
        (filter === "Completed" && task.status === "Completed");
      return matchesSearch && matchesFilter;
    });
    result = [...result].sort((a, b) => {
      if (sort === "priority") return ({ High: 0, Medium: 1, Low: 2 }[a.priority] - ({ High: 0, Medium: 1, Low: 2 }[b.priority]));
      if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });
    return result;
  }, [tasks, filter, search, sort]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title, description: task.description, project: task.project,
      startDate: task.startDate, dueDate: task.dueDate, priority: task.priority,
      status: task.status, progress: task.progress
    });
    setShowForm(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    const status: Status = form.progress === 100 ? "Completed" : form.progress > 0 && form.status === "Not started" ? "In progress" : form.status;
    const progress = status === "Completed" ? 100 : form.progress;
    if (editingId) {
      setTasks(current => current.map(t => t.id === editingId ? { ...t, ...form, status, progress, updatedAt: now } : t));
      setNotice("Task updated successfully.");
    } else {
      setTasks(current => [{ ...form, title: form.title.trim(), status, progress, id: crypto.randomUUID(), createdAt: now, updatedAt: now }, ...current]);
      setNotice("New task added.");
    }
    setShowForm(false);
    setTimeout(() => setNotice(""), 2600);
  }

  function updateProgress(task: Task, value: number) {
    const progress = Math.max(0, Math.min(100, value));
    const status: Status = progress === 100 ? "Completed" : progress > 0 ? "In progress" : "Not started";
    setTasks(current => current.map(t => t.id === task.id ? { ...t, progress, status, updatedAt: new Date().toISOString() } : t));
  }

  function deleteTask(id: string) {
    if (window.confirm("Delete this task? This cannot be undone.")) {
      setTasks(current => current.filter(t => t.id !== id));
    }
  }

  const filters = ["All tasks", "My day", "Upcoming", "Overdue", "In progress", "Completed"];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">t</span><span>taskflow</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {filters.map((item, i) => (
            <button key={item} className={`nav-item ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}>
              <span className="nav-icon">{["▦", "☀", "◷", "⚑", "◉", "✓"][i]}</span>
              <span>{item}</span>
              {item === "Overdue" && stats.overdue > 0 && <span className="nav-count">{stats.overdue}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card">
            <span className="tip-icon">✦</span>
            <strong>Small steps add up.</strong>
            <p>Keep moving your priorities forward, one task at a time.</p>
          </div>
          <div className="local-note"><span className="online-dot" /> Saved on this device</div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{filter}</strong></div>
          <div className="top-actions"><span className="today-label">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span><div className="avatar">A</div></div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
              <h1>{filter === "My day" ? "Make today count." : filter === "All tasks" ? "Good things get done." : filter}</h1>
              <p className="subtitle">A clear view of what matters, what’s next and how far you’ve come.</p>
            </div>
            <button className="primary-btn" onClick={openNew}><span>＋</span> Add new task</button>
          </section>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Total tasks</span><span className="stat-icon lilac">▦</span></div><strong>{stats.total}</strong><small>Across your workspace</small></div>
            <div className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon blue">◉</span></div><strong>{stats.active}</strong><small>Currently moving forward</small></div>
            <div className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon green">✓</span></div><strong>{stats.completed}</strong><small>Tasks across the finish line</small></div>
            <div className="stat-card"><div className="stat-top"><span>Overdue</span><span className="stat-icon orange">⚑</span></div><strong>{stats.overdue}</strong><small>Need your attention</small></div>
          </section>

          <section className="progress-banner">
            <div className="progress-copy"><div className="progress-heading">Your overall progress <strong>{stats.average}%</strong></div><p>Every completed task is a step forward.</p><div className="overall-track"><span style={{ width: `${stats.average}%` }} /></div></div>
            <div className="progress-art"><span>✦</span><span>↗</span><span>✧</span></div>
          </section>

          <section className="tasks-section">
            <div className="section-heading"><div><h2>Tasks</h2><p>Keep track of your priorities and timelines.</p></div><span className="task-total">{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</span></div>
            <div className="toolbar">
              <div className="search-wrap"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or projects..." /></div>
              <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort tasks"><option value="due">Sort: Due date</option><option value="priority">Sort: Priority</option><option value="created">Sort: Recently added</option></select>
            </div>

            {!ready ? <div className="empty-state">Loading your workspace...</div> : visibleTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-illustration">✦</div><h3>{search || filter !== "All tasks" ? "No matching tasks" : "Your task list starts here"}</h3><p>{search || filter !== "All tasks" ? "Try another search or choose a different view." : "Add your first task, set a timeline and start tracking your progress."}</p>{!search && filter === "All tasks" && <button className="primary-btn" onClick={openNew}>＋ Add your first task</button>}</div>
            ) : (
              <div className="task-list">
                {visibleTasks.map(task => {
                  const timing = getTiming(task);
                  return <article className="task-card" key={task.id}>
                    <div className="task-main">
                      <button className={`status-check ${task.status === "Completed" ? "checked" : ""}`} onClick={() => updateProgress(task, task.status === "Completed" ? 0 : 100)} aria-label="Toggle task completion">{task.status === "Completed" ? "✓" : ""}</button>
                      <div className="task-info">
                        <div className="task-title-row"><h3 className={task.status === "Completed" ? "done-title" : ""}>{task.title}</h3><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></div>
                        {task.description && <p className="task-description">{task.description}</p>}
                        <div className="task-meta">
                          {task.project && <span className="project-tag">▧ {task.project}</span>}
                          <span className={`due-label ${timing === "Overdue" ? "late" : timing === "Due today" ? "today-due" : ""}`}>◷ {dateLabel(task.dueDate)}</span>
                          <span className={`timing-pill timing-${timing.toLowerCase().replaceAll(" ", "-")}`}>{timing}</span>
                        </div>
                      </div>
                    </div>
                    <div className="task-progress">
                      <div className="progress-label"><span>Progress</span><strong>{task.progress}%</strong></div>
                      <div className="mini-track"><span style={{ width: `${task.progress}%` }} /></div>
                      <div className="task-footer"><span>{task.status}</span><div className="task-actions"><button onClick={() => openEdit(task)}>Edit</button><button className="delete-action" onClick={() => deleteTask(task.id)}>Delete</button></div></div>
                    </div>
                  </article>;
                })}
              </div>
            )}
          </section>
          <footer className="footer-note">Made for focused days. <span>✦</span></footer>
        </div>
      </section>

      {notice && <div className="toast">{notice}</div>}

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <form className="task-modal" onSubmit={saveTask}>
          <div className="modal-heading"><div><p className="eyebrow">{editingId ? "UPDATE YOUR WORK" : "MAKE IT HAPPEN"}</p><h2>{editingId ? "Edit task" : "Create a task"}</h2></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}>×</button></div>
          <label>Task name <span>*</span><input required autoFocus maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Prepare monthly communications plan" /></label>
          <label>Description <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add a few details or next steps..." /></label>
          <label>Project or category <input value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} placeholder="e.g. LifeLine, Website, Personal" /></label>
          <div className="form-grid">
            <label>Start date <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
            <label>Due date <input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>
            <label>Priority <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label>Status <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status, progress: e.target.value === "Completed" ? 100 : e.target.value === "Not started" ? 0 : Math.max(1, form.progress) })}><option>Not started</option><option>In progress</option><option>Completed</option></select></label>
          </div>
          <label className="progress-input-label">Progress <strong>{form.status === "Completed" ? 100 : form.progress}%</strong><input type="range" min="0" max="100" step="5" value={form.status === "Completed" ? 100 : form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value), status: Number(e.target.value) === 100 ? "Completed" : Number(e.target.value) > 0 ? "In progress" : "Not started" })} /></label>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-btn" type="submit">{editingId ? "Save changes" : "Create task"}</button></div>
        </form>
      </div>}
    </main>
  );
}
