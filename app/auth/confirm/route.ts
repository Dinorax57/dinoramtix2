import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as any;
  if (token_hash) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({ type: type || "email", token_hash });
  }
  return NextResponse.redirect(new URL("/", request.url));
}
