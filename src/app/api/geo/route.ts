import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Returns the user's country (via Cloudflare/Vercel IP geo header) and the
 * appropriate pricing tier.
 *
 * - Indian IPs       -> "india" tier  (₹299/mo, ₹1999/yr)
 * - Everywhere else  -> "global" tier ($19/mo, $190/yr)
 *
 * Used by the landing page pricing cards and the role picker to show the
 * correct currency. Server-side billing verification happens separately
 * at /api/play-billing/verify.
 */
export async function GET(req: NextRequest) {
  // Try multiple headers (Vercel, Cloudflare, and common proxy headers)
  const headers = req.headers;
  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-geo-country') ||
    headers.get('x-country-code') ||
    null;

  const city =
    headers.get('x-vercel-ip-city') ||
    headers.get('cf-ipcity') ||
    null;
  const region =
    headers.get('x-vercel-ip-country-region') ||
    headers.get('cf-region') ||
    null;

  const isIndia = country?.toUpperCase() === 'IN';

  return NextResponse.json({
    country: country ? country.toUpperCase() : null,
    isIndia: Boolean(isIndia),
    city,
    region,
    tier: isIndia ? 'india' : 'global',
    pricing: isIndia
      ? {
          currency: 'INR',
          symbol: '₹',
          monthly: 299,
          yearly: 1999,
          monthlyLabel: '₹299',
          yearlyLabel: '₹1,999',
          freeInterviewsPerMonth: 3,
        }
      : {
          currency: 'USD',
          symbol: '$',
          monthly: 19,
          yearly: 190,
          monthlyLabel: '$19',
          yearlyLabel: '$190',
          freeInterviewsPerMonth: 3,
        },
  });
}
