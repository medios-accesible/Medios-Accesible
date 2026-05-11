import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const error = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("authError", error);
    return NextResponse.redirect(loginUrl);
  }

  if (type === "recovery") {
    const updateUrl = new URL("/update-password", requestUrl.origin);

    if (code) {
      updateUrl.searchParams.set("code", code);
    }

    return NextResponse.redirect(updateUrl);
  }

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("confirmed", "true");
  return NextResponse.redirect(loginUrl);
}
