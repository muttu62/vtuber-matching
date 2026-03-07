"use client";
import Link from "next/link";
import { PublicUserProfile } from "../lib/firestore";

const USER_TYPE_LABEL: Record<string, string> = {
  vtuber: "VTuber",
  creator: "クリエイター",
  vtuber_creator: "VTuber兼クリエイター",
};

const COMPATIBLE_MAP: Record<string, string[]> = {
  "🎭ムードメーカー型":   ["🎭ムードメーカー型", "🧠戦略家型"],
  "🎯職人クリエイター型": ["🎯職人クリエイター型", "🎭ムードメーカー型"],
  "🌟アイドル型":         ["🌟アイドル型", "🔥チャレンジャー型"],
  "🧠戦略家型":           ["🧠戦略家型", "🌿癒し系型"],
  "🌿癒し系型":           ["🌿癒し系型", "🎯職人クリエイター型"],
  "🔥チャレンジャー型":   ["🔥チャレンジャー型", "🌟アイドル型"],
};

type Props = {
  users: PublicUserProfile[];
  myUid: string;
  myPersonalityType: string | null;
  onClose: () => void;
};

function UserRow({ user, onClose }: { user: PublicUserProfile; onClose: () => void }) {
  return (
    <Link
      href={`/profile/${user.uid}`}
      onClick={onClose}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 transition-colors"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center text-lg text-gray-400 shrink-0">
          ?
        </div>
      )}
      <div className="min-w-0">
        <p className="text-white font-bold text-sm truncate">{user.name || "名前未設定"}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          {user.userType && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              user.userType === "vtuber"
                ? "bg-blue-900/50 text-blue-300"
                : user.userType === "vtuber_creator"
                ? "bg-orange-900/50 text-orange-300"
                : "bg-green-900/50 text-green-300"
            }`}>
              {USER_TYPE_LABEL[user.userType]}
            </span>
          )}
          {user.genre && (
            <span className="text-xs text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded-full">
              {user.genre}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function PickupModal({ users, myUid, myPersonalityType, onClose }: Props) {
  // 人気のユーザー: matchCount 降順 → createdAt 降順、自分を除く
  const popular = [...users]
    .filter((u) => u.uid !== myUid)
    .sort((a, b) => {
      const ma = a.matchCount ?? 0;
      const mb = b.matchCount ?? 0;
      if (mb !== ma) return mb - ma;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    })
    .slice(0, 3);

  // 相性の良い新規ユーザー: 直近7日以内 & 相性タイプ一致、自分を除く
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const compatibleTypes = myPersonalityType ? (COMPATIBLE_MAP[myPersonalityType] ?? []) : [];
  const compatibleNew = myPersonalityType
    ? [...users]
        .filter(
          (u) =>
            u.uid !== myUid &&
            u.personalityType &&
            compatibleTypes.includes(u.personalityType) &&
            (u.createdAt ?? "") >= sevenDaysAgoISO
        )
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* モーダル */}
      <div className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-800">
        <h2 className="text-xl font-bold text-white text-center mb-5">✨本日のピックアップ✨</h2>

        {/* 人気のユーザー */}
        <section className="mb-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            🔥 人気のユーザー
          </h3>
          {popular.length === 0 ? (
            <p className="text-gray-500 text-sm px-3">まだいません</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {popular.map((u) => (
                <UserRow key={u.uid} user={u} onClose={onClose} />
              ))}
            </div>
          )}
        </section>

        {/* 相性の良い新規ユーザー */}
        {myPersonalityType && compatibleNew.length > 0 && (
          <section className="mb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              💜 あなたと相性の良い新規ユーザー
            </h3>
            <div className="divide-y divide-gray-800">
              {compatibleNew.map((u) => (
                <UserRow key={u.uid} user={u} onClose={onClose} />
              ))}
            </div>
          </section>
        )}

        <button
          onClick={onClose}
          className="w-full mt-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
        >
          とじる
        </button>
      </div>
    </div>
  );
}
