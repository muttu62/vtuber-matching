import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/verify-session";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VTuberMatch <onboarding@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

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

type MatchRequestPayload = {
  type: "match_request";
  receiverId: string;  // UID — サーバー側でメール・名前を取得
  senderName: string;
};

type MatchAcceptedPayload = {
  type: "match_accepted";
  senderId: string;    // UID — サーバー側でメール・名前を取得
  receiverId: string;  // UID — サーバー側でメール・名前を取得
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
        subject: `【VTuberMatch】${body.senderName} さんからコラボ申請が届きました`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#7c3aed;">コラボ申請が届きました！</h2>
            <p>${receiver.name} さん</p>
            <p><strong>${body.senderName}</strong> さんがコラボを申請しています。</p>
            <p style="margin-top:24px;">
              <a href="${BASE_URL}/matches"
                 style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                申請を確認する
              </a>
            </p>
          </div>
        `,
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
          subject: `【VTuberMatch】${receiver.name} さんとマッチングが成立しました！`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h2 style="color:#7c3aed;">マッチング成立！</h2>
              <p>${sender.name} さん</p>
              <p><strong>${receiver.name}</strong> さんがコラボ申請を承認しました。</p>
              <p>SNSで連絡を取り合ってコラボの詳細を決めましょう！</p>
              <p style="margin-top:24px;">
                <a href="${BASE_URL}/matches"
                   style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                  マッチング一覧を見る
                </a>
              </p>
            </div>
          `,
        });
      }
      // 承認者（receiver）へ
      if (receiver.email) {
        await resend.emails.send({
          from: FROM,
          to: receiver.email,
          subject: `【VTuberMatch】${sender.name} さんとマッチングが成立しました！`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h2 style="color:#7c3aed;">マッチング成立！</h2>
              <p>${receiver.name} さん</p>
              <p><strong>${sender.name}</strong> さんとのマッチングが成立しました。</p>
              <p>SNSで連絡を取り合ってコラボの詳細を決めましょう！</p>
              <p style="margin-top:24px;">
                <a href="${BASE_URL}/matches"
                   style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                  マッチング一覧を見る
                </a>
              </p>
            </div>
          `,
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
