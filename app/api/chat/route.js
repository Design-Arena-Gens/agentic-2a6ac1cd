import { NextResponse } from "next/server";
import { respond } from "../../../lib/agent";

export const runtime = "edge";

export async function POST(req) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const cart = Array.isArray(body.cart) ? body.cart : [];

    const result = respond({ messages, cart });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ reply: "Error processing request.", cart: [] }, { status: 500 });
  }
}
