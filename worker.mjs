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

const MAX_VERSIONS = 40;

async function readState(env) {
  return {
    overrides: (await env.PRICES.get("overrides", "json")) || {},
    hidden: (await env.PRICES.get("hidden", "json")) || [],
    names: (await env.PRICES.get("names", "json")) || {},
    orders: (await env.PRICES.get("orders", "json")) || {},
  };
}

async function writeState(env, state) {
  await Promise.all([
    env.PRICES.put("overrides", JSON.stringify(state.overrides || {})),
    env.PRICES.put("hidden", JSON.stringify(state.hidden || [])),
    env.PRICES.put("names", JSON.stringify(state.names || {})),
    env.PRICES.put("orders", JSON.stringify(state.orders || {})),
  ]);
}

async function readVersions(env) {
  return (await env.PRICES.get("versions", "json")) || [];
}

async function pushVersion(env, snapshot, desc) {
  const versions = await readVersions(env);
  versions.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    at: new Date().toISOString(),
    desc: desc || "",
    snapshot,
  });
  const trimmed = versions.slice(0, MAX_VERSIONS);
  await env.PRICES.put("versions", JSON.stringify(trimmed));
  return trimmed;
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
        const state = await readState(env);
        const versions = await readVersions(env);
        return json({ ok: true, ...state, versions }, 200, origin);
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    // ---------- Publish full staged state (with changelog snapshot) ----------
    if (path === "/api/publish" && request.method === "PUT") {
      if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
        return unauthorized(origin);
      }
      try {
        const body = await request.json();
        const next = {
          overrides: body.overrides || {},
          hidden: body.hidden || [],
          names: body.names || {},
          orders: body.orders || {},
        };
        const prev = await readState(env);
        await pushVersion(env, prev, body.desc);
        await writeState(env, next);
        const versions = await readVersions(env);
        return json({ ok: true, overrides: next.overrides, hidden: next.hidden, names: next.names, orders: next.orders, versions }, 200, origin);
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    // ---------- History ----------
    if (path === "/api/history" && request.method === "GET") {
      if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
        return unauthorized(origin);
      }
      try {
        const versions = await readVersions(env);
        return json({ ok: true, versions }, 200, origin);
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500, origin);
      }
    }

    // ---------- Restore a version ----------
    if (path === "/api/restore" && request.method === "POST") {
      if (request.headers.get("x-admin-password") !== env.ADMIN_PASSWORD) {
        return unauthorized(origin);
      }
      try {
        const body = await request.json();
        const versions = await readVersions(env);
        const ver = versions.find((v) => v.id === body.id);
        if (!ver) {
          return json({ ok: false, error: "Không tìm thấy phiên bản" }, 404, origin);
        }
        const prev = await readState(env);
        await pushVersion(env, prev, "Khôi phục: " + (ver.desc || "bản " + ver.id));
        await writeState(env, ver.snapshot);
        const nextVersions = await readVersions(env);
        const state = await readState(env);
        return json({ ok: true, ...state, versions: nextVersions }, 200, origin);
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
