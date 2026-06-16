export const PASTELS = [
  { name: "lavender", bg: "bg-lavender", text: "text-lavender-ink", sticker: "💜" },
  { name: "peach", bg: "bg-peach", text: "text-peach-ink", sticker: "🍑" },
  { name: "mint", bg: "bg-mint", text: "text-mint-ink", sticker: "🌿" },
  { name: "butter", bg: "bg-butter", text: "text-butter-ink", sticker: "🧈" },
  { name: "rose", bg: "bg-rose", text: "text-rose-ink", sticker: "🌷" },
  { name: "sky", bg: "bg-sky", text: "text-sky-ink", sticker: "☁️" },
] as const;

export type PastelName = typeof PASTELS[number]["name"];

export function pastel(name?: string | null) {
  return PASTELS.find((p) => p.name === name) ?? PASTELS[0];
}
