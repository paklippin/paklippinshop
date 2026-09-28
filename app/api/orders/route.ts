export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, orderPlacedHtml, orderStatusHtml } from '@/lib/email';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://paklippinshop.paklippin.workers.dev';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || '';
  const all   = req.nextUrl.searchParams.get('all') === 'true';
  const qs    = all ? '?all=true' : (email ? `?email=${encodeURIComponent(email)}` : '');

  try {
    const res = await fetch(`${API_BASE}/orders${qs}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ orders: [] });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ orders: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Save to D1
    let saved = false;
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) saved = true;
    } catch (e) {
      console.warn('[proxy POST] upstream failed:', (e as Error).message);
    }

    // 2. Send confirmation email (fire-and-forget, never blocks)
    const customerEmail = body?.customer?.email;
    if (customerEmail && body?.id) {
      try {
        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmed — ${body.id} | PAKLIPPIN`,
          html: orderPlacedHtml(body),
        });
      } catch (e) {
        console.warn('[email] order confirmation failed:', (e as Error).message);
      }
    }

    if (saved) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, offline: true });
  } catch {
    return NextResponse.json({ ok: false, offline: true });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id  = url.searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
    const body = await req.json();

    // 1. Update D1
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    // 2. Send status change email
    if (res.ok && body?.status && body?.notify !== false) {
      try {
        // Fetch full order for email
        const orderRes = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (orderRes.ok) {
          const order = await orderRes.json();
          const customerEmail = order?.customer?.email;
          if (customerEmail) {
            const statusLabel = body.status.replace(/_/g, ' ').toUpperCase();
            await sendEmail({
              to: customerEmail,
              subject: `Order ${id} — ${statusLabel} | PAKLIPPIN`,
              html: orderStatusHtml(order, body.status, body.note),
            });
          }
        }
      } catch (e) {
        console.warn('[email] status email failed:', (e as Error).message);
      }
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id  = url.searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
