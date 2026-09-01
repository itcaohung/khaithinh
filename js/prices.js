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

      if (hidden.indexOf(src) >= 0) {
        card.style.display = "none";
        return;
      }
      if (priceEl && overrides.hasOwnProperty(src) && overrides[src] > 0) {
        priceEl.textContent = money(overrides[src]);
      }
    });

    // Hide a group when all its products are hidden (affects screen + print).
    document.querySelectorAll(".cat-group").forEach(function (group) {
      var cards = group.querySelectorAll(".cat-card");
      var allHidden = cards.length > 0 && Array.prototype.every.call(cards, function (c) {
        return c.style.display === "none";
      });
      if (allHidden) group.style.display = "none";
    });

    // Hide a print page when every group inside is hidden (avoids blank PDF page).
    document.querySelectorAll(".pt-page").forEach(function (page) {
      var groups = page.querySelectorAll(".cat-group");
      var allGone = groups.length > 0 && Array.prototype.every.call(groups, function (g) {
        return g.style.display === "none";
      });
      if (allGone) page.style.display = "none";
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