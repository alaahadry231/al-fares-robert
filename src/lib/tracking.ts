export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

export async function trackView(page: string) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "view",
        page,
        visitor_id: getVisitorId(),
      }),
      keepalive: true,
    });
  } catch {
    // فشل صامت
  }
}

export async function trackClick(
  item_type: "page" | "bot",
  item_id: number,
  item_name: string
) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "click",
        item_type,
        item_id,
        item_name,
        visitor_id: getVisitorId(),
      }),
      keepalive: true,
    });
  } catch {
    // فشل صامت
  }
}