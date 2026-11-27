(function () {
  const duration = document.getElementById("studyDuration");
  const time = document.getElementById("studyTime");
  const progress = document.getElementById("studyProgress");
  const start = document.getElementById("studyStart");
  const reset = document.getElementById("studyReset");
  const guard = document.getElementById("studyGuard");
  const distractions = document.getElementById("studyDistractions");
  const status = document.getElementById("studyStatus");
  if (!duration) return;

  let total = Number(duration.value) * 60000;
  let remaining = total;
  let endsAt = 0;
  let interval = null;
  let switches = 0;
  let started = false;

  function message(text, alert = false) {
    status.textContent = text;
    status.classList.toggle("is-alert", alert);
  }

  function renderTimer() {
    const seconds = Math.ceil(remaining / 1000);
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    time.textContent = minutes + ":" + String(seconds % 60).padStart(2, "0");
    progress.max = total;
    progress.value = total - remaining;
    distractions.textContent = switches;
    duration.disabled = started;
    start.textContent = interval !== null ? "Pause" : started ? "Resume" : "Start focus";
  }

  function stopClock() {
    clearInterval(interval);
    interval = null;
  }

  function tick() {
    remaining = Math.max(0, endsAt - Date.now());
    if (remaining === 0) {
      stopClock();
      started = false;
      message("Session complete! Take a short break.");
    }
    renderTimer();
  }

  function resetTimer() {
    stopClock();
    total = Number(duration.value) * 60000;
    remaining = total;
    switches = 0;
    started = false;
    message("Ready to focus.");
    renderTimer();
  }

  start.addEventListener("click", function () {
    if (interval !== null) {
      tick();
      if (interval === null) return;
      stopClock();
      message("Session paused.");
    } else {
      if (remaining === 0) resetTimer();
      started = true;
      endsAt = Date.now() + remaining;
      interval = setInterval(tick, 200);
      message("Focus session in progress.");
    }
    renderTimer();
  });

  reset.addEventListener("click", resetTimer);
  duration.addEventListener("change", resetTimer);

  // A hidden page may be another tab, a minimised window or a locked screen.
  document.addEventListener("visibilitychange", function () {
    if (interval === null) return;
    tick();
    if (interval === null || !document.hidden) return;
    switches++;
    if (guard.checked) {
      stopClock();
      message("You left the study tab. Timer paused — press Resume when you're ready.", true);
    } else {
      message("You left the study tab. The timer is still running.", true);
    }
    renderTimer();
  });

  start.disabled = false;
  reset.disabled = false;
  renderTimer();
})();

(function () {
  const grid = document.getElementById("weekGrid");
  if (!grid) return;
  const range = document.getElementById("weekRange");
  const summary = document.getElementById("weekSummary");
  const status = document.getElementById("weekStatus");
  const print = document.getElementById("weekPrint");
  const download = document.getElementById("weekExport");

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function monday(date) {
    return addDays(date, -((date.getDay() + 6) % 7));
  }

  function dateKey(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  let week = monday(startOfToday());

  function weekTasks() {
    const from = dateKey(week);
    const to = dateKey(addDays(week, 6));
    return TaskStore.getAll().filter(task => task.deadline >= from && task.deadline <= to)
      .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.title.localeCompare(b.title));
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderWeek() {
    const tasks = weekTasks();
    range.textContent = formatDate(dateKey(week)) + " – " + formatDate(dateKey(addDays(week, 6)));
    const completed = tasks.filter(task => task.done).length;
    summary.textContent = completed + " of " + tasks.length + " tasks completed";
    grid.replaceChildren();

    for (let i = 0; i < 7; i++) {
      const date = addDays(week, i);
      const key = dateKey(date);
      const day = element("article", "week-day");
      if (key === dateKey(startOfToday())) day.classList.add("is-today");
      const heading = element("h4", "", date.toLocaleDateString("en-IN", { weekday: "long" }) + " ");
      const label = element("time", "", date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
      label.dateTime = key;
      heading.append(label);
      day.append(heading);
      const due = tasks.filter(task => task.deadline === key);
      if (!due.length) day.append(element("p", "week-empty", "No tasks due"));
      else {
        const list = element("ul");
        due.forEach(task => {
          const item = element("li", task.done ? "week-task-done" : "");
          item.append(element("span", "week-task-title", task.title));
          item.append(element("span", "week-task-meta", task.subject + " · " + task.priority + " priority · " + (task.done ? "Completed" : "Pending")));
          list.append(item);
        });
        day.append(list);
      }
      grid.append(day);
    }
    download.disabled = tasks.length === 0;
    print.disabled = false;
    status.textContent = "";
  }

  function escapeText(value) {
    return String(value ?? "").replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
  }

  // Calendar lines must fold at 75 UTF-8 bytes, not 75 characters.
  function foldLine(line) {
    const encoder = new TextEncoder();
    let result = "", bytes = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (bytes + size > 75) {
        result += "\r\n ";
        bytes = 1;
      }
      result += character;
      bytes += size;
    }
    return result;
  }

  function makeCalendar(tasks) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MaxTrack//Weekly Plan//EN", "CALSCALE:GREGORIAN"];
    tasks.forEach(task => {
      const date = parseLocalDate(task.deadline);
      const next = dateKey(addDays(date, 1)).replace(/-/g, "");
      lines.push("BEGIN:VEVENT", "UID:" + encodeURIComponent(task.id) + "@maxtrack.local", "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + task.deadline.replace(/-/g, ""), "DTEND;VALUE=DATE:" + next,
        "SUMMARY:" + escapeText(task.title),
        "DESCRIPTION:" + escapeText("Subject: " + task.subject + "\nPriority: " + task.priority + "\nStatus: " + (task.done ? "Completed" : "Pending") + (task.notes ? "\nNotes: " + task.notes : "")),
        "TRANSP:TRANSPARENT", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.map(foldLine).join("\r\n") + "\r\n";
  }

  document.getElementById("weekPrevious").addEventListener("click", () => { week = addDays(week, -7); renderWeek(); });
  document.getElementById("weekNext").addEventListener("click", () => { week = addDays(week, 7); renderWeek(); });
  document.getElementById("weekToday").addEventListener("click", () => { week = monday(startOfToday()); renderWeek(); });
  document.addEventListener("maxtrack:tasks-rendered", renderWeek);
  window.addEventListener("storage", event => { if (event.key === STORAGE_KEY || event.key === null) renderWeek(); });
  window.addEventListener("beforeprint", renderWeek);
  print.addEventListener("click", () => { renderWeek(); window.print(); });

  download.addEventListener("click", function () {
    const tasks = weekTasks();
    if (!tasks.length) return;
    const file = new Blob([makeCalendar(tasks)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "MaxTrack-" + dateKey(week) + ".ics";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Calendar file prepared. Import it into your calendar app.";
  });

  renderWeek();
})();
