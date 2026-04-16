import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/waitlist
 * Body: { email: string, source?: string }
 *
 * Stores email in:
 *  1. Resend Audience (if RESEND_API_KEY + RESEND_AUDIENCE_ID are set) — primary
 *  2. Notifies admin email via Resend (if NOTIFY_EMAIL is set)
 *  3. Falls back to server console log so nothing is lost during local dev
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body?.source === "string" ? body.source : "landing";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    const notifyEmail = process.env.NOTIFY_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "BloodlinePH <onboarding@resend.dev>";

    // Always log server-side so the email is captured even if Resend fails
    console.log(`[waitlist] ${new Date().toISOString()} ${email} (source=${source})`);

    let savedToResend = false;
    let notifiedAdmin = false;

    // 1) Save to Resend Audience (contact list)
    if (apiKey && audienceId) {
      try {
        const res = await fetch(
          `https://api.resend.com/audiences/${audienceId}/contacts`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, unsubscribed: false }),
          }
        );
        if (res.ok) {
          savedToResend = true;
        } else {
          const err = await res.text();
          console.warn("[waitlist] Resend audience error:", res.status, err);
        }
      } catch (err) {
        console.warn("[waitlist] Resend audience request failed:", err);
      }
    }

    // 2) Send notification email to admin
    if (apiKey && notifyEmail) {
      try {
        const notifyRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [notifyEmail],
            subject: `🐓 New BloodlinePH Waitlist Signup: ${email}`,
            html: `
              <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
                <h2 style="color:#dc2626;margin:0 0 16px;">New waitlist signup</h2>
                <p style="font-size:18px;margin:0 0 8px;"><strong>${email}</strong></p>
                <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Source: ${source} · ${new Date().toLocaleString("en-PH")}</p>
                <a href="https://resend.com/audiences/${audienceId}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">View all contacts</a>
              </div>
            `,
          }),
        });
        if (notifyRes.ok) notifiedAdmin = true;
      } catch (err) {
        console.warn("[waitlist] Notify email failed:", err);
      }
    }

    // 3) Send a welcome email to the signup
    if (apiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: "Welcome to BloodlinePH Early Access 🐓",
            html: `
              <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a;">
                <div style="font-size:28px;font-weight:900;margin-bottom:8px;">
                  <span style="color:#dc2626;">Bloodline</span>
                  <span style="background:linear-gradient(135deg,#fbbf24,#dc2626);color:#fff;padding:4px 8px;border-radius:6px;font-size:20px;">PH</span>
                </div>
                <h1 style="font-size:24px;margin:16px 0 8px;">Salamat sa pag-sign up!</h1>
                <p style="color:#64748b;margin:0 0 16px;">Naka-list ka na sa early access ng BloodlinePH — ang unang trusted gamefowl marketplace sa Pilipinas.</p>
                <p style="margin:0 0 16px;">Abangan mo ang email namin pag-launch na ang full platform. Meanwhile, <strong>i-share mo sa mga kaibigan mo</strong> at mag-enjoy ng lifetime launch-pricing.</p>
                <p style="color:#64748b;font-size:13px;margin:24px 0 0;">— Team BloodlinePH · Walang betting. Walang e-sabong. Pure marketplace.</p>
              </div>
            `,
          }),
        });
      } catch (err) {
        console.warn("[waitlist] Welcome email failed:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      savedToResend,
      notifiedAdmin,
      loggedLocally: true,
    });
  } catch (err) {
    console.error("[waitlist] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
