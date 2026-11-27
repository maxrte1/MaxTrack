(function () {
  const statTotal = document.getElementById("statTotal");
  const statDone = document.getElementById("statDone");
  const statSoon = document.getElementById("statSoon");
  const statDue = document.getElementById("statDue");
  const subjectProgress = document.getElementById("subjectProgress");
  const upcomingList = document.getElementById("upcomingList");

  if (!statTotal) return;

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function showStats(tasks) {
    const total = tasks.length;
    const done = tasks.filter(function (t) { return t.done; }).length;

    const soon = tasks.filter(function (t) {
      const days = daysUntil(t.deadline);
      return !t.done && days >= 0 && days <= 3;
    }).length;

    const overdue = tasks.filter(isOverdue).length;

    statTotal.textContent = total;
    statDone.textContent = done;
    statSoon.textContent = soon;
    statDue.textContent = overdue;

    const card = statDue.closest(".stat-card");
    if (card) card.classList.toggle("has-overdue", overdue > 0);
  }

  function showSubjectProgress(tasks) {
    if (tasks.length === 0) return;

    // Treat different capitalizations as the same subject.
    const groups = new Map();
    tasks.forEach(function (task) {
      const key = task.subject.toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { name: task.subject, total: 0, done: 0 });
      }
      const group = groups.get(key);
      group.total++;
      if (task.done) group.done++;
    });

    subjectProgress.innerHTML = "";

    Array.from(groups.values())
      .sort(function (a, b) { return a.name.localeCompare(b.name); })
      .forEach(function (group) {
        const percent = Math.round((group.done / group.total) * 100);

        const row = makeEl("div", "progress-row");

        const head = makeEl("div", "progress-head");
        head.appendChild(makeEl("span", "", group.name));
        head.appendChild(
          makeEl("span", "", group.done + " of " + group.total + " done (" + percent + "%)")
        );

        const track = makeEl("div", "progress-track");
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", group.name + " progress");
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-valuenow", String(percent));

        const fill = makeEl("div", "progress-fill");
        fill.style.width = percent + "%";
        track.appendChild(fill);

        row.appendChild(head);
        row.appendChild(track);
        subjectProgress.appendChild(row);
      });
  }

  function showUpcoming(tasks) {
    const pending = tasks
      .filter(function (t) { return !t.done; })
      .sort(function (a, b) { return a.deadline.localeCompare(b.deadline); })
      .slice(0, 5);

    if (pending.length === 0) {
      upcomingList.innerHTML = "";
      const message = tasks.length === 0
        ? "Nothing due yet."
        : "All caught up. No pending tasks!";
      upcomingList.appendChild(makeEl("li", "empty-message", message));
      return;
    }

    upcomingList.innerHTML = "";
    pending.forEach(function (task) {
      const item = makeEl("li");
      item.appendChild(makeEl("strong", "", task.title));
      item.appendChild(
        makeEl("div", "task-meta",
          task.subject + " | " + formatDate(task.deadline) + " | " + describeDue(task))
      );
      upcomingList.appendChild(item);
    });
  }

  const tasks = TaskStore.getAll();
  showStats(tasks);
  showSubjectProgress(tasks);
  showUpcoming(tasks);
})();
