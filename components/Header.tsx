"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import { getUserProfile } from "../lib/firestore";

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [noContact, setNoContact] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // ポップアップ外クリックで閉じる
  useEffect(() => {
    if (!showPopup) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popupRef.current && !popupRef.current.contains(target) &&
        navRef.current && !navRef.current.contains(target)
      ) {
        setShowPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPopup]);

  // ログイン後はポップアップを自動で閉じる
  useEffect(() => {
    if (user) setShowPopup(false);
  }, [user]);

  // 非公開の連絡先が未設定かチェック
  useEffect(() => {
    if (!user) { setNoContact(false); return; }
    getUserProfile(user.uid).then((p) => {
      setNoContact(!(p?.contactPlatform || p?.contactValue || p?.privateContact));
    });
  }, [user]);

  // ログイン済みのとき pending 件数をリアルタイム取得
  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    const q = query(
      collection(db, "matches"),
      where("receiver_id", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const count = snap.docs.filter((d) => d.data().status === "pending").length;
      setPendingCount(count);
    });
    return unsubscribe;
  }, [user]);

  const publicLinks = [
    { href: "/diagnosis", label: "相性診断", tour: "diagnosis-nav" },
    { href: "/share", label: "みんなと共有", tour: "share-nav" },
  ];

  const authLinks = [
    { href: "/matches", label: "申請", badge: pendingCount, alert: false, tour: "" },
    { href: "/mypage", label: "マイページ", badge: 0, alert: noContact, tour: "mypage-nav" },
  ];

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4">
        {/* モバイル: 2行レイアウト / デスクトップ: 1行 */}
        <div className="flex items-center justify-between h-12 md:hidden border-b border-white/10">
          {/* 1行目: ロゴ（左） */}
          <Link href="/about" className="text-white font-bold text-lg tracking-tight">
            <img src="/logo.webp" alt="Vクリ" className="h-7 w-auto" />
          </Link>
          {/* 1行目: 申請・マイページ（右） */}
          <nav ref={navRef} className="flex items-center gap-1">
            {authLinks.map(({ href, label, badge, alert, tour }) =>
              user ? (
                <Link
                  key={href}
                  href={href}
                  data-tour={tour || undefined}
                  className={`relative px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === href
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {label}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  {alert && badge === 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center leading-none">
                      !
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  key={href}
                  onClick={() => setShowPopup((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  {label}
                </button>
              )
            )}
          </nav>
        </div>
        {/* 2行目: 探す・相性診断・みんなと共有（中央寄せ） */}
        <div className="flex justify-center gap-1 py-2 md:hidden">
          <Link
            href="/explore"
            className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors whitespace-nowrap ${
              pathname === "/explore"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            探す
          </Link>
          {publicLinks.map(({ href, label, tour }) => (
            <Link
              key={href}
              href={href}
              data-tour={tour}
              className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors whitespace-nowrap ${
                pathname === href
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* デスクトップ: 1行レイアウト */}
        <div className="hidden md:flex md:h-14 md:items-center justify-between">
          <Link href="/about" className="text-white font-bold text-lg tracking-tight">
            <img src="/logo.webp" alt="Vクリ" className="h-8 w-auto" />
          </Link>
          <nav ref={navRef} className="flex items-center gap-1">
            <Link
              href="/explore"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === "/explore"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              探す
            </Link>
            {publicLinks.map(({ href, label, tour }) => (
              <Link
                key={href}
                href={href}
                data-tour={tour}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === href
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {label}
              </Link>
            ))}
            {authLinks.map(({ href, label, badge, alert, tour }) =>
              user ? (
                <Link
                  key={href}
                  href={href}
                  data-tour={tour || undefined}
                  className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === href
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {label}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  {alert && badge === 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center leading-none">
                      !
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  key={href}
                  onClick={() => setShowPopup((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  {label}
                </button>
              )
            )}
          </nav>
        </div>
      </div>

      {/* 未ログイン時のポップアップ（fixed でスマホでも確実に表示） */}
      {showPopup && (
        <div
          ref={popupRef}
          className="fixed top-14 right-4 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 z-50"
        >
          <p className="text-gray-300 text-sm text-center mb-3">ログインが必要です</p>
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={() => setShowPopup(false)}
              className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              onClick={() => setShowPopup(false)}
              className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors text-sm"
            >
              新規登録
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
