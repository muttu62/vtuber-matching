import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Vクリマッチング <noreply@v-kuri.com>";

export async function POST(req: NextRequest) {
  try {
    const { name, email, category, body } = await req.json();

    if (!email || !category || !body) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const contactEmail = process.env.CONTACT_EMAIL;
    if (!contactEmail) {
      return NextResponse.json({ error: "送信先が設定されていません" }, { status: 500 });
    }

    const senderLabel = name ? name : "匿名";
    const subject = `【Vクリお問い合わせ】${category} - ${senderLabel}`;

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;">
          <tr>
            <td style="background:#1a1a22;border:1px solid #2e2e3e;border-radius:16px;padding:36px 32px;">
              <h2 style="margin:0 0 20px;color:#e2e2ee;font-size:18px;">お問い合わせが届きました</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2e2e3e;">
                    <span style="color:#7070a0;font-size:12px;display:block;margin-bottom:2px;">種別</span>
                    <span style="color:#e2e2ee;font-size:14px;">${category}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2e2e3e;">
                    <span style="color:#7070a0;font-size:12px;display:block;margin-bottom:2px;">お名前</span>
                    <span style="color:#e2e2ee;font-size:14px;">${senderLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #2e2e3e;">
                    <span style="color:#7070a0;font-size:12px;display:block;margin-bottom:2px;">返信先メール</span>
                    <span style="color:#e2e2ee;font-size:14px;">${email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;">
                    <span style="color:#7070a0;font-size:12px;display:block;margin-bottom:6px;">内容</span>
                    <p style="margin:0;color:#e2e2ee;font-size:14px;line-height:1.75;white-space:pre-wrap;">${body}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:#7070a0;font-size:12px;">© Vクリマッチング - v-kuri.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    await resend.emails.send({
      from: FROM,
      to: contactEmail,
      replyTo: email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[/api/contact] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
