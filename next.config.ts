import type { NextConfig } from "next";

// 許可する画像ドメイン（万が一サービスが侵害された場合でも
// これ以外のドメインからの画像はブラウザがブロックする）
const IMG_SRC = [
  "'self'",
  "data:",
  "blob:",
  "https://res.cloudinary.com",       // アバター・ロゴ
  "https://i.ytimg.com",              // YouTube動画サムネイル
  "https://yt3.googleusercontent.com", // YouTubeチャンネルアイコン
  "https://yt3.ggpht.com",            // YouTubeチャンネルアイコン（代替）
].join(" ");

// 許可するAPI接続先（意図しない外部通信を防ぐ）
const CONNECT_SRC = [
  "'self'",
  "https://identitytoolkit.googleapis.com", // Firebase Auth
  "https://securetoken.googleapis.com",     // Firebase トークンリフレッシュ
  "https://firestore.googleapis.com",       // Firestore REST API
  "https://firebase.googleapis.com",        // Firebase SDK
  "https://firebaseinstallations.googleapis.com",
  "wss://*.firebaseio.com",                 // Firestore リアルタイム
  "https://www.googleapis.com",             // YouTube Data API
].join(" ");

// Content Security Policy
// script-src の 'unsafe-inline' は Next.js のインラインスクリプトに必要
// style-src の 'unsafe-inline' は Tailwind CSS のインラインスタイルに必要
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${IMG_SRC}`,
  `connect-src ${CONNECT_SRC}`,
  "font-src 'self'",
  "frame-src 'none'",   // iframe 埋め込みを全面禁止
  "object-src 'none'",  // Flash等のプラグインを禁止
  "base-uri 'self'",    // <base> タグによるURL書き換えを防ぐ
  "form-action 'self'", // フォームの送信先を自サイトのみに制限
].join("; ");

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // コンテンツセキュリティポリシー: 許可するリソースの読み込み元をホワイトリストで管理
            // サードパーティサービスが侵害された場合でも、許可ドメイン外のリソースはブロックされる
            key: "Content-Security-Policy",
            value: CSP,
          },
          {
            // クリックジャッキング対策: iframe での埋め込みを禁止
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // MIMEタイプスニッフィング対策: ブラウザによるコンテンツタイプ推測を無効化
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // リファラー情報の送信範囲を制限（クロスオリジン時はオリジンのみ送信）
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // 不要なブラウザ機能へのアクセスを制限
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
