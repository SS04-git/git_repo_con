import { NextResponse } from "next/server";

export async function GET(request) {
  const token =
    request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json([], { status: 401 });
  }

  const res = await fetch(
    "https://api.github.com/user/repos?per_page=100",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const repos = await res.json();

  return NextResponse.json(repos);
}