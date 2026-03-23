import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SITE_EMAIL = "info@mirakil.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketPayload {
  type: "new_ticket" | "ticket_reply";
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  description?: string;
  reply_message?: string;
  reply_from?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: TicketPayload = await req.json();

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emails: Array<{ from: string; to: string; subject: string; html: string }> = [];

    if (payload.type === "new_ticket") {
      // Email to customer
      emails.push({
        from: "MirAkıl Destek <onboarding@resend.dev>",
        to: payload.customer_email,
        subject: `Destek Talebiniz Alındı - ${payload.ticket_number}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#253437,#1a5a00);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">MirAkıl Destek</h1>
            </div>
            <div style="background:#f9f9f9;padding:30px;border:1px solid #e0e0e0;">
              <p>Sayın <strong>${payload.customer_name}</strong>,</p>
              <p>Destek talebiniz başarıyla oluşturulmuştur.</p>
              <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin:20px 0;">
                <p style="margin:0 0 8px;"><strong>Ticket Numarası:</strong> <span style="color:#2E7C01;font-size:18px;font-weight:bold;">${payload.ticket_number}</span></p>
                <p style="margin:0 0 8px;"><strong>Konu:</strong> ${payload.subject}</p>
                <p style="margin:0;"><strong>Açıklama:</strong> ${payload.description || ""}</p>
              </div>
              <p>Talebinizi aşağıdaki bağlantıdan takip edebilirsiniz:</p>
              <p><a href="https://mehmetfatruk.github.io/mirakil_web/destek.html?tab=track&email=${encodeURIComponent(payload.customer_email)}&ticket=${encodeURIComponent(payload.ticket_number)}" style="display:inline-block;background:#2E7C01;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Talebimi Takip Et</a></p>
              <p style="color:#666;font-size:13px;margin-top:24px;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen ticket numaranızı saklayınız.</p>
            </div>
            <div style="background:#111;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="color:#999;margin:0;font-size:12px;">&copy; 2026 MirAkıl Veri İşleme | info@mirakil.com</p>
            </div>
          </div>
        `,
      });

      // Email to admin
      emails.push({
        from: "MirAkıl Sistem <onboarding@resend.dev>",
        to: SITE_EMAIL,
        subject: `Yeni Destek Talebi - ${payload.ticket_number}: ${payload.subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:#d4edda;border:1px solid #c3e6cb;border-radius:8px;padding:20px;margin-bottom:16px;">
              <h2 style="color:#155724;margin:0 0 12px;">Yeni Destek Talebi</h2>
              <p style="margin:0;color:#155724;">Ticket: <strong>${payload.ticket_number}</strong></p>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:120px;">Ad Soyad</td><td style="padding:8px;border-bottom:1px solid #eee;">${payload.customer_name}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">E-posta</td><td style="padding:8px;border-bottom:1px solid #eee;">${payload.customer_email}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Konu</td><td style="padding:8px;border-bottom:1px solid #eee;">${payload.subject}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Açıklama</td><td style="padding:8px;">${payload.description || ""}</td></tr>
            </table>
            <p style="margin-top:20px;"><a href="https://mehmetfatruk.github.io/mirakil_web/admin.html" style="display:inline-block;background:#2E7C01;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Admin Paneline Git</a></p>
          </div>
        `,
      });
    } else if (payload.type === "ticket_reply") {
      // Notify customer about admin reply
      emails.push({
        from: "MirAkıl Destek <onboarding@resend.dev>",
        to: payload.customer_email,
        subject: `Destek Talebinize Yanıt - ${payload.ticket_number}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#253437,#1a5a00);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">MirAkıl Destek</h1>
            </div>
            <div style="background:#f9f9f9;padding:30px;border:1px solid #e0e0e0;">
              <p>Sayın <strong>${payload.customer_name}</strong>,</p>
              <p><strong>${payload.ticket_number}</strong> numaralı destek talebinize yanıt verilmiştir:</p>
              <div style="background:#e8f5e9;border-left:4px solid #2E7C01;padding:16px;margin:20px 0;border-radius:0 8px 8px 0;">
                <p style="margin:0;color:#1a5a00;font-weight:bold;margin-bottom:8px;">MirAkıl Destek:</p>
                <p style="margin:0;">${payload.reply_message || ""}</p>
              </div>
              <p><a href="https://mehmetfatruk.github.io/mirakil_web/destek.html?tab=track&email=${encodeURIComponent(payload.customer_email)}&ticket=${encodeURIComponent(payload.ticket_number)}" style="display:inline-block;background:#2E7C01;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Talebimi Görüntüle</a></p>
            </div>
            <div style="background:#111;padding:16px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="color:#999;margin:0;font-size:12px;">&copy; 2026 MirAkıl Veri İşleme | info@mirakil.com</p>
            </div>
          </div>
        `,
      });
    }

    // Send all emails via Resend
    const results = await Promise.allSettled(
      emails.map((email) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify(email),
        })
      )
    );

    const statuses = results.map((r, i) => ({
      to: emails[i].to,
      status: r.status === "fulfilled" ? (r.value as Response).status : "failed",
    }));

    return new Response(JSON.stringify({ success: true, emails: statuses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
