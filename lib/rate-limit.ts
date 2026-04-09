/**
 * IPベースの簡易レート制限
 * 同一IPから指定時間内に指定回数を超えるリクエストがあった場合は false を返す
 *
 * 注意: Next.jsのサーバーレス環境では複数インスタンス間でMapが共有されないため
 * 本番規模のレート制限にはRedis等の外部ストアが必要。
 * 現状は単一インスタンスでの基本的な乱用防止として機能する。
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  limit = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // 許可
  }

  if (entry.count >= limit) {
    return false; // レート制限
  }

  entry.count++;
  return true; // 許可
}
