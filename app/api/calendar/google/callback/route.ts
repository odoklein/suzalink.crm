import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/calendar?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/calendar?error=missing_parameters`
      );
    }

    await handleOAuthCallback(code, state);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?success=true`
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/calendar?error=auth_failed`
    );
  }
}





