/* Khải Thịnh — apply live price overrides + hidden products from /api/prices (Cloudflare KV) */
(function () {
  "use strict";

  function money(v) {
    return Number(v).toLocaleString("vi-VN") + " đ";
  }

  function apply(d) {
    if (!d) return;
    var overrides = d.overrides || {};
    var hidden = d.hidden || [];

    document.querySelectorAll(".cat-card").forEach(function (card) {
      var img = card.querySelector(".cat-thumb img");
      var priceEl = card.querySelector(".cat-price");
      if (!img) return;
      var src = img.getAttribute("src");

      // Hide product
      if (hidden.indexOf(src) >= 0) {
        card.style.display = "none";
        return;
      }
      // Apply price override
      if (priceEl && overrides.hasOwnProperty(src) && overrides[src] > 0) {
        priceEl.textContent = money(overrides[src]);
      }
    });

    // Hide products on the home page (cards + slides)
    document.querySelectorAll(".product-card").forEach(function (card) {
      var img = card.querySelector(".product-img img");
      if (!img) return;
      var src = img.getAttribute("src");
      if (hidden.indexOf(src) >= 0) {
        card.style.display = "none";
      }
    });
    document.querySelectorAll(".p-slide").forEach(function (slide) {
      var img = slide.querySelector("img");
      if (!img) return;
      var src = img.getAttribute("src");
      if (hidden.indexOf(src) >= 0) {
        slide.style.display = "none";
      }
    });
  }

  fetch("/api/prices", { headers: { "cache": "no-store" } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(apply)
    .catch(function () { /* fall back to baked-in prices */ });
})();