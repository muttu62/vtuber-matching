import { NextRequest, NextResponse } from "next/server";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Firebase IDトークンをサーバー側で検証する
 * verify-session.ts はリクエストからCookieを読むため、
 * ここではトークン文字列を直接受け取る別実装を使用する
 */
async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.users?.[0]?.localId as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/session
 * クライアントからFirebase IDトークンを受け取り、
 * HttpOnly・Secure・SameSite=Strict のCookieとして設定する
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "トークンが必要です" }, { status: 400 });
    }

    // Firebaseでトークンを検証してからCookieをセット
    const uid = await verifyFirebaseToken(token);
    if (!uid) {
      return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    // HttpOnly: JavaScriptからアクセス不可（XSS対策）
    // Secure: HTTPS通信時のみ送信（本番環境のみ）
    // SameSite=Strict: クロスサイトリクエストでは送信しない（CSRF対策）
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "strict",
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
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
