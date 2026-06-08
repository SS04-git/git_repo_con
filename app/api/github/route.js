import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "owner and repo are required" }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  };

  try {
    // Fetch up to 100 commits
    const commitsRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=100`,
      { headers }
    );

    if (!commitsRes.ok) {
      const err = await commitsRes.json();
      return NextResponse.json({ error: err.message }, { status: commitsRes.status });
    }

    const commits = await commitsRes.json();

    // Collect unique GitHub usernames
    const usernameSet = new Set();
    commits.forEach((c) => {
      if (c.author?.login) usernameSet.add(c.author.login);
    });

    // Fetch user details for each unique author
    const userDetails = {};
    await Promise.all(
      [...usernameSet].map(async (username) => {
        const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers });
        if (userRes.ok) {
          userDetails[username] = await userRes.json();
        }
      })
    );

    // Attach user detail to each commit
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

    return NextResponse.json({ commits: enrichedCommits });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}