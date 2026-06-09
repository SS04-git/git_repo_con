import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=no_code", request.url)
    );
  }

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const data = await tokenRes.json();

    if (!data.access_token) {
      return NextResponse.redirect(
        new URL("/?error=oauth_failed", request.url)
      );
    }

    const response = NextResponse.redirect(
      new URL("/", request.url)
    );

    response.cookies.set("github_token", data.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
});

response.cookies.set("github_connected", "true", {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
});

return response;

    return response;
  } catch (error) {
    return NextResponse.redirect(
      new URL("/?error=oauth_error", request.url)
    );
  }
}