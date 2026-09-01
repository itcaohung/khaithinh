const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin || "*",
    "access-control-allow-methods": "GET,PUT,OPTIONS",
    "access-control-allow-headers": "content-type,x-admin-password",
    "access-control-max-age": "86400",
  };
}

function json(body, status = 200, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(origin) },
  });
}

function unauthorized(origin) {
  return json({ ok: false, error: "Sai mật khẩu quản trị" }, 401, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get("origin");

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ---------- Price overrides (KV-backed) ----------
    if (path === "/api/auth/verify" && request.method === "GET") {
      if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
        return unauthorized(origin);
      }
      return json({ ok: true });
    }

    if (path === "/api/prices" && request.method === "GET") {
      try {
        const raw = await env.PRICES.get("overrides", "json");
        const hidden = await env.PRICES.get("hidden", "json");
        const names = await env.PRICES.get("names", "json");
        return json({ ok: true, overrides: raw || {}, hidden: hidden || [], names: names || {} }, 200, origin);
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    if (path === "/api/prices" && request.method === "PUT") {
      if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
        return unauthorized(origin);
      }
      try {
        const body = await request.json();
        const src = body.src;
        const price = body.price;

        if (!src || price == null || isNaN(price) || Number(price) < 0) {
          return json({ ok: false, error: "Dữ liệu không hợp lệ" }, 400, origin);
        }

        const overrides = (await env.PRICES.get("overrides", "json")) || {};
        if (Number(price) === 0) {
          delete overrides[src];
        } else {
          overrides[src] = Number(price);
        }
        await env.PRICES.put("overrides", JSON.stringify(overrides));
        return json({ ok: true, overrides });
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    // ---------- Hide/show products (KV-backed) ----------
    if (path === "/api/hidden" && request.method === "GET") {
      try {
        const hidden = await env.PRICES.get("hidden", "json");
        return json({ ok: true, hidden: hidden || [] }, 200, origin);
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    if (path === "/api/hidden" && request.method === "PUT") {
      if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
        return unauthorized(origin);
      }
      try {
        const body = await request.json();
        const src = body.src;
        const hideOp = !!body.hidden;
        if (!src) {
          return json({ ok: false, error: "Dữ liệu không hợp lệ" }, 400, origin);
        }
        let hidden = (await env.PRICES.get("hidden", "json")) || [];
        if (hideOp) {
          if (!hidden.includes(src)) hidden.push(src);
        } else {
          hidden = hidden.filter((s) => s !== src);
        }
        await env.PRICES.put("hidden", JSON.stringify(hidden));
        return json({ ok: true, hidden });
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    // ---------- Product name overrides (KV-backed) ----------
    if (path === "/api/names" && request.method === "PUT") {
      if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
        return unauthorized(origin);
      }
      try {
        const body = await request.json();
        const src = body.src;
        const vi = body.vi ? String(body.vi).trim() : "";
        const en = body.en ? String(body.en).trim() : "";
        if (!src) {
          return json({ ok: false, error: "Dữ liệu không hợp lệ" }, 400, origin);
        }
        const names = (await env.PRICES.get("names", "json")) || {};
        if (!vi && !en) {
          delete names[src]; // reset name back to baked-in default
        } else {
          names[src] = { vi, en };
        }
        await env.PRICES.put("names", JSON.stringify(names));
        return json({ ok: true, names });
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    // ---------- Static assets (everything else) ----------
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && path.endsWith("/admin")) {
      // convenience: /admin redirect handled via static dir
    }
    return res;
  },
};
