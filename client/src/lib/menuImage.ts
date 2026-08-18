const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.78;

export async function prepareMenuImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("IMAGE_FORMAT_INVALID");
  if (file.size > 10 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");

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
