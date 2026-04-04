"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { SharePost, getSharePosts, createSharePost, getUserProfile } from "../../lib/firestore";

function ShareBoardContent() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSharePosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const profile = await getUserProfile(user.uid);
      const newPost: Omit<SharePost, "id"> = {
        authorUid: user.uid,
        authorName: profile?.name || "名前未設定",
        ...(profile?.avatarUrl ? { authorAvatarUrl: profile.avatarUrl } : {}),
        title: title.trim(),
        body: body.trim(),
        createdAt: new Date().toISOString(),
        commentCount: 0,
      };
      const id = await createSharePost(newPost);
      setPosts((prev) => [{ id, ...newPost }, ...prev]);
      setTitle("");
      setBody("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">みんなと共有</h1>
            <p className="text-gray-400 text-sm mt-1">ナレッジを共有するボードです</p>
          </div>
          {user && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
            >
              {showForm ? "閉じる" : "記事を書く"}
            </button>
          )}
        </div>

        {/* 投稿フォーム */}
        {showForm && user && (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 mb-6 space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">タイトル <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="記事のタイトル"
                maxLength={100}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">本文 <span className="text-red-400">*</span></label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="共有したいナレッジや情報を書いてください"
                rows={6}
                maxLength={2000}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm resize-none"
              />
              <p className="text-gray-500 text-xs mt-1 text-right">{body.length} / 2000</p>
            </div>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              {submitting ? "投稿中..." : "投稿する"}
            </button>
          </form>
        )}

        {/* ログインしていない場合の案内 */}
        {!user && (
          <div className="bg-gray-900/50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-400 border border-gray-800">
            <Link href="/login" className="text-purple-400 hover:underline">ログイン</Link>すると記事を投稿できます
          </div>
        )}

        {/* 記事一覧 */}
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-gray-400">まだ投稿がありません</p>
            <p className="text-gray-500 text-sm mt-1">最初の記事を書いてみましょう！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/share/${post.id}`}
                className="block bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 transition-colors"
              >
                <h2 className="text-white font-bold text-lg mb-2 line-clamp-2">{post.title}</h2>
                <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4">{post.body}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {post.authorAvatarUrl ? (
                      <img src={post.authorAvatarUrl} alt={post.authorName} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">?</div>
                    )}
                    <span>{post.authorName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {(post.commentCount ?? 0) > 0 && (
                      <span>💬 {post.commentCount}</span>
                    )}
                    <span>{new Date(post.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950"><p className="text-gray-400">読み込み中...</p></div>}>
      <ShareBoardContent />
    </Suspense>
  );
}
