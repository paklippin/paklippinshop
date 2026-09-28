export const runtime = 'edge';

import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://paklippinshop.paklippin.workers.dev';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/orders?all=true`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ orders: [] });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.orders ?? []);
    return NextResponse.json({ orders: list });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}
