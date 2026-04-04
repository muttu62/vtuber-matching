"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../lib/AuthContext";
import {
  SharePost, ShareComment,
  getSharePost, getShareComments, createShareComment, deleteSharePost, getUserProfile,
} from "../../../lib/firestore";

function SharePostContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<SharePost | null>(null);
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getSharePost(id), getShareComments(id)])
      .then(([p, c]) => {
        setPost(p);
        setComments(c);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentBody.trim()) return;
    setSubmitting(true);
    try {
      const profile = await getUserProfile(user.uid);
      const newComment: Omit<ShareComment, "id"> = {
        postId: id,
        authorUid: user.uid,
        authorName: profile?.name || "名前未設定",
        ...(profile?.avatarUrl ? { authorAvatarUrl: profile.avatarUrl } : {}),
        body: commentBody.trim(),
        createdAt: new Date().toISOString(),
      };
      await createShareComment(newComment);
      setComments((prev) => [...prev, { id: Date.now().toString(), ...newComment }]);
      setPost((prev) => prev ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 } : prev);
      setCommentBody("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !user || user.uid !== post.authorUid) return;
    if (!confirm("この記事を削除しますか？")) return;
    setDeleting(true);
    try {
      await deleteSharePost(id);
      router.push("/share");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-400 mb-4">記事が見つかりません</p>
          <Link href="/share" className="text-purple-400 hover:underline text-sm">← 一覧に戻る</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/share" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">← 一覧に戻る</Link>

        {/* 記事本文 */}
        <article className="bg-gray-900 rounded-2xl p-8 mb-8">
          <h1 className="text-2xl font-bold text-white mb-4">{post.title}</h1>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt={post.authorName} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">?</div>
              )}
              <span className="text-gray-300 text-sm">{post.authorName}</span>
              <span className="text-gray-600 text-xs">{new Date(post.createdAt).toLocaleDateString("ja-JP")}</span>
            </div>
            {user && user.uid === post.authorUid && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            )}
          </div>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </article>

        {/* コメント */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">
            コメント
            {comments.length > 0 && <span className="ml-2 text-sm text-gray-400 font-normal">（{comments.length}件）</span>}
          </h2>

          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm mb-6">まだコメントはありません</p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {c.authorAvatarUrl ? (
                      <img src={c.authorAvatarUrl} alt={c.authorName} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">?</div>
                    )}
                    <span className="text-gray-300 text-sm font-medium">{c.authorName}</span>
                    <span className="text-gray-600 text-xs">{new Date(c.createdAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <form onSubmit={handleComment} className="space-y-3">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="コメントを書く..."
                rows={3}
                maxLength={500}
                required
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 text-sm resize-none"
              />
              <p className="text-gray-500 text-xs text-right">{commentBody.length} / 500</p>
              <button
                type="submit"
                disabled={submitting || !commentBody.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                {submitting ? "送信中..." : "コメントする"}
              </button>
            </form>
          ) : (
            <p className="text-gray-500 text-sm">
              <Link href="/login" className="text-purple-400 hover:underline">ログイン</Link>するとコメントできます
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SharePostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950"><p className="text-gray-400">読み込み中...</p></div>}>
      <SharePostContent />
    </Suspense>
  );
}
