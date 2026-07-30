/**
 * Google Play Billing — Client wrapper
 * ------------------------------------
 * Inside a Trusted Web Activity (TWA) with playBilling enabled,
 * Bubblewrap injects a JS bridge at window.AndroidBridge.googlePlayBilling.
 *
 * Outside the TWA (regular web browser), this falls back gracefully.
 *
 * USAGE:
 *   import { playBilling } from '@/lib/play-billing';
 *   const ok = await playBilling.purchase('pro_monthly');
 *   if (ok) { /* user is now Pro *\/ }
 */

const PRODUCT_PRO_MONTHLY = 'pro_monthly';

interface PlayBillingBridge {
  launchBillingFlow: (productId: string) => Promise<{
    purchaseToken: string;
    productId: string;
    signature: string;
  }>;
  isFeatureSupported: () => boolean;
  queryPurchases: () => Promise<{ purchases: any[] }>;
}

function getBridge(): PlayBillingBridge | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return (
    w.AndroidBridge?.googlePlayBilling ??
    w.googlePlayBilling ??
    null
  );
}

export const isPlayBillingAvailable = (): boolean => {
  const bridge = getBridge();
  if (!bridge) return false;
  try {
    return typeof bridge.isFeatureSupported === 'function' && bridge.isFeatureSupported();
  } catch {
    return false;
  }
};

/**
 * Launch Google Play purchase sheet for the Pro subscription.
 * Returns true if purchase succeeded and was verified server-side.
 */
export async function purchasePro(): Promise<{ ok: boolean; error?: string }> {
  const bridge = getBridge();

  if (!bridge || !isPlayBillingAvailable()) {
    return {
      ok: false,
      error:
        'In-app purchase is only available in the Android app. Please install InterviewAce from Google Play to upgrade.',
    };
  }

  try {
    // 1. Launch Google Play purchase UI
    const purchase = await bridge.launchBillingFlow(PRODUCT_PRO_MONTHLY);

    // 2. Verify on our server (so we don't trust the client)
    const res = await fetch('/api/play-billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: purchase.productId,
        purchase_token: purchase.purchaseToken,
        signature: purchase.signature,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.error || 'Verification failed' };
    }

    // 3. Reload so the UI reflects the new Pro status
    window.location.reload();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Purchase failed' };
  }
}

/**
 * Check if user already has an active Pro subscription.
 * Useful for restoring purchases on a new install.
 */
export async function restorePurchases(): Promise<boolean> {
  const bridge = getBridge();
  if (!bridge || !isPlayBillingAvailable()) return false;

  try {
    const { purchases } = await bridge.queryPurchases();
    const pro = purchases.find((p) => p.productId === PRODUCT_PRO_MONTHLY);
    if (!pro) return false;

    // Verify
    const res = await fetch('/api/play-billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: pro.productId,
        purchase_token: pro.purchaseToken,
        signature: pro.signature,
      }),
    });
    const data = await res.json();
    return Boolean(data.ok && data.verified);
  } catch {
    return false;
  }
}
