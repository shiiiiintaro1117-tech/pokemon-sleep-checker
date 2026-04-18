import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, nature, subskills, score, grade, reaction } = body;

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import("@vercel/kv");
      const key = `feedback:${Date.now()}`;
      await kv.set(key, { type, nature, subskills, score, grade, reaction, at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 90 });
      await kv.incr(`count:${reaction}`);
    }
  } catch (e) {
    console.error("KV save error:", e);
  }

  return NextResponse.json({ ok: true });
}
