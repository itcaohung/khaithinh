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
    langLabel.textContent = current === "vi" ? "EN" : "VI";
    langFlag.textContent = current === "vi" ? "🇬🇧" : "🇻🇳";
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

  var headerEl = document.querySelector(".site-header");

  document.querySelectorAll(".brand").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", window.location.pathname + window.location.search);
    });
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
          var headerHeight = headerEl ? headerEl.offsetHeight : 72;
          var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 34;
          window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
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

  /* ---------- Back to top ---------- */
  var backToTop = document.getElementById("backToTop");
  window.addEventListener(
    "scroll",
    function () {
      backToTop.classList.toggle("show", window.scrollY > 400);
    },
    { passive: true }
  );
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Banner product slider ---------- */

  function scrollToElement(el) {
    if (!el) return;
    var headerHeight = headerEl ? headerEl.offsetHeight : 72;
    var top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 34;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  var slider = document.getElementById("pSlider");
  var track = document.getElementById("pTrack");
  var dotsWrap = document.getElementById("pDots");
  var slides = track ? track.querySelectorAll(".p-slide") : [];
  var pageIndex = 0;
  var slideTimer = null;

  function perView() {
    return window.matchMedia("(max-width: 700px)").matches ? 1 : 2;
  }
  function pageCount() {
    return Math.max(1, Math.ceil(slides.length / perView()));
  }

  function goToPage(p) {
    var pages = pageCount();
    pageIndex = ((p % pages) + pages) % pages;
    track.style.transform = "translateX(-" + pageIndex * 100 + "%)";
    dotsWrap.querySelectorAll("button").forEach(function (d, di) {
      d.classList.toggle("active", di === pageIndex);
    });
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    for (var i = 0; i < pageCount(); i++) {
      (function (i) {
        var dot = document.createElement("button");
        dot.setAttribute("aria-label", "Trang " + (i + 1));
        if (i === pageIndex) dot.classList.add("active");
        dot.addEventListener("click", function () {
          goToPage(i);
          startAuto();
        });
        dotsWrap.appendChild(dot);
      })(i);
    }
  }

  function startAuto() {
    stopAuto();
    slideTimer = setInterval(function () {
      goToPage(pageIndex + 1);
    }, 3500);
  }
  function stopAuto() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
  }

  if (slider && slides.length) {
    buildDots();

    document.getElementById("pNext").addEventListener("click", function () {
      goToPage(pageIndex + 1);
      startAuto();
    });
    document.getElementById("pPrev").addEventListener("click", function () {
      goToPage(pageIndex - 1);
      startAuto();
    });

    slides.forEach(function (slide) {
      slide.addEventListener("click", function () {
        scrollToElement(document.getElementById(slide.getAttribute("data-target")));
      });
    });

    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);

    var touchX = null;
    slider.addEventListener("touchstart", function (e) {
      touchX = e.touches[0].clientX;
      stopAuto();
    }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) goToPage(pageIndex + (dx < 0 ? 1 : -1));
      touchX = null;
      startAuto();
    }, { passive: true });

    window.addEventListener("resize", function () {
      buildDots();
      goToPage(pageIndex);
    });

    startAuto();
  }

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
