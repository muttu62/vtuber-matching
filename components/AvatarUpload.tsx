"use client";
import { useState, useRef } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const OUTPUT_SIZE = 400;

type Props = {
  currentUrl: string;
  onUploaded: (url: string) => void;
};

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas.toBlob が null を返しました"));
      },
      "image/jpeg",
      0.9
    );
  });
}

export default function AvatarUpload({ currentUrl, onUploaded }: Props) {
  const [preview, setPreview] = useState(currentUrl);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // input をリセット（同じファイルの再選択を可能にする）
    e.target.value = "";
    setError("");
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, w, h),
      w,
      h
    );
    setCrop(initialCrop);
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setUploading(true);
    setError("");
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("アップロードに失敗しました");
      const { url } = await res.json();
      setPreview(url);
      onUploaded(url);
      setImgSrc("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(null);
    setError("");
  };

  return (
    <>
      {/* クロップモーダル */}
      {imgSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-white font-bold text-lg mb-1">画像を切り抜く</h3>
            <p className="text-gray-400 text-sm mb-4">ドラッグで範囲を調整できます</p>

            <div className="flex justify-center mb-5 overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                minWidth={50}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="crop target"
                  onLoad={onImageLoad}
                  style={{
                    display: "block",
                    maxHeight: "60vh",
                    maxWidth: "min(440px, calc(100vw - 5rem))",
                  }}
                />
              </ReactCrop>
            </div>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={uploading || !completedCrop}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors"
              >
                {uploading ? "アップロード中..." : "この範囲で確定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* アバター表示 + 選択ボタン */}
      <div>
        <label className="block text-gray-300 text-sm mb-2">アバター画像</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 shrink-0">
            {preview ? (
              <img src={preview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-gray-400">
                ?
              </div>
            )}
          </div>
          <label className="cursor-pointer inline-block bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            画像を選択
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </>
  );
}
