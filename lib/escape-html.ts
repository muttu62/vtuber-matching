/**
 * HTMLインジェクションを防ぐためのエスケープ関数
 * メールテンプレートにユーザー入力を埋め込む際に必ず使用する
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
