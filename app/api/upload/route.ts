import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/verify-session";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * ファイルの先頭バイト（マジックバイト）を確認し、
 * Content-Typeの偽装がないかを検証する
 */
function isValidImageBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  switch (mimeType) {
    case "image/jpeg":
      // JPEG: FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      // PNG: 89 50 4E 47
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    case "image/webp":
      // WebP: RIFF????WEBP
      return (
        buffer[0] === 0x52 && // R
        buffer[1] === 0x49 && // I
        buffer[2] === 0x46 && // F
        buffer[3] === 0x46 && // F
        buffer.length >= 12 &&
        buffer[8] === 0x57 && // W
        buffer[9] === 0x45 && // E
        buffer[10] === 0x42 && // B
        buffer[11] === 0x50   // P
      );
    case "image/gif":
      // GIF: GIF87a または GIF89a
      return (
        buffer[0] === 0x47 && // G
        buffer[1] === 0x49 && // I
        buffer[2] === 0x46   // F
      );
    default:
      return false;
  }
}

// 許可するMIMEタイプ（Cloudinaryに送る前にサーバー側で検証）
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
// 最大ファイルサイズ: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const uid = await verifySession(req);
  if (!uid) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    // MIMEタイプ検証: 許可された画像形式のみ受け付ける
    // Content-Typeヘッダーはクライアントが偽装できるため、バイト列でも検証する
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "許可されていないファイル形式です。JPEG・PNG・WebP・GIFのみアップロードできます。" },
        { status: 415 }
      );
    }

    // ファイルサイズ検証: 5MB超はCloudinaryに送る前にブロック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください。" },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // マジックバイト検証: MIMEタイプの偽装を検出する
    // ファイルの先頭バイト列が宣言されたMIMEタイプと一致するか確認
    if (!isValidImageBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "ファイルの内容が画像ではありません。" },
        { status: 415 }
      );
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "vtuber-matching/avatars", resource_type: "image" },
          (error, result) => {
            if (error) {
              console.error("[Cloudinary] upload_stream error:", error);
              reject(error);
            } else if (!result) {
              console.error("[Cloudinary] upload_stream: result is undefined");
              reject(new Error("Upload result is undefined"));
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    console.error("[/api/upload] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
