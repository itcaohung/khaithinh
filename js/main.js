/* =========================================================
   KHAI THINH — main.js (Redesigned)
   Bilingual switching, hero slider, mobile nav
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
        // For elements with child nodes, use innerHTML carefully
        if (el.children.length > 0 && el.querySelector('svg, img') === null) {
          el.textContent = current === "vi" ? vi : en;
        } else if (el.querySelector('svg') || el.querySelector('img')) {
          // Has icons/images, try to update text nodes
          var textNodes = [];
          for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) {
              textNodes.push(el.childNodes[i]);
            }
          }
          if (textNodes.length > 0) {
            textNodes[0].textContent = current === "vi" ? vi : en;
          } else {
            el.setAttribute('data-' + current, current === "vi" ? vi : en);
          }
        } else {
          el.innerHTML = current === "vi" ? vi : en;
        }
      }
    });
    document.documentElement.lang = current;
    if (langLabel) langLabel.textContent = current === "vi" ? "EN" : "VI";
    if (langFlag) langFlag.textContent = current === "vi" ? "🇬🇧" : "🇻🇳";
    if (langToggle) {
      langToggle.setAttribute("aria-label", current === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt");
    }
  }

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      lang = lang === "vi" ? "en" : "vi";
      localStorage.setItem(STORAGE_KEY, lang);
      applyLang(lang);
    });
  }

  applyLang(lang);

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      navToggle.classList.toggle("open");
      mainNav.classList.toggle("open");
    });

    mainNav.querySelectorAll(".nav-link:not(.has-dropdown)").forEach(function (link) {
      link.addEventListener("click", function () {
        navToggle.classList.remove("open");
        mainNav.classList.remove("open");
      });
    });
  }

  /* ---------- Hero Slider ---------- */
  var slides = document.querySelectorAll(".hero-slide");
  var prevBtn = document.getElementById("prevSlide");
  var nextBtn = document.getElementById("nextSlide");
  var dotsContainer = document.getElementById("sliderDots");
  var currentSlide = 0;
  var slideInterval;

  if (slides.length > 0 && dotsContainer) {
    slides.forEach(function (_, index) {
      var dot = document.createElement("button");
      dot.className = "slider-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Slide " + (index + 1));
      dot.addEventListener("click", function () {
        goToSlide(index);
        resetInterval();
      });
      dotsContainer.appendChild(dot);
    });

    var dots = document.querySelectorAll(".slider-dot");

    function goToSlide(n) {
      slides[currentSlide].classList.remove("active");
      dots[currentSlide].classList.remove("active");
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add("active");
      dots[currentSlide].classList.add("active");
    }

    function nextSlide() {
      goToSlide(currentSlide + 1);
    }

    function prevSlide() {
      goToSlide(currentSlide - 1);
    }

    if (nextBtn) nextBtn.addEventListener("click", function () {
      nextSlide();
      resetInterval();
    });
    if (prevBtn) prevBtn.addEventListener("click", function () {
      prevSlide();
      resetInterval();
    });

    function startInterval() {
      slideInterval = setInterval(nextSlide, 5000);
    }

    function resetInterval() {
      clearInterval(slideInterval);
      startInterval();
    }

    startInterval();
  }

  /* ---------- Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = this.getAttribute("href");
      if (href === "#") return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var headerHeight = document.querySelector(".site-header") ? document.querySelector(".site-header").offsetHeight : 80;
        var topBarHeight = document.querySelector(".top-bar") ? document.querySelector(".top-bar").offsetHeight : 0;
        var totalHeight = headerHeight + topBarHeight;
        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - totalHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });
      }
    });
  });

  /* ---------- Back to top ---------- */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    window.addEventListener("scroll", function () {
      if (window.pageYOffset > 300) {
        backToTop.classList.add("show");
      } else {
        backToTop.classList.remove("show");
      }
    });

    backToTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Brands carousel auto-scroll (optional) ---------- */
  var brandsCarousel = document.querySelector(".brands-carousel");
  if (brandsCarousel) {
    let isDown = false;
    let startX;
    let scrollLeft;

    brandsCarousel.addEventListener('mousedown', (e) => {
      isDown = true;
      brandsCarousel.style.cursor = 'grabbing';
      startX = e.pageX - brandsCarousel.offsetLeft;
      scrollLeft = brandsCarousel.scrollLeft;
    });
    brandsCarousel.addEventListener('mouseleave', () => {
      isDown = false;
      brandsCarousel.style.cursor = 'grab';
    });
    brandsCarousel.addEventListener('mouseup', () => {
      isDown = false;
      brandsCarousel.style.cursor = 'grab';
    });
    brandsCarousel.addEventListener('mousemove', (e) => {
      if(!isDown) return;
      e.preventDefault();
      const x = e.pageX - brandsCarousel.offsetLeft;
      const walk = (x - startX) * 2;
      brandsCarousel.scrollLeft = scrollLeft - walk;
    });
  }

})();
