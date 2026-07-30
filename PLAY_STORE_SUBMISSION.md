# InterviewAce — Google Play Store Submission Guide

This document walks you through everything from "code is ready" to "app is live on Google Play."

**Estimated time:** 2-4 hours of your work + 1-3 days waiting on Google review.

---

## ✅ What's already done

- [x] PWA manifest (`/public/manifest.json`) — app name, icons, theme color
- [x] Service worker (`/public/sw.js`) — offline support
- [x] All Android icon sizes (192, 512, maskable, mono)
- [x] Digital Asset Links file (`/public/.well-known/assetlinks.json`)
- [x] Bubblewrap TWA config (`/twa/twa-manifest.json`)
- [x] One-command APK build script (`/scripts/build-apk.sh`)
- [x] Google Play Billing API route (`/api/play-billing/verify`)
- [x] Google Play Billing client wrapper (`/lib/play-billing.ts`)
- [x] Privacy policy page (`/privacy`)
- [x] This guide

---

## 📋 Your checklist (do these in order)

### Step 1 — Buy a domain (15 min, ~$10/year)

If you're reusing `umcoloringpages.com`, use a **subdomain** like `interviewace.umcoloringpages.com`.

**Better option:** buy a clean domain for the IT niche. Recommended:
- `interviewace.app` (~$20/year, but instantly credible)
- `interviewace.ai` (~$80/year)
- `interviewace.com` (~$12/year)
- `mockace.app` (~$20/year)

Buy at: https://porkbun.com (cheapest) or https://cloudflare.com/registrar/

### Step 2 — Deploy the Next.js app to that domain (30 min, free)

Use Vercel (free tier):

```bash
# 1. Push code to GitHub (if not already)
cd /home/z/my-project
git init && git add . && git commit -m "interviewace + pwa + twa + play billing"
# Create a GitHub repo and push

# 2. Go to vercel.com → New Project → Import your GitHub repo
# 3. Vercel auto-detects Next.js. Just click Deploy.
# 4. In Vercel dashboard → Settings → Domains → Add your domain
# 5. Vercel tells you to add DNS records to your domain registrar:
#      A record: @ → 76.76.21.21
#      CNAME: www → cname.vercel-dns.com
# 6. Wait 5-30 min for DNS to propagate
# 7. Visit https://yourdomain.com — app should load

# 8. Verify the assetlinks file is reachable:
curl https://yourdomain.com/.well-known/assetlinks.json
```

### Step 3 — Install build tools on your computer (10 min)

On your **local machine** (Windows/Mac/Linux), NOT the dev server:

```bash
# 1. Install Node.js 18+: https://nodejs.org
# 2. Install Java JDK 17+: https://adoptium.net
# 3. Install Android Studio (provides Android SDK): https://developer.android.com/studio

# Verify installations:
node --version    # should be 18+
java -version     # should be 17+
echo $ANDROID_HOME # should point to Android SDK

# 4. Install Bubblewrap CLI globally:
npm install -g @bubblewrap/cli
```

### Step 4 — Generate the signed APK/AAB (15 min)

On your local machine, in your project folder:

```bash
# 1. Pull the latest code from GitHub (after Step 2)
git pull

# 2. Edit twa/twa-manifest.json — replace every occurrence of
#    INTERVIEWACE_DOMAIN_REPLACE_ME with your real domain (e.g. interviewace.app)
#    Do NOT include https:// — just the bare domain.

# 3. Run the build script:
export KEYSTORE_PASSWORD="pick-a-strong-password-and-save-it"
./scripts/build-apk.sh --play-bundle

# 4. When prompted, accept defaults. Keystore will be auto-generated.
# 5. Output: twa/app-release-bundle.aab  ← this is what you upload to Google
```

**⚠️ SAVE YOUR KEYSTORE PASSWORD.** If you lose it, you can NEVER update your app on Google Play. Back it up to:
- A password manager (1Password, Bitwarden)
- A USB stick in a drawer
- Email it to yourself encrypted
- Print on paper

### Step 5 — Get your app signing SHA256 (5 min)

1. Go to https://play.google.com/console
2. Click **"Create app"** → fill in details → create
3. Pick: App type = **Application**, Paid/Free = **Free**, Declarations = check all
4. Go to **Setup → App integrity** in the left menu
5. You'll see a section called **"App signing key certificate"**
6. Copy the **SHA-256 certificate fingerprint** (looks like `AB:CD:EF:...`)
7. Paste it into `public/.well-known/assetlinks.json` (replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256`)
8. Save, commit, push, redeploy on Vercel
9. Verify: `curl https://yourdomain.com/.well-known/assetlinks.json` should show your real SHA

### Step 6 — Set up Google Play Billing (15 min)

In Play Console:

1. Go to **Monetize → Products → Subscriptions**
2. Click **Create subscription**
3. Fill in:
   - Product ID: `pro_monthly` ← **MUST match exactly** (no spaces, lowercase)
   - Name: "InterviewAce Pro"
   - Description: "Unlimited AI mock interviews with voice mode"
   - Base price: $19.00 USD / month (auto-converts to local currencies)
   - Free trial: 7 days (optional but recommended for conversions)
4. Save → Activate
5. Create a Google Cloud service account (Play Console → Setup → API access → "Learn more" link):
   - Create service account → download JSON key
   - Grant "Financial data" permission
6. In Vercel dashboard → Settings → Environment Variables, add:
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL` = (from JSON)
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY` = (full key with \n's)
   - `GOOGLE_PLAY_PACKAGE_NAME` = `com.interviewace.app`
7. Redeploy on Vercel

### Step 7 — Fill in the Play Store listing (30 min)

In Play Console → **Grow → Store presence → Main store listing**:

**App details:**
| Field | Value |
|---|---|
| App name | `InterviewAce` |
| Short description (80 chars) | `AI mock interviews for IT jobs. Voice mode + honest scorecards.` |
| Full description | (see `play-store-listing.md` in this folder) |
| App icon | Use `/public/icons/icon-512.png` |
| Feature graphic | 1024×500 PNG (generate from a screenshot of the app) |
| Phone screenshots | 2-8 screenshots, minimum 320px, max 1080px (use `/scripts/capture-screenshots.sh` once ready) |

**Categorization:**
| Field | Value |
|---|---|
| App category | `Education` |
| Tags | `interview`, `career`, `education`, `productivity` |
| Privacy policy URL | `https://yourdomain.com/privacy` |

**Contact details:**
| Field | Value |
|---|---|
| Email | Your support email |

**Content rating:**
- Click "Start" → answer IARC questionnaire (mostly "No")
- Result: Everyone (no restrictions)

**Target audience:**
- Select: 18-24, 25-39, 40+ (i.e. working adults)
- Do NOT select under 13 or 13-17

**Ads:**
- Select: "No, this app does not contain ads"

### Step 8 — Upload AAB and submit for review (5 min)

1. Play Console → **Production** (left menu) → **Create release**
2. Add release notes: "Initial release — AI mock interviews for IT jobs."
3. Upload `app-release-bundle.aab` (from Step 4)
4. Click **Review release**
5. Google will show any errors (most common: missing privacy policy, missing content rating, missing target audience)
6. Fix any errors
7. Click **Start rollout to Production**
8. Wait 1-3 days for Google review

### Step 9 — Track review status

- Play Console → your app → **Production** → see status
- Common statuses:
  - **In review** — Google is looking at it (1-3 days)
  - **Rejected** — read the email, fix the issue, resubmit
  - **Published** — 🎉 live on Play Store

### Step 10 — 🎉 Launch

Once published, your app is live at:
```
https://play.google.com/store/apps/details?id=com.interviewace.app
```

Share this URL everywhere. Marketing ideas:
- Post on r/cscareerquestions, r/csMajors, r/jobs (don't spam — give value first)
- LinkedIn post with a screen-recording demo
- Twitter thread: "I built an AI mock interviewer for IT jobs"
- ProductHunt launch (massive free traffic)

---

## 🆘 Common issues

**Issue:** Bubblewrap errors with "Could not fetch manifest"
→ Your domain isn't deployed yet OR `manifest.json` isn't at root. Make sure `https://yourdomain.com/manifest.json` returns 200.

**Issue:** TWA shows browser address bar
→ `assetlinks.json` isn't reachable at `https://yourdomain.com/.well-known/assetlinks.json` OR the SHA256 is wrong.

**Issue:** "Insufficient permissions" on billing
→ Service account needs "Financial data" permission in Play Console.

**Issue:** Google rejects for "User Data policy"
→ Make sure privacy policy URL works AND links to your real domain (not Vercel subdomain).

**Issue:** Google rejects for "Payments policy"
→ You MUST use Google Play Billing for digital subscriptions. Don't try Stripe on Android.

---

## 📂 File locations

```
/home/z/my-project/
├── public/
│   ├── manifest.json                       ← PWA manifest
│   ├── sw.js                                ← Service worker
│   ├── icons/                               ← All Android icons
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── icon-maskable-192.png
│   │   ├── icon-maskable-512.png
│   │   ├── icon-mono-512.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-16.png
│   │   └── favicon-32.png
│   └── .well-known/assetlinks.json         ← TWA domain ownership proof
├── src/
│   ├── app/
│   │   ├── privacy/page.tsx                ← Privacy policy page
│   │   ├── layout.tsx                      ← (updated) PWA metadata
│   │   └── api/play-billing/verify/route.ts ← Google Play Billing verify endpoint
│   ├── components/pwa/PwaInstaller.tsx      ← Web install button
│   └── lib/play-billing.ts                  ← Client-side billing bridge
├── twa/
│   └── twa-manifest.json                    ← Bubblewrap TWA config
├── scripts/
│   ├── generate_pwa_icons.py                ← Regenerates icons from SVG
│   └── build-apk.sh                         ← Builds signed APK/AAB
└── PLAY_STORE_SUBMISSION.md                 ← (this file)
```

---

## 🚀 Need help?

If you hit any wall, send me:
1. The exact error message
2. The command you ran
3. What you expected to happen

I'll diagnose and walk you through the fix.
