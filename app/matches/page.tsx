"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import {
  Match,
  UserProfile,
  getReceivedMatches,
  getSentMatches,
  getUserProfile,
  updateMatchStatus,
} from "../../lib/firestore";

type MatchWithProfile = Match & { profile: UserProfile | null };

const statusLabel: Record<Match["status"], string> = {
  pending: "保留中",
  accepted: "承認済み",
  rejected: "拒否済み",
};

const statusColor: Record<Match["status"], string> = {
  pending: "text-yellow-400",
  accepted: "text-green-400",
  rejected: "text-red-400",
};

export default function MatchesPage() {
  const { user, loading } = useAuth();

  const [received, setReceived] = useState<MatchWithProfile[]>([]);
  const [sent, setSent] = useState<MatchWithProfile[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const [receivedMatches, sentMatches, me] = await Promise.all([
        getReceivedMatches(user.uid),
        getSentMatches(user.uid),
        getUserProfile(user.uid),
      ]);

      const [receivedWithProfiles, sentWithProfiles] = await Promise.all([
        Promise.all(
          receivedMatches.map(async (m) => ({
            ...m,
            profile: await getUserProfile(m.sender_id),
          }))
        ),
        Promise.all(
          sentMatches.map(async (m) => ({
            ...m,
            profile: await getUserProfile(m.receiver_id),
          }))
        ),
      ]);

      setMyProfile(me);
      setReceived(receivedWithProfiles);
      setSent(sentWithProfiles);
      setFetching(false);
    };

    fetchAll();
  }, [user]);

  const handleUpdateStatus = async (matchId: string, status: Match["status"]) => {
    setUpdating(matchId);
    try {
      await updateMatchStatus(matchId, status);
      setReceived((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status } : m))
      );
      // マッチング成立時に両者へ通知メール（失敗してもブロックしない）
      if (status === "accepted") {
        const match = received.find((m) => m.id === matchId);
        if (match?.profile && myProfile) {
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "match_accepted",
              senderEmail: match.profile.email,
              senderName: match.profile.name || "ユーザー",
              receiverEmail: myProfile.email,
              receiverName: myProfile.name || "ユーザー",
            }),
          }).catch(console.error);
        }
      }
    } finally {
      setUpdating(null);
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
      <div className="max-w-2xl mx-auto space-y-10">
        {/* 受け取った申請 */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            受け取ったコラボ申請
            {received.length > 0 && (
              <span className="ml-2 text-sm text-gray-400 font-normal">（{received.length}件）</span>
            )}
          </h2>

          {received.length === 0 ? (
            <p className="text-gray-500 text-sm">まだ申請はありません</p>
          ) : (
            <div className="space-y-3">
              {received.map((m) => (
                <div key={m.id} className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                      ?
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${m.sender_id}`}
                        className="text-white font-medium hover:underline truncate block"
                      >
                        {m.profile?.name || "名前未設定"}
                      </Link>
                      {m.profile?.genre && (
                        <span className="text-xs text-purple-300">{m.profile.genre}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(m.id, "accepted")}
                          disabled={updating === m.id}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(m.id, "rejected")}
                          disabled={updating === m.id}
                          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          拒否
                        </button>
                      </>
                    ) : (
                      <span className={`text-sm font-medium ${statusColor[m.status]}`}>
                        {statusLabel[m.status]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 送った申請 */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            送ったコラボ申請
            {sent.length > 0 && (
              <span className="ml-2 text-sm text-gray-400 font-normal">（{sent.length}件）</span>
            )}
          </h2>

          {sent.length === 0 ? (
            <p className="text-gray-500 text-sm">まだ申請を送っていません</p>
          ) : (
            <div className="space-y-3">
              {sent.map((m) => (
                <div key={m.id} className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                      ?
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${m.receiver_id}`}
                        className="text-white font-medium hover:underline truncate block"
                      >
                        {m.profile?.name || "名前未設定"}
                      </Link>
                      {m.profile?.genre && (
                        <span className="text-xs text-purple-300">{m.profile.genre}</span>
                      )}
                    </div>
                  </div>

                  <span className={`text-sm font-medium shrink-0 ${statusColor[m.status]}`}>
                    {statusLabel[m.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
