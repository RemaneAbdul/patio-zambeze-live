export function formatHistoryTime(createdAt: string | Date, lang: "pt" | "en") {
  return new Date(createdAt).toLocaleTimeString(lang === "pt" ? "pt-PT" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
