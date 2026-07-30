/**
 * Google Play Billing — Verify Purchase (server-side)
 * ---------------------------------------------------
 * After a user buys Pro via Google Play, the Android app sends the
 * purchase token here. We verify it with Google Play Developer API.
 *
 * FLOW:
 *   1. User taps "Upgrade to Pro" in TWA
 *   2. Android billing client launches Google Play purchase sheet
 *   3. User pays (Google handles cards/UPI/wallets in 130+ countries)
 *   4. Android app receives purchase token + signature
 *   5. App POSTs to /api/play-billing/verify with {product_id, purchase_token, signature}
 *   6. We verify with Google Play Developer API (server-to-server)
 *   7. We mark the user as Pro in our DB
 *
 * REQUIRED ENV VARS (set in .env when you go live):
 *   - GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL
 *   - GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY
 *   - GOOGLE_PLAY_PACKAGE_NAME (com.interviewace.app)
 *
 * Until you create a service account, this endpoint runs in DEV MODE:
 *   - It accepts the request and returns success
 *   - It logs the purchase token so you can verify manually
 *   - DO NOT enable Pro features in dev mode without real verification
 */

import { NextRequest, NextResponse } from 'next/server';

const PRO_PRODUCT_ID = 'pro_monthly';  // matches the product ID in Play Console

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, purchase_token, signature, package_name } = body;

    if (!product_id || !purchase_token) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const svcEmail = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL;
    const svcKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY;
    const pkgName = package_name || process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.interviewace.app';

    // ---------- DEV MODE ----------
    // Until service account is configured, just log + acknowledge.
    if (!svcEmail || !svcKey) {
      console.warn('[play-billing] DEV MODE - no service account configured');
      console.warn('[play-billing] Would verify:', {
        product_id,
        purchase_token: String(purchase_token).slice(0, 12) + '...',
        package_name: pkgName,
      });
      return NextResponse.json({
        ok: true,
        verified: false,
        dev_mode: true,
        message: 'DEV MODE — purchase logged but not verified. Configure GOOGLE_PLAY_SERVICE_ACCOUNT_* env vars to enable real verification.',
      });
    }

    // ---------- PROD MODE ----------
    // Dynamically import googleapis only when needed (keeps dev bundle small)
    const { google } = await import('googleapis');

    const auth = new google.auth.JWT({
      email: svcEmail,
      key: svcKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const androidpublisher = google.androidpublisher({ version: 'v3', auth });

    const result = await androidpublisher.purchases.subscriptions.get({
      packageName: pkgName,
      subscriptionId: product_id,
      token: purchase_token,
    });

    const purchaseState = result.data.purchaseState;
    // 0 = Purchased, 1 = Canceled, 2 = Pending
    if (purchaseState !== 0) {
      return NextResponse.json(
        { ok: false, error: `Purchase not active (state=${purchaseState})` },
        { status: 402 }
      );
    }

    // Acknowledge the purchase (required by Google — otherwise auto-refunds after 3 days)
    await androidpublisher.purchases.subscriptions.acknowledge({
      packageName: pkgName,
      subscriptionId: product_id,
      token: purchase_token,
    });

    // TODO: Mark user as Pro in DB
    // await db.user.update({ where: { id: userId }, data: { plan: 'pro' }})

    return NextResponse.json({
      ok: true,
      verified: true,
      expiryTimeMillis: result.data.expiryTimeMillis,
      plan: 'pro',
    });

  } catch (err: any) {
    console.error('[play-billing] verify error:', err.message);
    return NextResponse.json(
      { ok: false, error: 'Verification failed', detail: err.message },
      { status: 500 }
    );
  }
}
