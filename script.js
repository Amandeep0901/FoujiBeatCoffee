/*=========================================================
    FOUJI BEAT COFFEE — script.js
    Features: Multi-product pills, Reviews ticker,
              Google Sheets submission, Success screen
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    // Guard: hide loading overlay & success section immediately,
    // before anything else runs, so they never flash on page load.
    const _overlay   = document.getElementById("loadingOverlay");
    const _success   = document.getElementById("successSection");
    if (_overlay) _overlay.classList.add("hidden");
    if (_success) _success.classList.add("hidden");

    /* ── CONFIG ── */
    const CONFIG = {
        appsScriptUrl:      "https://script.google.com/macros/s/AKfycbxDemQKaqUnDlXnr0VEt2pW98wg9CNnjIF7jueLFdtLRTSeeJayppUOQFVJOaYHk4EM/exec",
        enableGoogleSheets: true,
        catalogueUrl:       "https://wa.me/c/919896772868",
        instagramUrl:       "https://www.instagram.com/fouji_beat_coffee_",
        whatsappNumber:     "919896772868",
        whatsappMessage:    "Hi Fouji, I recently tried your product.",
    };

    /* ── DOM ── */
    const form            = document.getElementById("feedbackForm");
    const submitBtn       = document.getElementById("submitBtn");
    const feedbackSection = document.getElementById("feedbackSection");
    const successSection  = document.getElementById("successSection");
    const loadingOverlay  = document.getElementById("loadingOverlay");
    const toast           = document.getElementById("toast");
    const feedbackInput   = document.getElementById("feedback");
    const charCount       = document.getElementById("charCount");
    const productHidden   = document.getElementById("product");
    const productError    = document.getElementById("productError");
    const anotherBtn      = document.getElementById("anotherBtn");
    const phoneInput      = document.getElementById("phone");

    /* ── STATE ── */
    const state = {
        selectedProducts: [],   // array — multi select
        recommend: "",
        ratings: { overall: 0, taste: 0, packaging: 0, value: 0 },
    };

    /* ════════════════════════════════════════════
       INIT
    ════════════════════════════════════════════ */
    function init() {
        setLinks();
        initProductPills();
        initCharCounter();
        initRatings();
        initRecommend();
        initPhoneFilter();
        initFormSubmit();
        initAnotherBtn();
        loadReviewsTicker();

        // Defensive: ensure overlay is hidden on load even if HTML attr was lost
        loadingOverlay.classList.add("hidden");
    }

    /* ── LINKS ── */
    function setLinks() {
        const waURL = "https://wa.me/" + CONFIG.whatsappNumber +
            "?text=" + encodeURIComponent(CONFIG.whatsappMessage);
        const map = {
            catalogueBtn:    CONFIG.catalogueUrl,
            instagramBtn:    CONFIG.instagramUrl,
            whatsappBtn:     waURL,
            footerCatalogue: CONFIG.catalogueUrl,
            footerInstagram: CONFIG.instagramUrl,
            footerWhatsapp:  waURL,
        };
        Object.entries(map).forEach(([id, href]) => {
            const el = document.getElementById(id);
            if (el) { el.href = href; el.target = "_blank"; el.rel = "noopener noreferrer"; }
        });
    }

    /* ════════════════════════════════════════════
       MULTI-PRODUCT PILLS
    ════════════════════════════════════════════ */
    function initProductPills() {
        const pills = document.querySelectorAll(".product-pill");
        pills.forEach(pill => {
            pill.addEventListener("click", () => {
                const val = pill.dataset.value;
                const idx = state.selectedProducts.indexOf(val);

                if (idx === -1) {
                    state.selectedProducts.push(val);
                    pill.classList.add("selected");
                } else {
                    state.selectedProducts.splice(idx, 1);
                    pill.classList.remove("selected");
                }

                productHidden.value = state.selectedProducts.join(", ");

                if (state.selectedProducts.length > 0) {
                    productError.classList.add("hidden");
                }
            });
        });
    }

    /* ── CHAR COUNTER ── */
    function initCharCounter() {
        feedbackInput.addEventListener("input", () => {
            const len = feedbackInput.value.length;
            charCount.textContent = len + " / 500";
            charCount.style.color = len >= 450 ? "#C4622D" : "#888";
        });
    }

    /* ── PHONE DIGITS-ONLY FILTER ── */
    function initPhoneFilter() {
        if (!phoneInput) return;
        phoneInput.addEventListener("input", () => {
            // Strip everything except 0-9, keep cursor position
            const cleaned = phoneInput.value.replace(/\D/g, "");
            if (cleaned !== phoneInput.value) {
                phoneInput.value = cleaned;
            }
        });
    }

    /* ════════════════════════════════════════════
       STAR RATINGS
    ════════════════════════════════════════════ */
    const LABELS = { 1:"😕 Poor", 2:"🙂 Fair", 3:"😊 Good", 4:"😄 Very Good", 5:"🤩 Excellent" };

    function initRatings() {
        setupStars(".overall-stars",   "overall",   true);
        setupStars(".taste-stars",     "taste",     false);
        setupStars(".packaging-stars", "packaging", false);
        setupStars(".value-stars",     "value",     false);
    }

    function setupStars(selector, key, showLabel) {
        const wrap = document.querySelector(selector);
        if (!wrap) return;
        const stars = wrap.querySelectorAll(".star");
        stars.forEach((star, i) => {
            const val = i + 1;
            star.addEventListener("mouseenter", () => paint(stars, val));
            star.addEventListener("mouseleave", () => paint(stars, state.ratings[key]));
            star.addEventListener("click", () => {
                state.ratings[key] = val;
                paint(stars, val);
                if (showLabel) {
                    const lbl = document.querySelector(".rating-text");
                    if (lbl) lbl.textContent = LABELS[val];
                }
            });
        });
    }

    function paint(stars, val) {
        stars.forEach((s, i) => s.classList.toggle("active", i < val));
    }

    /* ── RECOMMEND ── */
    function initRecommend() {
        document.querySelectorAll(".recommend-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".recommend-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.recommend = btn.dataset.value;
            });
        });
    }

    /* ════════════════════════════════════════════
       FORM SUBMIT
    ════════════════════════════════════════════ */
    function initFormSubmit() {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!validate()) return;

            submitBtn.disabled = true;
            submitBtn.querySelector(".btn-text").textContent = "Submitting...";
            loadingOverlay.classList.remove("hidden");

            const ua = navigator.userAgent;
            const payload = {
                name:            document.getElementById("name").value.trim(),
                phone:           document.getElementById("phone").value.trim(),
                email:           (document.getElementById("email") || {}).value || "",
                product:         state.selectedProducts.join(", "),
                overallRating:   state.ratings.overall,
                tasteRating:     state.ratings.taste,
                packagingRating: state.ratings.packaging,
                valueRating:     state.ratings.value,
                recommend:       state.recommend,
                feedback:        feedbackInput.value.trim(),
                browser:         getBrowser(ua),
                device:          getDevice(ua),
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

            await delay(1000);
            loadingOverlay.classList.add("hidden");
            submitBtn.disabled = false;
            submitBtn.querySelector(".btn-text").textContent = "❤️ Submit Feedback";
            showSuccess();
        });
    }

    /* ── VALIDATE ── */
    function validate() {
        const name  = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();

        if (state.selectedProducts.length === 0) {
            productError.classList.remove("hidden");
            document.getElementById("productPills").scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }
        if (name.length < 2) {
            showToast("Please enter your name.");
            document.getElementById("name").focus();
            return false;
        }
        if (phone.length < 10) {
            showToast("Please enter a valid phone number.");
            document.getElementById("phone").focus();
            return false;
        }
        if (state.ratings.overall === 0) {
            showToast("Please rate your overall experience.");
            return false;
        }
        return true;
    }

    /* ════════════════════════════════════════════
       SUCCESS SCREEN
    ════════════════════════════════════════════ */
    function showSuccess() {
        feedbackSection.classList.add("hidden");
        successSection.classList.remove("hidden");
        setTimeout(() => {
            successSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        loadReviewsTicker();
    }

    /* ════════════════════════════════════════════
       ANOTHER FEEDBACK — reset everything
    ════════════════════════════════════════════ */
    function initAnotherBtn() {
        if (!anotherBtn) return;
        anotherBtn.addEventListener("click", () => {
            // Reset form fields
            form.reset();

            // Reset state
            state.selectedProducts = [];
            state.recommend = "";
            state.ratings = { overall: 0, taste: 0, packaging: 0, value: 0 };

            // Reset pills
            document.querySelectorAll(".product-pill").forEach(p => p.classList.remove("selected"));
            productHidden.value = "";
            productError.classList.add("hidden");

            // Reset ratings
            document.querySelectorAll(".overall-stars .star, .taste-stars .star, .packaging-stars .star, .value-stars .star")
                .forEach(s => s.classList.remove("active"));
            const ratingText = document.querySelector(".rating-text");
            if (ratingText) ratingText.textContent = "Select a rating";

            // Reset recommend
            document.querySelectorAll(".recommend-btn").forEach(b => b.classList.remove("active"));

            // Reset char counter
            charCount.textContent = "0 / 500";
            charCount.style.color = "#888";

            // Toggle sections
            successSection.classList.add("hidden");
            feedbackSection.classList.remove("hidden");

            // Scroll back to form
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ════════════════════════════════════════════
       REVIEWS TICKER
    ════════════════════════════════════════════ */
    async function loadReviewsTicker() {
        try {
            const res  = await fetch(CONFIG.appsScriptUrl + "?action=reviews");
            const data = await res.json();
            if (data.reviews && data.reviews.length > 0) {
                renderTickers(data.reviews);
            }
        } catch (err) {
            console.warn("Ticker background fetch:", err);
        }
    }

    function renderTickers(reviews) {
        const cards    = reviews.map(r => buildReviewCard(r)).join("");
        const duration = Math.max(20, reviews.length * 6) + "s";

        const mainTrack = document.getElementById("tickerTrack");
        if (mainTrack) {
            mainTrack.innerHTML = cards + cards;
            mainTrack.style.animationDuration = duration;
        }

        populateSuccessTicker(cards, duration);
        updateAvgRating(reviews);
    }

    function updateAvgRating(reviews) {
        if (!reviews || reviews.length === 0) return;
        const avg   = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
        const score = avg.toFixed(1);
        const full  = Math.round(avg);
        const stars = "★".repeat(full) + "☆".repeat(5 - full);

        const avgStars = document.getElementById("avgStars");
        const avgScore = document.getElementById("avgScore");
        const avgCount = document.getElementById("avgCount");
        if (avgStars) avgStars.textContent = stars;
        if (avgScore) avgScore.textContent = score + "/5";
        if (avgCount) avgCount.textContent = "(" + reviews.length + " review" + (reviews.length !== 1 ? "s" : "") + ")";

        const trust = document.getElementById("trustAvgScore");
        if (trust) trust.textContent = score + " / 5";
    }

    function populateSuccessTicker(cards, duration) {
        const t = document.getElementById("successTickerTrack");
        if (t) {
            t.innerHTML = cards + cards;
            t.style.animationDuration = duration;
        }
    }

    function buildReviewCard(r) {
        const stars     = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
        const score     = r.rating + ".0/5";
        const name      = escHtml(r.name || "Customer");
        const product   = escHtml(r.product || "");
        const comment   = escHtml(r.feedback || "");

        return `
        <div class="review-card">
            <div class="review-card-top">
                <span class="review-name">${name}</span>
                <div class="review-rating-wrap">
                    <span class="review-stars">${stars}</span>
                    <span class="review-score">${score}</span>
                </div>
            </div>
            ${product ? `<p class="review-product">${product}</p>` : ""}
            ${comment ? `<p class="review-comment">"${comment}"</p>` : ""}
        </div>`;
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
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
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
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

    init();
});
