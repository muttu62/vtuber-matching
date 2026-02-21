import type { NextRequest } from "next/server";

/**
 * リクエストの session クッキーに含まれる Firebase ID Token を
 * Firebase REST API で検証し、有効なら UID を返す。
 * 無効・未認証なら null を返す。
 */
export async function verifySession(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.users?.[0]?.localId as string) ?? null;
  } catch {
    return null;
  }
}
