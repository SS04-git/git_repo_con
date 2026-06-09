import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch") || "";
  const userToken = searchParams.get("token") || "";
// OAuth token stored in cookie after GitHub login
const oauthToken =
  request.cookies.get("github_token")?.value || "";
if (!owner || !repo) {
  return NextResponse.json(
    { error: "owner and repo are required" },
    { status: 400 }
  );
}
// Priority:
// 1. PAT entered by user
// 2. GitHub OAuth token
// 3. Environment token
const token = userToken || oauthToken || process.env.GITHUB_TOKEN;

  console.log("Token received:", token ? "YES" : "NO");
  console.log("Branch:", branch);
  console.log("Repo:", `${owner}/${repo}`);

  const headers = {
  Accept: "application/vnd.github+json",
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

console.log("PAT provided:", !!userToken);
console.log("OAuth token found:", !!oauthToken);
console.log("Using token:", !!token);

  try {
    // Build commits URL — optionally filter by branch
    const branchParam = branch ? `&sha=${encodeURIComponent(branch)}` : "";
    const repoCheck = await fetch(
  `${GITHUB_API}/repos/${owner}/${repo}`,
  { headers }
);

console.log("Repo check status:", repoCheck.status);

if (!repoCheck.ok) {
  console.log("Repo check response:", await repoCheck.text());
}
    const commitsRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=100${branchParam}`,
      { headers }
    );

    if (!commitsRes.ok) {
  const err = await commitsRes.json();

  console.log("GitHub API Error:", err);

  return NextResponse.json(
    { error: err.message || "Failed to fetch commits" },
    { status: commitsRes.status }
  );
  }

    const commits = await commitsRes.json();

    // Fetch repo info for display name and visibility
    const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
    const repoInfo = repoRes.ok ? await repoRes.json() : null;

    if (!repoRes.ok) {
    console.log("Repo Info Error:", await repoRes.text());
    }

    // Collect unique GitHub usernames
    const usernameSet = new Set();
    commits.forEach((c) => {
      if (c.author?.login) usernameSet.add(c.author.login);
    });

    // Fetch user details
    const userDetails = {};
    await Promise.all(
      [...usernameSet].map(async (username) => {
        const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers });
        if (userRes.ok) userDetails[username] = await userRes.json();
      })
    );

    const enrichedCommits = commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      date: c.commit.author.date,
      authorName: c.commit.author.name,
      authorEmail: c.commit.author.email,
      githubLogin: c.author?.login || null,
      userDetail: c.author?.login ? userDetails[c.author.login] : null,
      htmlUrl: c.html_url,
    }));

    return NextResponse.json({
      commits: enrichedCommits,
      repoInfo: repoInfo ? {
        name: repoInfo.name,
        fullName: repoInfo.full_name,
        description: repoInfo.description,
        private: repoInfo.private,
        defaultBranch: repoInfo.default_branch,
        stars: repoInfo.stargazers_count,
        language: repoInfo.language,
      } : null
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}