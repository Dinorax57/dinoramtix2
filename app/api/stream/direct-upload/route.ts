import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({error:"No autenticado"}, {status:401});
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;
  if (!account || !token) return NextResponse.json({error:"Cloudflare Stream no configurado"}, {status:500});

  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/stream/direct_upload`, {
    method:"POST",
    headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
    body: JSON.stringify({ maxDurationSeconds: 3600, creator: user.id })
  });
  const data = await r.json();
  if (!r.ok || !data.success) return NextResponse.json({error:"No se pudo crear la subida", details:data}, {status:502});
  return NextResponse.json({uploadURL:data.result.uploadURL, uid:data.result.uid});
}
