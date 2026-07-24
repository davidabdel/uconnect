/* ============================================================
   UConnect — behaviour
   Vanilla JS, no dependencies.
   ============================================================ */

/*
 * Form endpoint. The owner will wire this to Formspree / a webhook later.
 * It must accept a POST of JSON: { name, email, task }
 * While it stays "REPLACE_ME", submit is treated as success after validation
 * (no network request is made).
 */
const FORM_ENDPOINT = "REPLACE_ME";

(function () {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     1. CTA smooth-scroll to the form
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-scroll]").forEach(function (cta) {
    cta.addEventListener("click", function (e) {
      const target = document.querySelector("#contact");
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  /* ----------------------------------------------------------
     2. Form: validate, POST JSON, swap in confirmation
     ---------------------------------------------------------- */
  const form = document.getElementById("task-form");
  const successBox = document.getElementById("form-success");
  const errorEl = document.getElementById("form-error");

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function validate(data) {
    if (!data.name.trim()) return "Add your name so I know who I'm talking to.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      return "That email doesn't look right — mind checking it?";
    if (!data.task.trim()) return "Tell me the task — even one line is enough.";
    return null;
  }

  function succeed() {
    // Replace the form (not the whole section) with the confirmation box.
    form.hidden = true;
    successBox.hidden = false;
    // Move focus to the confirmation for screen-reader + keyboard users.
    successBox.focus();
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();

      const data = {
        name: form.name.value,
        email: form.email.value,
        task: form.task.value,
      };

      const problem = validate(data);
      if (problem) {
        showError(problem);
        // Also let native constraint UI point at the first invalid field.
        if (!form.reportValidity()) return;
        return;
      }

      // Placeholder endpoint: treat as success without hitting the network.
      if (FORM_ENDPOINT === "REPLACE_ME") {
        succeed();
        return;
      }

      // Real submission.
      const btn = form.querySelector(".btn--submit");
      if (btn) btn.disabled = true;

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Bad response");
          succeed();
        })
        .catch(function () {
          // Never clear the user's text on failure.
          if (btn) btn.disabled = false;
          showError(
            "Couldn't send that just now — check your connection and try again."
          );
        });
    });
  }

  /* ----------------------------------------------------------
     3. Scroll reveal (fade-up) — once per section, no re-trigger.
        Fully disabled under reduced motion.
     ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target); // once only
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
