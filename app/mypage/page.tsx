"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { getUserProfile, updateUserProfile, UserProfile } from "../../lib/firestore";

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  const [editingContact, setEditingContact] = useState(false);
  const [contactInput, setContactInput] = useState("");
  const [savingContact, setSavingContact] = useState(false);

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

  const handleSaveContact = async () => {
    if (!user) return;
    setSavingContact(true);
    try {
      await updateUserProfile(user.uid, { privateContact: contactInput.trim() });
      setProfile((prev) => prev ? { ...prev, privateContact: contactInput.trim() } : prev);
      setEditingContact(false);
    } finally {
      setSavingContact(false);
    }
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
            <div className="mb-4">
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

          {/* 非公開の連絡先 */}
          <div id="private-contact-section" className="border-t border-gray-800 pt-4">
            <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">非公開の連絡先</h2>
            <p className="text-gray-500 text-xs mb-3">
              マッチング成立した相手にのみ公開されます。Discordユーザー名がおすすめです。
            </p>
            {editingContact ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  placeholder="例: username / Discord: username"
                  className="w-full p-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingContact(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveContact}
                    disabled={savingContact}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                  >
                    {savingContact ? "保存中..." : "保存する"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm ${profile?.privateContact ? "text-white" : "text-gray-500"}`}>
                  {profile?.privateContact || "未設定"}
                </p>
                <button
                  onClick={() => {
                    setContactInput(profile?.privateContact ?? "");
                    setEditingContact(true);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 shrink-0"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ボタン群 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/profile/edit")}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              公開プロフィールを編集
            </button>
            <button
              onClick={() => {
                setContactInput(profile?.privateContact ?? "");
                setEditingContact(true);
                document.getElementById("private-contact-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              非公開の連絡先を編集
            </button>
          </div>
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
