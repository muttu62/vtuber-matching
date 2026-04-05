import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/verify-session";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Vクリマッチング <noreply@v-kuri.com>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const LOGO_URL = "https://res.cloudinary.com/djl6ceb4w/image/upload/v1772841919/logo_zbykjc.webp";

// Firestore REST API でユーザー情報をサーバー側から取得（認証トークン付き）
async function getFirestoreUser(uid: string, authToken: string): Promise<{ email: string; name: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  console.log(`[send-email] getFirestoreUser uid=${uid} url=${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`[send-email] Firestore response status=${res.status} for uid=${uid}`);
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[send-email] Firestore read failed: ${errText}`);
    return { email: "", name: "ユーザー" };
  }
  const data = await res.json();
  const email = data.fields?.email?.stringValue ?? "";
  const name = data.fields?.name?.stringValue ?? "ユーザー";
  console.log(`[send-email] Firestore user fetched: name=${name} hasEmail=${!!email}`);
  return { email, name };
}

function buildEmail(body: string, buttonText: string, buttonHref: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;">
          <!-- ヘッダー -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="${LOGO_URL}" alt="Vクリ" height="40" style="display:block;">
            </td>
          </tr>
          <!-- カード -->
          <tr>
            <td style="background:#1a1a22;border:1px solid #2e2e3e;border-radius:16px;padding:36px 32px;">
              <!-- 本文 -->
              <p style="margin:0 0 28px;color:#e2e2ee;font-size:15px;line-height:1.75;">
                ${body}
              </p>
              <!-- ボタン -->
              <div style="text-align:center;">
                <a href="${buttonHref}"
                   style="display:inline-block;background:linear-gradient(135deg,#7c6aff,#ff6ab0);color:#fff;font-weight:bold;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:8px;">
                  ${buttonText}
                </a>
              </div>
            </td>
          </tr>
          <!-- フッター -->
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
}

type MatchRequestPayload = {
  type: "match_request";
  receiverId: string;
  senderName: string;
};

type MatchAcceptedPayload = {
  type: "match_accepted";
  senderId: string;
  receiverId: string;
};

type EmailPayload = MatchRequestPayload | MatchAcceptedPayload;

export async function POST(req: NextRequest) {
  console.log("[send-email] POST called");
  console.log("[send-email] RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);

  const token = req.cookies.get("session")?.value ?? null;
  const uid = await verifySession(req);
  if (!uid || !token) {
    console.error("[send-email] 認証失敗 uid=", uid, "hasToken=", !!token);
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  console.log("[send-email] 認証OK uid=", uid);

  try {
    const body: EmailPayload = await req.json();
    console.log("[send-email] body.type=", body.type);

    if (body.type === "match_request") {
      const receiver = await getFirestoreUser(body.receiverId, token);
      if (!receiver.email) {
        console.error("[send-email] receiver email not found for uid=", body.receiverId);
        return NextResponse.json({ error: "送信先が見つかりません" }, { status: 400 });
      }
      console.log("[send-email] sending match_request to", receiver.email);
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: receiver.email,
        subject: `【Vクリマッチング】${body.senderName} さんからコラボ申請が届きました🎉`,
        html: buildEmail(
          `${receiver.name} さん、<strong style="color:#e2e2ee;">${body.senderName}</strong> さんからコラボ申請が届きました！<br><br>マッチング画面から内容を確認して、承認するとマッチング成立です✨`,
          "申請を確認する →",
          `${BASE_URL}/matches`
        ),
      });
      console.log("[send-email] resend result:", JSON.stringify({ data, error }));
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

    } else if (body.type === "match_accepted") {
      const [sender, receiver] = await Promise.all([
        getFirestoreUser(body.senderId, token),
        getFirestoreUser(body.receiverId, token),
      ]);
      // 申請者（sender）へ
      if (sender.email) {
        console.log("[send-email] sending match_accepted to sender", sender.email);
        const { data, error } = await resend.emails.send({
          from: FROM,
          to: sender.email,
          subject: `【Vクリマッチング】マッチングが成立しました🎊`,
          html: buildEmail(
            `${sender.name} さん、おめでとうございます🎉<br><br><strong style="color:#e2e2ee;">${receiver.name}</strong> さんがコラボ申請を承認しました！<br><br>SNSで連絡を取り合ってコラボの詳細を決めましょう✨`,
            "マッチング一覧を見る →",
            `${BASE_URL}/matches`
          ),
        });
        console.log("[send-email] sender result:", JSON.stringify({ data, error }));
      } else {
        console.warn("[send-email] sender email not found uid=", body.senderId);
      }
      // 承認者（receiver）へ
      if (receiver.email) {
        console.log("[send-email] sending match_accepted to receiver", receiver.email);
        const { data, error } = await resend.emails.send({
          from: FROM,
          to: receiver.email,
          subject: `【Vクリマッチング】マッチングが成立しました🎊`,
          html: buildEmail(
            `${receiver.name} さん、おめでとうございます🎉<br><br><strong style="color:#e2e2ee;">${sender.name}</strong> さんとのマッチングが成立しました！<br><br>SNSで連絡を取り合ってコラボの詳細を決めましょう✨`,
            "マッチング一覧を見る →",
            `${BASE_URL}/matches`
          ),
        });
        console.log("[send-email] receiver result:", JSON.stringify({ data, error }));
      } else {
        console.warn("[send-email] receiver email not found uid=", body.receiverId);
      }
    } else {
      return NextResponse.json({ error: "不明なタイプ" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[/api/send-email] exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
