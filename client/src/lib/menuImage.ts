const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.78;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function detectImageType(file: File): "image/jpeg" | "image/png" | "image/webp" | null {
  if (/^image\/(jpeg|jpg)$/.test(file.type)) return "image/jpeg";
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/webp") return "image/webp";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return null;
}

export function validateMenuImageFile(file: File): void {
  if (!detectImageType(file)) throw new Error("IMAGE_FORMAT_INVALID");
  if (file.size > MAX_FILE_SIZE) throw new Error("IMAGE_TOO_LARGE");
}

export async function prepareMenuImage(file: File): Promise<string> {
  validateMenuImageFile(file);

  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("IMAGE_READ_FAILED")); };
    image.src = url;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(source.naturalWidth || source.width, source.naturalHeight || source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((source.naturalWidth || source.width) * scale));
  canvas.height = Math.max(1, Math.round((source.naturalHeight || source.height) * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("IMAGE_PROCESSING_FAILED");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
