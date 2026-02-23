"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllUsers, getUserProfile, PublicUserProfile } from "../../lib/firestore";
import { useAuth } from "../../lib/AuthContext";

type FilterTab = "all" | "vtuber" | "creator";

const USER_TYPE_LABEL: Record<string, string> = {
  vtuber: "VTuber",
  creator: "クリエイター",
  vtuber_creator: "VTuber兼クリエイター",
};

function countShared(a: string[] | undefined, b: string[]): number {
  if (!a || b.length === 0) return 0;
  return a.filter((t) => b.includes(t)).length;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [myTags, setMyTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setMyTags([]); return; }
    getUserProfile(user.uid).then((p) => setMyTags(p?.youtubeTags ?? []));
  }, [user]);

  // creator のみ acceptsRequests=true の場合のみ表示（vtuber / vtuber_creator は常に表示）
  const visibleUsers = users.filter(
    (u) => u.userType !== "creator" || u.acceptsRequests === true
  );
  const filtered =
    filter === "all"
      ? visibleUsers
      : visibleUsers.filter((u) => {
          if (filter === "vtuber") return u.userType === "vtuber" || u.userType === "vtuber_creator";
          if (filter === "creator") return u.userType === "creator" || u.userType === "vtuber_creator";
          return false;
        });

  // ログイン済みで自分のタグがあれば共通タグ数で降順ソート
  const displayed =
    myTags.length > 0
      ? [...filtered].sort(
          (a, b) => countShared(b.youtubeTags, myTags) - countShared(a.youtubeTags, myTags)
        )
      : filtered;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "vtuber", label: "VTuber" },
    { key: "creator", label: "クリエイター" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-2xl font-bold text-white mb-6">ユーザーを探す</h1>

      {/* フィルタータブ */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {myTags.length > 0 && (
        <p className="text-gray-500 text-xs mb-4">あなたのYouTubeタグとの共通数が多い順に表示しています</p>
      )}

      {loading ? (
        <p className="text-gray-400">読み込み中...</p>
      ) : displayed.length === 0 ? (
        <p className="text-gray-400">まだユーザーがいません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((u) => {
            const shared = countShared(u.youtubeTags, myTags);
            return (
            <Link key={u.uid} href={`/profile/${u.uid}`} className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-2 hover:bg-gray-800 transition-colors relative">
              {shared > 0 && (
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
      )}
    </div>
  );
}
