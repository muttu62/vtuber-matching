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
  toTagArray,
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

  const handleSendMatch = async () => {
    if (!user || !id || !profile) return;
    setSending(true);
    try {
      await sendMatchRequest(user.uid, id);
      setExistingMatch({
        id: "",
        sender_id: user.uid,
        receiver_id: id,
        status: "pending",
        created_at: new Date().toISOString(),
      });
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

  // 非公開ユーザーは本人以外に表示しない
  if (!isOwnProfile && profile.isPublic === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-white font-bold mb-2">このユーザーは非公開です</p>
          <p className="text-gray-400 text-sm mb-6">プロフィールを閲覧できません</p>
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

  const genreTags = toTagArray(profile.genre);
  const genreCreatorTags = toTagArray(profile.genreCreator);
  const activityTimeTags = toTagArray(profile.activityTime);

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
                      ? "bg-orange-900/50 text-orange-300"
                      : "bg-green-900/50 text-green-300"
                  }`}>
                    {profile.userType === "vtuber" ? "VTuber" : profile.userType === "vtuber_creator" ? "VTuber兼クリエイター" : "クリエイター"}
                  </span>
                )}
                {genreTags.map((g) => (
                  <span key={g} className="text-xs text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
                {genreCreatorTags.map((g) => (
                  <span key={g} className="text-xs text-green-300 bg-green-900/40 px-2 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 活動時間帯 */}
          {activityTimeTags.length > 0 && (
            <div className="border-t border-gray-800 py-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-2">活動時間帯</h2>
              <div className="flex flex-wrap gap-1">
                {activityTimeTags.map((t) => (
                  <span key={t} className="text-xs text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 自己紹介 */}
          {profile.description && (
            <div className="border-t border-gray-800 py-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-2">自己紹介</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
            </div>
          )}

          {/* 性別情報 */}
          {(profile.characterGender || profile.personGender) && (
            <div className="border-t border-gray-800 py-4 flex flex-wrap gap-4">
              {profile.characterGender && (
                <div>
                  <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">キャラクター性別</h2>
                  <p className="text-gray-200 text-sm">{profile.characterGender}</p>
                </div>
              )}
              {profile.personGender && (
                <div>
                  <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-1">中の人の性別</h2>
                  <p className="text-gray-200 text-sm">{profile.personGender}</p>
                </div>
              )}
            </div>
          )}

          {/* コラボスタイルバッジ */}
          {profile.collaboStyle && (
            <div className="border-t border-gray-800 py-4">
              <span className="text-xs bg-purple-900/40 text-purple-300 px-3 py-1.5 rounded-full">
                コラボスタイル：{profile.collaboStyle}
              </span>
            </div>
          )}

          {/* 一緒にやりたいこと */}
          {profile.collaboWant && (
            <div className="border-t border-gray-800 py-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-2">一緒にやりたいこと</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.collaboWant}</p>
            </div>
          )}

          {/* 活動目標 */}
          {profile.activityGoal && (
            <div className="border-t border-gray-800 py-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-2">活動目標</h2>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.activityGoal}</p>
            </div>
          )}

          {/* 関連リンク */}
          {profile.snsLinks && (
            <div className="border-t border-gray-800 py-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-2">関連リンク</h2>
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

          {/* 最新の動画 */}
          {profile.youtubeVideos && profile.youtubeVideos.length > 0 && (
            <div className="border-t border-gray-800 py-4">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-3">最新の動画</h2>
              <div className="grid grid-cols-3 gap-2">
                {profile.youtubeVideos.map((video) => (
                  <a
                    key={video.videoUrl}
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-xs mt-1 line-clamp-2 leading-tight">{video.title}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 自分のプロフィール：シェアボタン */}
          {isOwnProfile && (
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`仲間を募集中🎉 Vクリで仲間を探しています！気になる方はこちらからフレンド申請👇\nhttps://v-kuri.com/profile/${id}\nVtuberのためのマッチングサービス【#Vクリマッチング】\n\n#コラボ募集中 #Vtuberのおともだち大募集`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition-colors text-center"
            >
              𝕏で募集ツイートする
            </a>
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
              ) : (
                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    handleSendMatch();
                  }}
                  disabled={sending}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  {sending ? "送信中..." : "フレンド申請する"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
