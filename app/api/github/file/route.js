import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const owner      = searchParams.get("owner");
  const repo       = searchParams.get("repo");
  const sha        = searchParams.get("sha");
  const url        = searchParams.get("url");
  const userToken  = searchParams.get("token") || "";
  const oauthToken = request.cookies.get("github_token")?.value || "";
  const token      = userToken || oauthToken || process.env.GITHUB_TOKEN;

  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // ── MODE 1: sha provided → fetch commit details (file list + patch) ──
  if (sha && owner && repo) {
    try {
      const res = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`,
        { headers }
      );
      if (!res.ok) {
        const err = await res.json();
        return NextResponse.json(
          { error: err.message || "Failed to fetch commit" },
          { status: res.status }
        );
      }
      const data = await res.json();
      return NextResponse.json({
        stats: data.stats || { additions: 0, deletions: 0, total: 0 },
        files: (data.files || []).map((f) => ({
          filename:  f.filename,
          status:    f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes:   f.changes,
          patch:     f.patch || null,
          blobUrl:   f.blob_url,
          rawUrl:    f.raw_url,
        })),
      });
    } catch {
      return NextResponse.json({ error: "Failed to fetch commit details" }, { status: 500 });
    }
  }

  // ── MODE 2: url provided → fetch raw file content ──
  if (url) {
    try {
      const rawHeaders = {};
      if (token) rawHeaders.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { headers: rawHeaders });
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch file" }, { status: res.status });
      }
      const text = await res.text();
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }
  }

  // ── Neither provided ──
  return NextResponse.json(
    { error: "Provide either (owner + repo + sha) or (url)" },
    { status: 400 }
  );
}