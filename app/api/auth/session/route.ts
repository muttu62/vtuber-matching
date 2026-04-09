import { NextRequest, NextResponse } from "next/server";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * POST /api/auth/session
 * クライアントからFirebase IDトークンを受け取り、
 * HttpOnly・Secure・SameSite=Lax のCookieとして設定する。
 *
 * Firebase API 呼び出しは行わず JWT 形式チェックのみ実施する。
 * 実際のトークン検証は保護された API ルートの verify-session.ts が担うため、
 * この API はレスポンスを高速に返すことを優先する（UX 改善）。
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "トークンが必要です" }, { status: 400 });
    }
    // JWT は header.payload.signature の3パート構造
    if (token.split(".").length !== 3) {
      return NextResponse.json({ error: "無効なトークン形式です" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    // HttpOnly: JavaScriptからアクセス不可（XSS対策）
    // Secure: HTTPS通信時のみ送信（本番環境のみ）
    // SameSite=Lax: トップレベルナビゲーション（リンク遷移）ではCookieを送信しCSRFを防ぐ
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/session
 * セッションCookieを削除してログアウトする
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
