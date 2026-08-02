/* =========================================================
   KHAI THINH — main.js
   Bilingual switching (VI/EN), mobile nav, reveal animations
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_KEY = "kt-lang";

  /* ---------- Language switching ---------- */

  var lang = localStorage.getItem(STORAGE_KEY) || "vi";
  var langToggle = document.getElementById("langToggle");
  var langLabel = document.getElementById("langLabel");
  var langFlag = document.getElementById("langFlag");

  function applyLang(current) {
    var elements = document.querySelectorAll("[data-vi], [data-en]");
    elements.forEach(function (el) {
      var vi = el.getAttribute("data-vi");
      var en = el.getAttribute("data-en");
      if (vi !== null && en !== null) {
        el.innerHTML = current === "vi" ? vi : en;
      } else if (vi !== null) {
        el.style.display = current === "vi" ? "" : "none";
      } else if (en !== null) {
        el.style.display = current === "en" ? "" : "none";
      }
    });
    document.documentElement.lang = current;
    langLabel.textContent = current === "vi" ? "VI" : "EN";
    langFlag.textContent = current === "vi" ? "🇻🇳" : "🇬🇧";
    langToggle.setAttribute("aria-label", current === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt");
    langToggle.title = current === "vi" ? "English" : "Tiếng Việt";
  }

  langToggle.addEventListener("click", function () {
    lang = lang === "vi" ? "en" : "vi";
    localStorage.setItem(STORAGE_KEY, lang);
    applyLang(lang);
  });

  applyLang(lang);

  /* ---------- Mobile navigation ---------- */

  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  navToggle.addEventListener("click", function () {
    navToggle.classList.toggle("open");
    mainNav.classList.toggle("open");
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      navToggle.classList.remove("open");
      mainNav.classList.remove("open");

      var href = link.getAttribute("href");
      if (href && href.charAt(0) === "#" && href.length > 1) {
        e.preventDefault();
        var target = document.getElementById(href.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    });
  });

  /* ---------- Header shadow on scroll ---------- */

  var header = document.getElementById("header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  /* ---------- Scroll spy (active nav link) ---------- */

  var sectionIds = ["home", "about", "brands", "products", "channels", "contact"];
  var navLinks = mainNav.querySelectorAll("a");

  function updateActiveLink() {
    var pos = window.scrollY + 140;
    var current = "home";
    sectionIds.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec && sec.offsetTop <= pos) current = id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + current);
    });
  }

  window.addEventListener("scroll", updateActiveLink, { passive: true });
  updateActiveLink();

  /* ---------- Reveal animations ---------- */

  var revealables = document.querySelectorAll(
    ".mv-card, .brand-card, .product-card, .channel-card, .contact-card, .contact-hero, .section-head"
  );
  revealables.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealables.forEach(function (el) { observer.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Footer year ---------- */

  document.getElementById("year").textContent = new Date().getFullYear();
})();
