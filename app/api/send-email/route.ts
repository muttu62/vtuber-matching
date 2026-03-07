import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/verify-session";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Vクリマッチング <noreply@v-kuri.com>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const LOGO_URL = "https://res.cloudinary.com/djl6ceb4w/image/upload/v1772841919/logo_zbykjc.webp";

// Firestore REST API でユーザー情報をサーバー側から取得（クライアントにメールを渡さない）
async function getFirestoreUser(uid: string): Promise<{ email: string; name: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`
  );
  if (!res.ok) return { email: "", name: "ユーザー" };
  const data = await res.json();
  return {
    email: data.fields?.email?.stringValue ?? "",
    name: data.fields?.name?.stringValue ?? "ユーザー",
  };
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
  const uid = await verifySession(req);
  if (!uid) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const body: EmailPayload = await req.json();

    if (body.type === "match_request") {
      const receiver = await getFirestoreUser(body.receiverId);
      if (!receiver.email) {
        return NextResponse.json({ error: "送信先が見つかりません" }, { status: 400 });
      }
      await resend.emails.send({
        from: FROM,
        to: receiver.email,
        subject: `【Vクリマッチング】${body.senderName} さんからコラボ申請が届きました🎉`,
        html: buildEmail(
          `${receiver.name} さん、<strong style="color:#e2e2ee;">${body.senderName}</strong> さんからコラボ申請が届きました！<br><br>マッチング画面から内容を確認して、承認するとマッチング成立です✨`,
          "申請を確認する →",
          `${BASE_URL}/matches`
        ),
      });

    } else if (body.type === "match_accepted") {
      const [sender, receiver] = await Promise.all([
        getFirestoreUser(body.senderId),
        getFirestoreUser(body.receiverId),
      ]);
      // 申請者（sender）へ
      if (sender.email) {
        await resend.emails.send({
          from: FROM,
          to: sender.email,
          subject: `【Vクリマッチング】マッチングが成立しました🎊`,
          html: buildEmail(
            `${sender.name} さん、おめでとうございます🎉<br><br><strong style="color:#e2e2ee;">${receiver.name}</strong> さんがコラボ申請を承認しました！<br><br>SNSで連絡を取り合ってコラボの詳細を決めましょう✨`,
            "マッチング一覧を見る →",
            `${BASE_URL}/matches`
          ),
        });
      }
      // 承認者（receiver）へ
      if (receiver.email) {
        await resend.emails.send({
          from: FROM,
          to: receiver.email,
          subject: `【Vクリマッチング】マッチングが成立しました🎊`,
          html: buildEmail(
            `${receiver.name} さん、おめでとうございます🎉<br><br><strong style="color:#e2e2ee;">${sender.name}</strong> さんとのマッチングが成立しました！<br><br>SNSで連絡を取り合ってコラボの詳細を決めましょう✨`,
            "マッチング一覧を見る →",
            `${BASE_URL}/matches`
          ),
        });
      }
    } else {
      return NextResponse.json({ error: "不明なタイプ" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[/api/send-email] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
