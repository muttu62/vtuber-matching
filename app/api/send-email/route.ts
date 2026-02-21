import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/verify-session";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "VTuberMatch <onboarding@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type MatchRequestPayload = {
  type: "match_request";
  receiverEmail: string;
  receiverName: string;
  senderName: string;
};

type MatchAcceptedPayload = {
  type: "match_accepted";
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  receiverName: string;
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
      await resend.emails.send({
        from: FROM,
        to: body.receiverEmail,
        subject: `【VTuberMatch】${body.senderName} さんからコラボ申請が届きました`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#7c3aed;">コラボ申請が届きました！</h2>
            <p>${body.receiverName} さん</p>
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
      // 申請者（sender）へ
      await resend.emails.send({
        from: FROM,
        to: body.senderEmail,
        subject: `【VTuberMatch】${body.receiverName} さんとマッチングが成立しました！`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#7c3aed;">マッチング成立！</h2>
            <p>${body.senderName} さん</p>
            <p><strong>${body.receiverName}</strong> さんがコラボ申請を承認しました。</p>
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
      // 承認者（receiver）へ
      await resend.emails.send({
        from: FROM,
        to: body.receiverEmail,
        subject: `【VTuberMatch】${body.senderName} さんとマッチングが成立しました！`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#7c3aed;">マッチング成立！</h2>
            <p>${body.receiverName} さん</p>
            <p><strong>${body.senderName}</strong> さんとのマッチングが成立しました。</p>
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
    } else {
      return NextResponse.json({ error: "不明なタイプ" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[/api/send-email] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
