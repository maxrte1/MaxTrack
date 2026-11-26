/* ==========================================================
   storage.js - saves and loads tasks in the browser (localStorage)
   Also holds the date helpers used by planner.js and dashboard.js.
   Must be loaded BEFORE planner.js and dashboard.js.
   ========================================================== */

const STORAGE_KEY = "maxtrack.tasks";

/* A task looks like this:
   {
     id: "k3j2h1ab",
     title: "Finish Maths assignment",
     subject: "Maths",
     deadline: "2026-11-30",      // YYYY-MM-DD from <input type="date">
     priority: "high",            // high | medium | low
     notes: "Chapters 3 and 4",
     done: false,
     createdAt: "2026-11-25T10:00:00.000Z"
   } */

const TaskStore = {
  // Read every task. Returns [] if nothing is saved or the data is broken.
  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Could not read saved tasks:", error);
      return [];
    }
  },

  // Write the whole array back. Returns true if it worked.
  saveAll(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Could not save tasks:", error);
      alert("Your browser blocked saving. Tasks will be lost when you close the page.");
      return false;
    }
  },

  get(id) {
    return this.getAll().find((task) => task.id === id) || null;
  },

  add(data) {
    const tasks = this.getAll();
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: data.title,
      subject: data.subject,
      deadline: data.deadline,
      priority: data.priority,
      notes: data.notes,
      done: false,
      createdAt: new Date().toISOString()
    };
    tasks.push(task);
    this.saveAll(tasks);
    return task;
  },

  update(id, changes) {
    const tasks = this.getAll();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...changes };
    this.saveAll(tasks);
    return tasks[index];
  },

  remove(id) {
    const tasks = this.getAll().filter((task) => task.id !== id);
    this.saveAll(tasks);
  },

  toggleDone(id) {
    const task = this.get(id);
    if (!task) return null;
    return this.update(id, { done: !task.done });
  }
};

/* ---------- Date helpers ---------- */

// "2026-11-30" -> a Date at local midnight (avoids timezone shifts)
function parseLocalDate(text) {
  const parts = String(text).split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Whole days from today to the deadline (negative = already passed)
function daysUntil(deadline) {
  const due = parseLocalDate(deadline);
  if (!due) return 0;
  return Math.round((due - startOfToday()) / 86400000);
}

// A task is overdue if it is not done and its deadline has passed
function isOverdue(task) {
  return !task.done && daysUntil(task.deadline) < 0;
}

function formatDate(deadline) {
  const date = parseLocalDate(deadline);
  if (!date) return deadline;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// Human-friendly text such as "Due tomorrow" or "3 days overdue"
function describeDue(task) {
  if (task.done) return "Completed";
  const days = daysUntil(task.deadline);
  if (days < 0) {
    const late = Math.abs(days);
    return late === 1 ? "1 day overdue" : late + " days overdue";
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return "Due in " + days + " days";
}