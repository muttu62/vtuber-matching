"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { getUserProfile, UserProfile } from "../../lib/firestore";

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then(setProfile)
      .finally(() => setFetching(false));
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = "session=; path=/; max-age=0";
    router.push("/login");
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">マイページ</h1>

        <div className="bg-gray-900 rounded-2xl p-8 mb-4">
          {/* アバター + 名前 */}
          <div className="flex items-center gap-4 mb-6">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl text-gray-400">
                ?
              </div>
            )}
            <div>
              <p className="text-2xl font-bold text-white">
                {profile?.name || "名前未設定"}
              </p>
              {profile?.genre && (
                <span className="text-xs text-purple-300 bg-purple-900/40 px-2 py-1 rounded-full inline-block mt-1">
                  {profile.genre}
                </span>
              )}
            </div>
          </div>

          {/* 活動時間帯 */}
          {profile?.activityTime && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">活動時間帯</h2>
              <p className="text-white">{profile.activityTime}</p>
            </div>
          )}

          {/* 自己紹介 */}
          {profile?.description && (
            <div className="mb-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">自己紹介</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
            </div>
          )}

          {/* SNSリンク */}
          {profile?.snsLinks && (
            <div>
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">SNSリンク</h2>
              {profile.snsLinks.startsWith("http") ? (
                <a
                  href={profile.snsLinks}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline break-all"
                >
                  {profile.snsLinks}
                </a>
              ) : (
                <p className="text-gray-200 break-all">{profile.snsLinks}</p>
              )}
            </div>
          )}
        </div>

        {/* ボタン群 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/profile/edit")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            プロフィールを編集する
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
