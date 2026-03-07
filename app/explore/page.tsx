"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllUsers, getUserProfile, PublicUserProfile } from "../../lib/firestore";
import { useAuth } from "../../lib/AuthContext";
import PickupModal from "../../components/PickupModal";

type FilterTab = "all" | "vtuber" | "creator" | "compatible";

const USER_TYPE_LABEL: Record<string, string> = {
  vtuber: "VTuber",
  creator: "クリエイター",
  vtuber_creator: "VTuber兼クリエイター",
};

// 相性マップ: personalityType の emoji+name → 相性の良いタイプ名リスト
const COMPATIBLE_MAP: Record<string, string[]> = {
  "🎭ムードメーカー型":   ["🎭ムードメーカー型", "🧠戦略家型"],
  "🎯職人クリエイター型": ["🎯職人クリエイター型", "🎭ムードメーカー型"],
  "🌟アイドル型":         ["🌟アイドル型", "🔥チャレンジャー型"],
  "🧠戦略家型":           ["🧠戦略家型", "🌿癒し系型"],
  "🌿癒し系型":           ["🌿癒し系型", "🎯職人クリエイター型"],
  "🔥チャレンジャー型":   ["🔥チャレンジャー型", "🌟アイドル型"],
};

function countShared(a: string[] | undefined, b: string[]): number {
  if (!a || b.length === 0) return 0;
  return a.filter((t) => b.includes(t)).length;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [myTags, setMyTags] = useState<string[]>([]);
  const [myPersonalityType, setMyPersonalityType] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showPickup, setShowPickup] = useState(false);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setMyTags([]);
      setMyPersonalityType(null);
      return;
    }
    getUserProfile(user.uid).then((p) => {
      setMyTags(p?.youtubeTags ?? []);
      setMyPersonalityType(p?.personalityType ?? null);
    });
  }, [user]);

  // 1日1回ポップアップ表示（ログイン済み・全データ読込後）
  useEffect(() => {
    if (!user || loading || myPersonalityType === undefined) return;
    const today = new Date().toISOString().slice(0, 10);
    const shown = localStorage.getItem("pickup_shown_date");
    if (shown !== today) {
      localStorage.setItem("pickup_shown_date", today);
      setShowPickup(true);
    }
  }, [user, loading, myPersonalityType]);

  // creator のみ acceptsRequests=true の場合のみ表示（vtuber / vtuber_creator は常に表示）
  const visibleUsers = users.filter(
    (u) => u.userType !== "creator" || u.acceptsRequests === true
  );

  // 相性の良いユーザー一覧
  const compatibleTypes = myPersonalityType ? (COMPATIBLE_MAP[myPersonalityType] ?? []) : [];
  const compatibleUsers = visibleUsers.filter(
    (u) => u.uid !== user?.uid && u.personalityType && compatibleTypes.includes(u.personalityType)
  );

  const filtered =
    filter === "all"
      ? visibleUsers
      : filter === "compatible"
      ? compatibleUsers
      : visibleUsers.filter((u) => {
          if (filter === "vtuber") return u.userType === "vtuber" || u.userType === "vtuber_creator";
          if (filter === "creator") return u.userType === "creator" || u.userType === "vtuber_creator";
          return false;
        });

  // ログイン済みで自分のタグがあれば共通タグ数で降順ソート（相性タブ以外）
  const displayed =
    filter !== "compatible" && myTags.length > 0
      ? [...filtered].sort(
          (a, b) => countShared(b.youtubeTags, myTags) - countShared(a.youtubeTags, myTags)
        )
      : filtered;

  const tabs: { key: FilterTab; label: string; special?: boolean }[] = [
    { key: "all", label: "すべて" },
    { key: "vtuber", label: "VTuber" },
    { key: "creator", label: "クリエイター" },
    { key: "compatible", label: "💜 相性の良い人", special: true },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      {showPickup && user && (
        <PickupModal
          users={visibleUsers}
          myUid={user.uid}
          myPersonalityType={myPersonalityType ?? null}
          onClose={() => setShowPickup(false)}
        />
      )}

      <h1 className="text-2xl font-bold text-white mb-6">ユーザーを探す</h1>

      {/* フィルタータブ */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? tab.special
                  ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-950"
                  : "bg-purple-600 text-white"
                : tab.special
                ? "bg-purple-900/40 text-purple-300 border border-purple-700 hover:bg-purple-800/50 hover:text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filter === "compatible" ? (
        /* 相性タブ */
        !user ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-3">ログインすると相性の良い人が表示されます</p>
            <Link href="/login" className="text-purple-400 hover:underline text-sm">ログインする →</Link>
          </div>
        ) : myPersonalityType === undefined ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : !myPersonalityType ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎭</p>
            <p className="text-white font-bold mb-2">性格診断がまだ完了していません</p>
            <p className="text-gray-400 text-sm mb-6">
              性格診断を受けると、相性の良いユーザーが表示されます！
            </p>
            <Link
              href="/personality-test"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              性格診断を受ける →
            </Link>
          </div>
        ) : loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : compatibleUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">相性の良いユーザーがまだいません</p>
            <p className="text-gray-500 text-xs mt-2">他のユーザーが診断を受けると表示されます</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-xs mb-4">
              あなた（{myPersonalityType}）と相性の良い人を表示しています
            </p>
            <UserGrid users={compatibleUsers} myTags={myTags} showCompatible />
          </>
        )
      ) : (
        /* 通常タブ */
        <>
          {myTags.length > 0 && (
            <p className="text-gray-500 text-xs mb-4">あなたのYouTubeタグとの共通数が多い順に表示しています</p>
          )}
          {loading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : displayed.length === 0 ? (
            <p className="text-gray-400">まだユーザーがいません</p>
          ) : (
            <UserGrid users={displayed} myTags={myTags} />
          )}
        </>
      )}
    </div>
  );
}

function UserGrid({
  users,
  myTags,
  showCompatible,
}: {
  users: PublicUserProfile[];
  myTags: string[];
  showCompatible?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((u) => {
        const shared = countShared(u.youtubeTags, myTags);
        return (
          <Link
            key={u.uid}
            href={`/profile/${u.uid}`}
            className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-2 hover:bg-gray-800 transition-colors relative"
          >
            {showCompatible && u.personalityType && (
              <span className="absolute top-4 right-4 text-xs bg-purple-600/80 text-white px-2 py-0.5 rounded-full">
                {u.personalityType}
              </span>
            )}
            {!showCompatible && shared > 0 && (
              <span className="absolute top-4 right-4 text-xs bg-purple-600/80 text-white px-2 py-0.5 rounded-full">
                共通{shared}タグ
              </span>
            )}
            {u.avatarUrl ? (
              <img
                src={u.avatarUrl}
                alt={u.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-gray-400">
                ?
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-lg">{u.name || "名前未設定"}</p>
              {u.userType && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.userType === "vtuber"
                    ? "bg-blue-900/50 text-blue-300"
                    : u.userType === "vtuber_creator"
                    ? "bg-orange-900/50 text-orange-300"
                    : "bg-green-900/50 text-green-300"
                }`}>
                  {USER_TYPE_LABEL[u.userType]}
                </span>
              )}
            </div>
            {u.genre && (
              <span className="text-xs text-purple-300 bg-purple-900/40 px-2 py-1 rounded-full w-fit">
                {u.genre}
              </span>
            )}
            {u.genreCreator && (
              <span className="text-xs text-green-300 bg-green-900/40 px-2 py-1 rounded-full w-fit">
                {u.genreCreator}
              </span>
            )}
            {u.activityTime && (
              <p className="text-gray-400 text-sm">活動時間: {u.activityTime}</p>
            )}
            {u.description && (
              <p className="text-gray-300 text-sm line-clamp-3">{u.description}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
