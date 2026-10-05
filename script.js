/*=========================================================
    FOUJI BEAT COFFEE — script.js
    Multi-select product pills, single star rating,
    Google Sheets submission, success screen,
    floating live review popups
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* ── CONFIG ── */
  const CONFIG = {
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbxDemQKaqUnDlXnr0VEt2pW98wg9CNnjIF7jueLFdtLRTSeeJayppUOQFVJOaYHk4EM/exec",
    enableGoogleSheets: true,
    instagramUrl: "https://www.instagram.com/fouji_beat_coffee_",
    whatsappNumber: "919896772868",
    whatsappMessage: "Hi Fouji, I recently tried your product.",
  };

  /* ── DOM ── */
  const form           = document.getElementById("feedbackForm");
  const submitBtn      = document.getElementById("submitBtn");
  const feedbackCard   = document.getElementById("feedbackCard");
  const successCard    = document.getElementById("successCard");
  const errorCard      = document.getElementById("errorCard");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const toast          = document.getElementById("toast");
  const commentInput   = document.getElementById("comment");
  const charCount      = document.getElementById("charCount");
  const productHidden  = document.getElementById("product");
  const ratingHidden   = document.getElementById("rating");
  const nameInput      = document.getElementById("name");
  const phoneInput     = document.getElementById("phone");
  const thanksName     = document.getElementById("thanksName");
  const retryBtn       = document.getElementById("retryBtn");
  const anotherBtn     = document.getElementById("anotherBtn");
  const floatingReviews = document.getElementById("floatingReviews");
  const averageRating  = document.getElementById("averageRating");
  const totalReviews   = document.getElementById("totalReviews");

  const state = { products: [], rating: 0 };

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  function init() {
    setLinks();
    initPills();
    initStars();
    initCharCounter();
    loadLiveReviews();
    startFloatingReviews();

    form.addEventListener("submit", onSubmit);

    retryBtn.addEventListener("click", () => {
      errorCard.hidden = true;
      feedbackCard.hidden = false;
    });

    anotherBtn.addEventListener("click", resetForm);
  }

  /* ── LINKS ── */
  function setLinks() {
    const waURL = "https://wa.me/" + CONFIG.whatsappNumber +
      "?text=" + encodeURIComponent(CONFIG.whatsappMessage);
    const ig = document.getElementById("instagramLink");
    const wa = document.getElementById("whatsappLink");
    if (ig) ig.href = CONFIG.instagramUrl;
    if (wa) wa.href = waURL;
  }

  /* ── PRODUCT PILLS (multi-select) ── */
  function initPills() {
    document.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const val = pill.dataset.value;
        const idx = state.products.indexOf(val);
        if (idx === -1) {
          state.products.push(val);
          pill.classList.add("selected");
        } else {
          state.products.splice(idx, 1);
          pill.classList.remove("selected");
        }
        productHidden.value = state.products.join(", ");
        if (state.products.length > 0) setError("errProduct", "");
      });
    });
  }

  /* ── STAR RATING ── */
  function initStars() {
    const stars = document.querySelectorAll(".star");
    const label = document.getElementById("starLabel");
    const LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };

    stars.forEach((star, i) => {
      const val = i + 1;
      star.addEventListener("mouseenter", () => paintStars(stars, val));
      star.addEventListener("mouseleave", () => paintStars(stars, state.rating));
      star.addEventListener("click", () => {
        state.rating = val;
        ratingHidden.value = val;
        paintStars(stars, val);
        label.textContent = LABELS[val];
        setError("errRating", "");
      });
    });
  }

  function paintStars(stars, val) {
    stars.forEach((s, i) => s.classList.toggle("active", i < val));
  }

  /* ── CHAR COUNTER ── */
  function initCharCounter() {
    commentInput.addEventListener("input", () => {
      charCount.textContent = commentInput.value.length;
    });
  }

  /* ── VALIDATION ── */
  function validate() {
    let ok = true;

    if (nameInput.value.trim().length < 2) {
      setError("errName", "Please enter your name.");
      ok = false;
    } else setError("errName", "");

    if (phoneInput.value.trim().length < 10) {
      setError("errPhone", "Please enter a valid phone number.");
      ok = false;
    } else setError("errPhone", "");

    if (state.products.length === 0) {
      setError("errProduct", "Pick at least one product.");
      ok = false;
    } else setError("errProduct", "");

    if (state.rating === 0) {
      setError("errRating", "Please rate your experience.");
      ok = false;
    } else setError("errRating", "");

    return ok;
  }

  function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  /* ── SUBMIT ── */
  async function onSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      const firstError = document.querySelector(".field-error:not(:empty)");
      if (firstError) {
        firstError.closest(".field")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    submitBtn.disabled = true;
    loadingOverlay.hidden = false;

    const ua = navigator.userAgent;
    const payload = {
      name:    nameInput.value.trim(),
      phone:   phoneInput.value.trim(),
      product: state.products.join(", "),
      rating:  state.rating,
      comment: commentInput.value.trim(),
      browser: getBrowser(ua),
      device:  getDevice(ua),
    };

    if (CONFIG.enableGoogleSheets) {
      try {
        const body = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => body.append(k, String(v)));
        await fetch(CONFIG.appsScriptUrl, {
          method:  "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body:    body.toString(),
          mode:    "no-cors",
        });
      } catch (err) {
        console.warn("Sheet note:", err);
      }
    }

    await delay(800);
    loadingOverlay.hidden = true;
    submitBtn.disabled = false;

    showSuccess(payload.name);
  }

  function showSuccess(name) {
    feedbackCard.hidden = true;
    thanksName.textContent = name ? ", " + name.split(" ")[0] : "";
    successCard.hidden = false;
    successCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    form.reset();
    state.products = [];
    state.rating = 0;
    document.querySelectorAll(".pill.selected").forEach((p) => p.classList.remove("selected"));
    document.querySelectorAll(".star.active").forEach((s) => s.classList.remove("active"));
    const lbl = document.getElementById("starLabel");
    if (lbl) lbl.textContent = "Tap to rate";
    if (charCount) charCount.textContent = "0";
    successCard.hidden = true;
    feedbackCard.hidden = false;
    feedbackCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── TOAST ── */
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 3500);
  }

  /* ── HELPERS ── */
  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function getBrowser(ua) {
    if (ua.includes("Edg"))     return "Edge";
    if (ua.includes("OPR"))     return "Opera";
    if (ua.includes("Chrome"))  return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari"))  return "Safari";
    return "Other";
  }

  function getDevice(ua) {
    if (/Mobi|Android/i.test(ua)) return "Mobile";
    if (/Tablet|iPad/i.test(ua))  return "Tablet";
    return "Desktop";
  }

  /* ════════════════════════════════════════════
     LIVE REVIEWS — rating summary
  ════════════════════════════════════════════ */
  function loadLiveReviews() {
    // Static seed values shown instantly
    // These update dynamically when real data loads
    if (averageRating) averageRating.textContent = "4.9";
    if (totalReviews)  totalReviews.textContent  = "1,284";

    // Optionally fetch live from Apps Script
    if (!CONFIG.enableGoogleSheets) return;
    fetch(CONFIG.appsScriptUrl + "?action=getStats")
      .then(r => r.json())
      .then(data => {
        if (data.avgRating && averageRating) averageRating.textContent = parseFloat(data.avgRating).toFixed(1);
        if (data.totalCount && totalReviews)  totalReviews.textContent  = Number(data.totalCount).toLocaleString();
      })
      .catch(() => { /* silently keep seed values */ });
  }

  /* ════════════════════════════════════════════
     FLOATING LIVE REVIEW POPUPS
  ════════════════════════════════════════════ */
  const DEMO_REVIEWS = [
    { name: "Rahul",   rating: 5, message: "Amazing taste. Will order again!" },
    { name: "Priya",   rating: 5, message: "Best Beat Coffee I've ever had." },
    { name: "Mohit",   rating: 4, message: "Loved the Mango syrup — so refreshing." },
    { name: "Sneha",   rating: 5, message: "The Rose syrup is absolutely divine!" },
    { name: "Arjun",   rating: 5, message: "Fouji coffee is now part of my daily routine." },
    { name: "Nisha",   rating: 4, message: "Great flavours, fast delivery too!" },
    { name: "Vikram",  rating: 5, message: "Jaljeera syrup is a game changer." },
    { name: "Kavita",  rating: 5, message: "My whole family loves the syrups!" },
  ];

  const TIMES = [
    "Just now", "1 min ago", "2 min ago",
    "3 min ago", "5 min ago", "8 min ago",
  ];

  // Track which reviews have been shown to avoid repetition
  let reviewQueue = [];

  function getNextReview() {
    // Rebuild shuffled queue when empty
    if (reviewQueue.length === 0) {
      reviewQueue = [...DEMO_REVIEWS].sort(() => Math.random() - 0.5);
    }
    return reviewQueue.pop();
  }

  function startFloatingReviews() {
    if (!floatingReviews) return;

    // Don't show popups over the form — only show in hero area
    // Popups are positioned in bottom-right corner, non-intrusive
    setTimeout(() => {
      spawnReview();
      setInterval(spawnReview, 10000);
    }, 4000);
  }

  function spawnReview() {
    if (!floatingReviews) return;

    // Max 2 popups visible at once
    if (floatingReviews.querySelectorAll(".review-popup").length >= 2) return;

    const data       = getNextReview();
    const randomTime = TIMES[Math.floor(Math.random() * TIMES.length)];
    const stars      = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);

    const card = document.createElement("div");
    card.className = "review-popup";

    card.innerHTML = `
      <div class="review-top">
        <div class="review-name">${escHtml(data.name)}</div>
        <div class="review-time">${randomTime}</div>
      </div>
      <div class="review-stars">${stars}</div>
      <div class="review-message">${escHtml(data.message)}</div>
    `;

    floatingReviews.appendChild(card);

    // Auto-remove after 8s
    setTimeout(() => {
      card.classList.add("hide");
      setTimeout(() => card.remove(), 600);
    }, 8000);
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  init();
});
