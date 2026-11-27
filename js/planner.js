(function () {

  const form = document.getElementById("taskForm");
  const formTitle = document.getElementById("formTitle");
  const taskIdInput = document.getElementById("taskId");
  const titleInput = document.getElementById("title");
  const subjectInput = document.getElementById("subject");
  const deadlineInput = document.getElementById("deadline");
  const notesInput = document.getElementById("notes");
  const saveBtn = document.getElementById("saveBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const filterForm = document.getElementById("filterForm");
  const searchInput = document.getElementById("searchInput");
  const filterSubject = document.getElementById("filterSubject");
  const filterPriority = document.getElementById("filterPriority");
  const filterStatus = document.getElementById("filterStatus");

  const taskList = document.getElementById("taskList");
  const taskCount = document.getElementById("taskCount");
  const emptyMessage = document.getElementById("emptyMessage");

  if (!form || !taskList) return;

  function matchesFilters(task) {
    const query = searchInput.value.trim().toLowerCase();
    if (query && !task.title.toLowerCase().includes(query)) return false;

    if (filterSubject.value !== "all" &&
        task.subject.toLowerCase() !== filterSubject.value) return false;

    if (filterPriority.value !== "all" &&
        task.priority !== filterPriority.value) return false;

    const status = filterStatus.value;
    if (status === "pending" && task.done) return false;
    if (status === "done" && !task.done) return false;
    if (status === "overdue" && !isOverdue(task)) return false;

    return true;
  }

  function compareTasks(a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  }

  function refreshSubjectFilter(tasks) {
    const previous = filterSubject.value;
    const subjects = new Map();

    tasks.forEach(function (task) {
      const key = task.subject.toLowerCase();
      if (!subjects.has(key)) subjects.set(key, task.subject);
    });

    filterSubject.innerHTML = "";
    filterSubject.appendChild(new Option("All subjects", "all"));

    Array.from(subjects.entries())
      .sort(function (a, b) { return a[1].localeCompare(b[1]); })
      .forEach(function (entry) {
        filterSubject.appendChild(new Option(entry[1], entry[0]));
      });

    filterSubject.value = subjects.has(previous) ? previous : "all";
  }

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function makeButton(label, action, extraClass, taskTitle) {
    const button = makeEl("button", extraClass || "", label);
    button.type = "button";
    button.dataset.action = action;
    button.setAttribute("aria-label", label + ": " + taskTitle);
    return button;
  }

  function createTaskItem(task) {
    const overdue = isOverdue(task);

    const item = makeEl("li", "task-item priority-" + task.priority);
    if (task.done) item.classList.add("done");
    if (overdue) item.classList.add("overdue");
    item.dataset.id = task.id;

    const main = makeEl("div", "task-main");
    main.appendChild(makeEl("h3", "task-title", task.title));

    const meta = makeEl("div", "task-meta");
    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    meta.appendChild(makeEl("span", "badge badge-" + task.priority, priorityLabel + " priority"));
    meta.appendChild(makeEl("span", "", task.subject));
    meta.appendChild(makeEl("span", "", "Deadline: " + formatDate(task.deadline)));
    meta.appendChild(makeEl("span", "", describeDue(task)));
    if (overdue) meta.appendChild(makeEl("span", "badge badge-overdue", "Overdue"));
    main.appendChild(meta);

    if (task.notes) main.appendChild(makeEl("p", "task-notes", task.notes));

    const actions = makeEl("div", "task-actions");
    actions.appendChild(makeButton(task.done ? "Undo" : "Complete", "toggle", "", task.title));
    actions.appendChild(makeButton("Edit", "edit", "", task.title));
    actions.appendChild(makeButton("Delete", "delete", "delete-btn", task.title));

    item.appendChild(main);
    item.appendChild(actions);
    return item;
  }

  function render() {
    const allTasks = TaskStore.getAll();
    refreshSubjectFilter(allTasks);

    const visible = allTasks.filter(matchesFilters).sort(compareTasks);

    taskList.innerHTML = "";
    visible.forEach(function (task) {
      taskList.appendChild(createTaskItem(task));
    });

    taskCount.textContent = allTasks.length === 0
      ? ""
      : "Showing " + visible.length + " of " + allTasks.length +
        (allTasks.length === 1 ? " task" : " tasks");

    if (allTasks.length === 0) {
      emptyMessage.textContent = "No tasks yet. Fill in the form above to add your first one.";
    } else if (visible.length === 0) {
      emptyMessage.textContent = "No tasks match your filters. Try clearing them.";
    }
    emptyMessage.hidden = visible.length > 0;
  }

  function enterEditMode(task) {
    taskIdInput.value = task.id;
    titleInput.value = task.title;
    subjectInput.value = task.subject;
    deadlineInput.value = task.deadline;
    notesInput.value = task.notes || "";

    const radio = form.querySelector('input[name="priority"][value="' + task.priority + '"]');
    if (radio) radio.checked = true;

    formTitle.textContent = "Edit task";
    saveBtn.textContent = "Update task";
    cancelEditBtn.hidden = false;
    clearTaskFormErrors();

    form.scrollIntoView({ behavior: "smooth", block: "start" });
    titleInput.focus();
  }

  function exitEditMode() {
    form.reset();
    taskIdInput.value = "";
    formTitle.textContent = "Add a task";
    saveBtn.textContent = "Save task";
    cancelEditBtn.hidden = true;
    clearTaskFormErrors();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const result = validateTaskForm();
    if (!result.valid) return;

    if (taskIdInput.value) {
      TaskStore.update(taskIdInput.value, result.data);
    } else {
      TaskStore.add(result.data);
    }

    exitEditMode();
    render();
  });

  cancelEditBtn.addEventListener("click", exitEditMode);

  // Handle buttons on dynamically added task cards.
  taskList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const item = button.closest(".task-item");
    const id = item.dataset.id;
    const action = button.dataset.action;

    if (action === "toggle") {
      TaskStore.toggleDone(id);
      render();
    } else if (action === "edit") {
      const task = TaskStore.get(id);
      if (task) enterEditMode(task);
    } else if (action === "delete") {
      if (confirm("Delete this task? This cannot be undone.")) {
        TaskStore.remove(id);
        if (taskIdInput.value === id) exitEditMode();
        render();
      }
    }
  });

  filterForm.addEventListener("input", render);
  filterForm.addEventListener("change", render);
  filterForm.addEventListener("submit", function (event) {
    event.preventDefault();
  });
  // Render after the browser finishes resetting the filters.
  filterForm.addEventListener("reset", function () {
    setTimeout(render, 0);
  });

  render();
})();
