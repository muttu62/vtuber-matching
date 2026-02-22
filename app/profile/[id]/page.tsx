"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import {
  getUserProfile,
  getPublicUserProfile,
  PublicUserProfile,
  getMatchBetween,
  sendMatchRequest,
  getSentMatchesToday,
  Match,
} from "../../../lib/firestore";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingMatch, setExistingMatch] = useState<Match | null>(null);
  const [sending, setSending] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicUserProfile(id)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id || user.uid === id) return;
    getMatchBetween(user.uid, id).then(setExistingMatch);
  }, [user, id]);

  useEffect(() => {
    if (!user || !id || user.uid === id) return;
    getSentMatchesToday(user.uid).then((matches) => {
      setLimitReached(matches.length >= 1);
    });
  }, [user, id]);

  const handleSendMatch = async () => {
    if (!user || !id || !profile) return;
    setSending(true);
    try {
      await sendMatchRequest(user.uid, id, message.trim() || undefined);
      setExistingMatch({
        id: "",
        sender_id: user.uid,
        receiver_id: id,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      // 申請先へ通知メール（失敗してもブロックしない）
      const myProfile = await getUserProfile(user.uid);
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "match_request",
          receiverId: id,
          senderName: myProfile?.name || "ユーザー",
        }),
      }).catch(console.error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-400 mb-4">ユーザーが見つかりませんでした</p>
          <button
            onClick={() => router.push("/explore")}
            className="text-purple-400 hover:underline text-sm"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.uid === id;

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1"
        >
          ← 戻る
        </button>

        <div className="bg-gray-900 rounded-2xl p-8">
          {/* アバター + 名前 */}
          <div className="flex items-center gap-4 mb-6">
            {profile.avatarUrl ? (
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
              <h1 className="text-2xl font-bold text-white">
                {profile.name || "名前未設定"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {profile.userType && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    profile.userType === "vtuber"
                      ? "bg-blue-900/50 text-blue-300"
                      : profile.userType === "vtuber_creator"
                      ? "bg-yellow-500 text-black"
                      : "bg-green-900/50 text-green-300"
                  }`}>
                    {profile.userType === "vtuber" ? "VTuber" : profile.userType === "vtuber_creator" ? "VTuber兼クリエイター" : "クリエイター"}
                  </span>
                )}
                {profile.genre && (
                  <span className="text-xs text-purple-300 bg-purple-900/40 px-2 py-1 rounded-full">
                    {profile.genre}
                  </span>
                )}
                {profile.genreCreator && (
                  <span className="text-xs text-green-300 bg-green-900/40 px-2 py-1 rounded-full">
                    {profile.genreCreator}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 活動時間帯 */}
          {profile.activityTime && (
            <div className="mb-5">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">活動時間帯</h2>
              <p className="text-white">{profile.activityTime}</p>
            </div>
          )}

          {/* 自己紹介 */}
          {profile.description && (
            <div className="mb-5">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">自己紹介</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
            </div>
          )}

          {/* SNSリンク */}
          {profile.snsLinks && (
            <div className="mb-6">
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

          {/* フレンド申請ボタン（自分以外に表示） */}
          {!isOwnProfile && (
            <>
              {existingMatch ? (
                <button
                  disabled
                  className="w-full bg-gray-700 text-gray-400 font-bold py-3 rounded-lg cursor-not-allowed"
                >
                  申請済み
                </button>
              ) : limitReached ? (
                <p className="text-center text-yellow-400 text-sm py-3">
                  本日の申請可能枠（1/1）は使用済みです
                </p>
              ) : showMessageForm ? (
                <div className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="一言メッセージを添えられます（任意）"
                    rows={3}
                    maxLength={200}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 resize-none text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowMessageForm(false); setMessage(""); }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleSendMatch}
                      disabled={sending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors"
                    >
                      {sending ? "送信中..." : "送信する"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    setShowMessageForm(true);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  フレンド申請する
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
