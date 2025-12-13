import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:4000/api";
const API_KEY = process.env.AI_SYNTHETIC_API_KEY || process.env.API_KEY;

function buildTargetUrl(req: NextApiRequest) {
  const slug = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";
  const { path, ...rest } = req.query;

  const search = new URLSearchParams();
  Object.entries(rest).forEach(([key, value]) => {
    if (typeof value === "undefined") return;
    if (Array.isArray(value)) {
      value.forEach(v => search.append(key, v));
    } else {
      search.append(key, value);
    }
  });

  const base = API_BASE.replace(/\/$/, "");
  const target = `${base}/${slug}`;
  const qs = search.toString();
  return qs ? `${target}?${qs}` : target;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const targetUrl = buildTargetUrl(req);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json"
    };

    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"] as string;
    }

    if (API_KEY) {
      headers["x-api-key"] = API_KEY;
    }

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization as string;
    }

    const method = req.method || "GET";
    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : typeof req.body === "string"
          ? req.body
          : Object.keys(req.body || {}).length
            ? JSON.stringify(req.body)
            : undefined;

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body
    });

    const contentType = upstream.headers.get("content-type") || "";
    res.status(upstream.status);

    if (contentType.includes("application/json")) {
      const json = await upstream.json();
      return res.json(json);
    }

    const text = await upstream.text();
    res.setHeader("Content-Type", contentType || "text/plain");
    return res.send(text);
  } catch (err) {
    console.error("Proxy error", err);
    return res
      .status(502)
      .json({ error: "Upstream unavailable", detail: (err as Error).message });
  }
}
