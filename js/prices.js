/* Khải Thịnh — live price overrides, hidden products, and renamed products from /api/prices (Cloudflare KV) */
(function () {
  "use strict";

  function money(v) {
    return Number(v).toLocaleString("vi-VN") + " đ";
  }

  // Update a bilingual element (textContent + data-vi/data-en) so language toggle still works.
  function currentLang() {
    try { return localStorage.getItem("kt-lang") || "vi"; } catch (e) { return "vi"; }
  }

  function setBilingual(el, vi, en) {
    var lang = currentLang();
    el.textContent = lang === "en" ? en : vi;
    el.setAttribute("data-vi", vi);
    if (el.getAttribute("data-en") !== null) el.setAttribute("data-en", en);
  }

  function apply(d) {
    if (!d) return;
    var overrides = d.overrides || {};
    var hidden = d.hidden || [];
    var names = d.names || {};
    var orders = d.orders || {};
    var group_names = d.group_names || {};
    var group_layout = d.group_layout || null;

    // ---- Restructure groups from authoritative layout (membership + order + title + number) ----
    if (group_layout && group_layout.length) {
      var sections = Array.prototype.slice.call(document.querySelectorAll(".cat-group"));
      var cardsBySrc = {};
      document.querySelectorAll(".cat-group").forEach(function (s) {
        Array.prototype.forEach.call(s.querySelectorAll(".cat-card"), function (c) {
          var img = c.querySelector(".cat-thumb img");
          var src = img ? img.getAttribute("src") : null;
          if (src) cardsBySrc[src] = c;
        });
      });
      group_layout.forEach(function (g, i) {
        var section = sections[i];
        if (!section) return;
        section.setAttribute("data-order", g.num);
        if (section.hasAttribute("data-group_num")) section.setAttribute("data-group_num", g.num);
        var numEl = section.querySelector(".group-num");
        if (numEl) numEl.textContent = g.num;
        var title = section.querySelector(".group-title");
        if (title) setBilingual(title, g.title, title.getAttribute("data-en") || g.title);
        var grid = section.querySelector(".cat-grid");
        if (!grid) return;
        grid.innerHTML = "";
        (g.srcs || []).forEach(function (src) {
          if (cardsBySrc[src]) { grid.appendChild(cardsBySrc[src]); delete cardsBySrc[src]; }
        });
      });
      // Hide surplus sections (those beyond the layout, i.e. deleted groups).
      sections.forEach(function (s, i) {
        if (i >= group_layout.length) s.style.display = "none";
      });
    }

    // Rename group titles using { group_key -> title } (legacy fallback when no layout).
    if (!group_layout || !group_layout.length) {
      document.querySelectorAll(".cat-group .group-title").forEach(function (t) {
        var group = t.closest(".cat-group");
        var key = group.getAttribute("data-order") || group.getAttribute("data-group_num");
        var title = key ? group_names[key] : null;
        if (!title) return;
        var en = t.getAttribute("data-en") || title;
        setBilingual(t, title, en);
      });
    }

    // Reorder cards within each group using { group_key -> [src,...] } (legacy, only when no layout).
    // Groups are matched by their section id (slug) falling back to data-group_num.
    if (!group_layout || !group_layout.length) {
      document.querySelectorAll(".cat-group").forEach(function (group) {
        var key = group.getAttribute("data-order") || group.getAttribute("data-group_num");
        var orderList = key ? orders[key] : null;
        if (!orderList || !orderList.length) { group.style.removeProperty("--kt-reordered"); return; }
        var grid = group.querySelector(".cat-grid");
        if (!grid) { group.style.removeProperty("--kt-reordered"); return; }
        var cards = Array.prototype.slice.call(grid.querySelectorAll(".cat-card"));
        var bySrc = {};
        cards.forEach(function (c) {
          var img = c.querySelector(".cat-thumb img");
          var src = img ? img.getAttribute("src") : null;
          if (src) bySrc[src] = c;
        });
        var out = [];
        orderList.forEach(function (src) { if (bySrc[src]) out.push(bySrc[src]); });
        cards.forEach(function (c) {
          var src = c.querySelector(".cat-thumb img") ? c.querySelector(".cat-thumb img").getAttribute("src") : null;
          if (src && out.indexOf(c) < 0) out.push(c);
        });
        if (out.length === cards.length) {
          out.forEach(function (c) { grid.appendChild(c); });
          group.style.setProperty("--kt-reordered", "1");
        }
      });
    }

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
      if (names.hasOwnProperty(src)) {
        var nameEl = card.querySelector(".cat-name");
        var enEl = card.querySelector(".cat-en");
        var n = names[src];
        if (nameEl) setBilingual(nameEl, n.vi, n.en);
        if (enEl) enEl.textContent = n.en;
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

    // Home page: hide products + rename (cards + slides)
    document.querySelectorAll(".product-card").forEach(function (card) {
      var img = card.querySelector(".product-img img");
      if (!img) return;
      var src = img.getAttribute("src");
      if (hidden.indexOf(src) >= 0) {
        card.style.display = "none";
        return;
      }
      if (names.hasOwnProperty(src)) {
        var h = card.querySelector("h3");
        var n = names[src];
        if (h) setBilingual(h, n.vi, n.en);
      }
    });
    document.querySelectorAll(".p-slide").forEach(function (slide) {
      var img = slide.querySelector("img");
      if (!img) return;
      var src = img.getAttribute("src");
      if (hidden.indexOf(src) >= 0) {
        slide.style.display = "none";
        return;
      }
      if (names.hasOwnProperty(src)) {
        var strong = slide.querySelector(".ps-text strong");
        var n = names[src];
        if (strong) setBilingual(strong, n.vi, n.en);
      }
    });
  }

  fetch("/api/prices", { headers: { "cache": "no-store" } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(apply)
    .catch(function () { /* fall back to baked-in data */ });
})();