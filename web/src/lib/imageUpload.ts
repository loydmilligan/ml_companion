import { supabase } from "./supabase";

type UploadResult = {
  publicUrl: string | null;
  error: string | null;
};

function parseBase64(input: string) {
  if (input.startsWith("data:")) {
    const [meta, data] = input.split(",");
    const mimeMatch = meta.match(/data:(.*?);base64/);
    return { mime: mimeMatch?.[1] ?? "image/png", data: data ?? "" };
  }
  return { mime: "image/png", data: input };
}

function base64ToBlob(base64: string, mime: string) {
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function uploadBase64Image(bucket: string, path: string, base64: string): Promise<UploadResult> {
  if (!base64) {
    return { publicUrl: null, error: "Missing base64 image data." };
  }

  const { mime, data } = parseBase64(base64);
  const blob = base64ToBlob(data, mime);

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: mime,
  });

  if (uploadError) {
    return { publicUrl: null, error: uploadError.message };
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: publicData.publicUrl, error: null };
}
