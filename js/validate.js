function setFieldError(input, errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = message;

  if (input) {
    input.classList.toggle("invalid", Boolean(message));
    input.classList.toggle("valid", !message);
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
}

function resetField(input, errorId) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.textContent = "";
  if (input) {
    input.classList.remove("invalid", "valid");
    input.removeAttribute("aria-invalid");
  }
}

function attachLiveValidation(input, checkFn, errorId) {
  if (!input) return;
  input.addEventListener("blur", function () {
    setFieldError(input, errorId, checkFn(input.value));
  });
  input.addEventListener("input", function () {
    if (input.classList.contains("invalid")) {
      setFieldError(input, errorId, checkFn(input.value));
    }
  });
}

function checkTitle(value) {
  const text = value.trim();
  if (!text) return "Please enter a task title.";
  if (text.length < 3) return "Title must be at least 3 characters.";
  if (text.length > 80) return "Title must be 80 characters or fewer.";
  if (!/\p{L}/u.test(text)) return "Title must include at least one letter.";
  return "";
}

function checkSubject(value) {
  const text = value.trim();
  if (!text) return "Please enter a subject.";
  if (text.length > 40) return "Subject must be 40 characters or fewer.";
  if (!/\p{L}/u.test(text)) return "Subject must include at least one letter, not only numbers.";
  return "";
}

function checkDeadline(value) {
  if (!value) return "Please choose a deadline.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
    return "Please enter a valid date.";
  }
  const year = Number(value.slice(0, 4));
  if (year < 2020 || year > 2100) return "Choose a date between 2020 and 2100.";
  return "";
}

// Allow Unicode letters and common name punctuation.
const NAME_BAD_CHARS = /[^\p{L}\s'.\-]/u;

function checkName(value) {
  const text = value.trim();
  if (!text) return "Please enter your name.";
  if (/\d/.test(text)) return "Name cannot contain numbers.";
  if (NAME_BAD_CHARS.test(text)) {
    return "Name can only contain letters, spaces, apostrophes, hyphens and dots.";
  }
  if (!/^\p{L}/u.test(text)) return "Name must start with a letter.";
  if (text.replace(/[^\p{L}]/gu, "").length < 2) return "Name must have at least 2 letters.";
  if (text.length > 50) return "Name must be 50 characters or fewer.";
  return "";
}

function checkEmail(value) {
  const text = value.trim();
  if (!text) return "Please enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "Please enter a valid email, like you@example.com.";
  }
  return "";
}

function checkTopic(value) {
  return value ? "" : "Please choose a topic.";
}

function checkMessage(value) {
  const text = value.trim();
  if (!text) return "Please write a message.";
  if (text.length < 10) return "Message must be at least 10 characters.";
  if (text.length > 500) return "Message must be 500 characters or fewer.";
  return "";
}

function validateTaskForm() {
  const title = document.getElementById("title");
  const subject = document.getElementById("subject");
  const deadline = document.getElementById("deadline");
  const notes = document.getElementById("notes");
  const priorityInput = document.querySelector('input[name="priority"]:checked');

  const errors = {
    title: checkTitle(title.value),
    subject: checkSubject(subject.value),
    deadline: checkDeadline(deadline.value),
    priority: priorityInput ? "" : "Please choose a priority."
  };

  setFieldError(title, "titleError", errors.title);
  setFieldError(subject, "subjectError", errors.subject);
  setFieldError(deadline, "deadlineError", errors.deadline);
  setFieldError(null, "priorityError", errors.priority);

  if (errors.title) title.focus();
  else if (errors.subject) subject.focus();
  else if (errors.deadline) deadline.focus();

  const valid = !errors.title && !errors.subject && !errors.deadline && !errors.priority;

  return {
    valid: valid,
    data: valid
      ? {
          title: title.value.trim(),
          subject: subject.value.trim(),
          deadline: deadline.value,
          priority: priorityInput.value,
          notes: notes.value.trim()
        }
      : null
  };
}

function clearTaskFormErrors() {
  resetField(document.getElementById("title"), "titleError");
  resetField(document.getElementById("subject"), "subjectError");
  resetField(document.getElementById("deadline"), "deadlineError");
  resetField(null, "priorityError");
}

(function () {
  if (document.getElementById("taskForm")) {
    attachLiveValidation(document.getElementById("title"), checkTitle, "titleError");
    attachLiveValidation(document.getElementById("subject"), checkSubject, "subjectError");
    attachLiveValidation(document.getElementById("deadline"), checkDeadline, "deadlineError");

    document.querySelectorAll('input[name="priority"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        setFieldError(null, "priorityError", "");
      });
    });
  }

  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return;

  const fields = [
    { el: document.getElementById("contactName"), check: checkName, error: "contactNameError" },
    { el: document.getElementById("contactEmail"), check: checkEmail, error: "contactEmailError" },
    { el: document.getElementById("contactTopic"), check: checkTopic, error: "contactTopicError" },
    { el: document.getElementById("contactMessage"), check: checkMessage, error: "contactMessageError" }
  ];
  const success = document.getElementById("contactSuccess");

  fields.forEach(function (field) {
    attachLiveValidation(field.el, field.check, field.error);
  });
  fields[0].el.addEventListener("input", function () {
    if (NAME_BAD_CHARS.test(fields[0].el.value)) {
      setFieldError(fields[0].el, fields[0].error, checkName(fields[0].el.value));
    }
  });
  fields[2].el.addEventListener("change", function () {
    setFieldError(fields[2].el, fields[2].error, checkTopic(fields[2].el.value));
  });

  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();
    success.hidden = true;

    let firstBad = null;
    fields.forEach(function (field) {
      const message = field.check(field.el.value);
      setFieldError(field.el, field.error, message);
      if (message && !firstBad) firstBad = field.el;
    });

    if (firstBad) {
      firstBad.focus();
      return;
    }

    // No backend: this only confirms valid input.
    contactForm.reset();
    fields.forEach(function (field) {
      resetField(field.el, field.error);
    });
    success.hidden = false;
  });
})();
