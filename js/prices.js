/* Khải Thịnh — apply live price overrides from /api/prices (Cloudflare KV) */
(function () {
  "use strict";

  function money(v) {
    return Number(v).toLocaleString("vi-VN") + " đ";
  }

  function apply(overrides) {
    if (!overrides) return;
    document.querySelectorAll(".cat-card").forEach(function (card) {
      var img = card.querySelector(".cat-thumb img");
      var priceEl = card.querySelector(".cat-price");
      if (!img || !priceEl) return;
      var src = img.getAttribute("src");
      if (overrides.hasOwnProperty(src) && overrides[src] > 0) {
        priceEl.textContent = money(overrides[src]);
      }
    });
  }

  fetch("/api/prices", { headers: { "cache": "no-store" } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) { apply(d.overrides); })
    .catch(function () { /* fall back to baked-in prices */ });
})();
