"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // ポップアップ外クリックで閉じる
  useEffect(() => {
    if (!showPopup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
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

  const authLinks = [
    { href: "/matches", label: "申請", badge: pendingCount },
    { href: "/mypage", label: "マイページ", badge: 0 },
  ];

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/about" className="text-white font-bold text-lg tracking-tight">
          Vクリ
        </Link>
        <nav className="flex items-center gap-1 relative" ref={popupRef}>
          {/* 探す（公開） */}
          <Link
            href="/explore"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/explore"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            探す
          </Link>

          {/* 申請・マイページ（要ログイン） */}
          {authLinks.map(({ href, label, badge }) =>
            user ? (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
              </Link>
            ) : (
              <button
                key={href}
                onClick={() => setShowPopup((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                {label}
              </button>
            )
          )}

          {/* 未ログイン時のポップアップ */}
          {showPopup && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 z-50">
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
        </nav>
      </div>
    </header>
  );
}
