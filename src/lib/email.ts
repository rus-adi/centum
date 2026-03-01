type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "no-reply@centum.local";

  if (!apiKey) {
    // No-op (dev fallback)
    console.log(`[email disabled] To=${to} Subject=${subject}`);
    return { ok: false, reason: "RESEND_API_KEY not set" as const };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Resend error:", txt);
      return { ok: false, reason: "resend_failed" as const };
    }

    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false, reason: "network_error" as const };
  }
}
