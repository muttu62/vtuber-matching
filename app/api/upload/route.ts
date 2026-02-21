import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/verify-session";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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
