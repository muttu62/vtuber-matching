import { NextRequest, NextResponse } from "next/server";

// Wikipedia URLキー → 日本語タグ
const TOPIC_MAP: Record<string, string> = {
  Music: "音楽",
  Christian_music: "音楽",
  Rhythm_and_blues: "音楽",
  Soul_music: "音楽",
  Hip_hop_music: "音楽",
  Dance_music: "音楽",
  Electronic_music: "音楽",
  Pop_music: "音楽",
  Gaming: "ゲーム",
  "Video_game_culture": "ゲーム",
  Entertainment: "エンタメ",
  Humor: "エンタメ",
  Film: "映像制作",
  Animation: "アニメーション",
  "Animated_film": "アニメーション",
  "Society": "トーク・雑談",
  "Lifestyle_(sociology)": "ライフスタイル",
  Technology: "テクノロジー",
  Cooking: "料理",
  Food: "料理",
  Education: "学習",
  Science: "学習",
  Sports: "スポーツ",
  Fashion: "ファッション",
  Travel: "旅行",
  Automotive: "自動車",
  Health: "健康",
  Beauty: "美容",
};

function extractTag(url: string): string | null {
  const match = url.match(/\/wiki\/(.+)$/);
  if (!match) return null;
  const key = decodeURIComponent(match[1]);
  return TOPIC_MAP[key] ?? null;
}

function parseUrl(url: string): { type: "handle" | "id" | "custom"; value: string } | null {
  const handleMatch = url.match(/youtube\.com\/@([^/?&]+)/);
  if (handleMatch) return { type: "handle", value: handleMatch[1] };

  const channelMatch = url.match(/youtube\.com\/channel\/([^/?&]+)/);
  if (channelMatch) return { type: "id", value: channelMatch[1] };

  const customMatch = url.match(/youtube\.com\/c\/([^/?&]+)/);
  if (customMatch) return { type: "custom", value: customMatch[1] };

  const userMatch = url.match(/youtube\.com\/user\/([^/?&]+)/);
  if (userMatch) return { type: "custom", value: userMatch[1] };

  return null;
}

// チャンネルIDを解決する共通関数
async function resolveChannelId(
  parsed: NonNullable<ReturnType<typeof parseUrl>>,
  base: string,
  apiKey: string
): Promise<string | null> {
  if (parsed.type === "handle") {
    const res = await fetch(
      `${base}/channels?part=id&forHandle=${encodeURIComponent(parsed.value)}&key=${apiKey}`
    );
    const data = await res.json();
    return data.items?.[0]?.id ?? null;
  } else if (parsed.type === "id") {
    return parsed.value;
  } else {
    const searchRes = await fetch(
      `${base}/search?part=snippet&type=channel&q=${encodeURIComponent(parsed.value)}&maxResults=1&key=${apiKey}`
    );
    const searchData = await searchRes.json();
    return searchData.items?.[0]?.id?.channelId ?? null;
  }
}

export async function POST(req: NextRequest) {
  console.log("[youtube] YOUTUBE_API_KEY exists:", !!process.env.YOUTUBE_API_KEY);
  console.log("[youtube] YOUTUBE_API_KEY length:", process.env.YOUTUBE_API_KEY?.length ?? 0);
  console.log("[youtube] NODE_ENV:", process.env.NODE_ENV);

  const { url, type = "tags" } = await req.json();
  if (!url) return NextResponse.json({ error: "URLを入力してください" }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const parsed = parseUrl(String(url).trim());
  if (!parsed) return NextResponse.json({ error: "YouTubeチャンネルURLが正しくありません" }, { status: 400 });

  const base = "https://www.googleapis.com/youtube/v3";

  // --- 最新動画取得モード ---
  if (type === "videos") {
    const channelId = await resolveChannelId(parsed, base, apiKey);
    if (!channelId) return NextResponse.json({ error: "チャンネルが見つかりませんでした" }, { status: 404 });

    const searchRes = await fetch(
      `${base}/search?part=snippet&channelId=${channelId}&order=date&maxResults=3&type=video&key=${apiKey}`
    );
    const searchData = await searchRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos = (searchData.items ?? []).map((item: any) => ({
      title: item.snippet.title as string,
      thumbnailUrl: (
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url
      ) as string,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}` as string,
    }));

    return NextResponse.json({ videos });
  }

  // --- タグ取得モード（デフォルト） ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let channelData: any;

  if (parsed.type === "handle") {
    const res = await fetch(
      `${base}/channels?part=snippet,topicDetails&forHandle=${encodeURIComponent(parsed.value)}&key=${apiKey}`
    );
    const data = await res.json();
    channelData = data.items?.[0];
  } else if (parsed.type === "id") {
    const res = await fetch(
      `${base}/channels?part=snippet,topicDetails&id=${encodeURIComponent(parsed.value)}&key=${apiKey}`
    );
    const data = await res.json();
    channelData = data.items?.[0];
  } else {
    // カスタムURLはsearch経由
    const searchRes = await fetch(
      `${base}/search?part=snippet&type=channel&q=${encodeURIComponent(parsed.value)}&maxResults=1&key=${apiKey}`
    );
    const searchData = await searchRes.json();
    const channelId: string | undefined = searchData.items?.[0]?.id?.channelId;
    if (!channelId) return NextResponse.json({ error: "チャンネルが見つかりませんでした" }, { status: 404 });

    const channelRes = await fetch(
      `${base}/channels?part=snippet,topicDetails&id=${channelId}&key=${apiKey}`
    );
    const channelJson = await channelRes.json();
    channelData = channelJson.items?.[0];
  }

  if (!channelData) {
    return NextResponse.json({ error: "チャンネルが見つかりませんでした" }, { status: 404 });
  }

  const topicCategories: string[] = channelData.topicDetails?.topicCategories ?? [];
  const tags = [...new Set(
    topicCategories.map(extractTag).filter((t): t is string => t !== null)
  )];
  const title: string = channelData.snippet?.title ?? "";

  return NextResponse.json({ tags, title });
}
