const visitorCookieName = "portfolio_like_visitor";
const cookieLifetime = 60 * 60 * 24 * 365;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function getCookie(request, name) {
  const entry = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

function visitor(request) {
  const id = getCookie(request, visitorCookieName);
  return id || crypto.randomUUID();
}

function visitorCookie(id) {
  return `${visitorCookieName}=${encodeURIComponent(id)}; Max-Age=${cookieLifetime}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

function isValidVideoId(id) {
  return /^[a-z0-9-]{1,120}$/i.test(id);
}

function binding(context) {
  return context.env.VIDEO_LIKES_DB;
}

async function currentLikeState(database, videoId, visitorId) {
  const [countRow, voteRow] = await database.batch([
    database.prepare("SELECT likes FROM video_likes WHERE video_id = ?1").bind(videoId),
    database.prepare("SELECT 1 AS liked FROM visitor_video_likes WHERE video_id = ?1 AND visitor_id = ?2").bind(videoId, visitorId)
  ]);
  return { count: Number(countRow.results?.[0]?.likes || 0), liked: Boolean(voteRow.results?.[0]?.liked) };
}

export async function onRequestGet(context) {
  const videoId = context.params.id;
  if (!isValidVideoId(videoId)) return json({ error: "Invalid video id" }, { status: 400 });
  if (!binding(context)) return json({ error: "Likes database is not configured" }, { status: 503 });

  const visitorId = visitor(context.request);
  try {
    const state = await currentLikeState(binding(context), videoId, visitorId);
    return json(state, { headers: { "set-cookie": visitorCookie(visitorId) } });
  } catch (error) {
    console.error(JSON.stringify({ message: "likes read failed", videoId, error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "Unable to load likes" }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const videoId = context.params.id;
  if (!isValidVideoId(videoId)) return json({ error: "Invalid video id" }, { status: 400 });
  if (!binding(context)) return json({ error: "Likes database is not configured" }, { status: 503 });

  let action;
  try {
    ({ action } = await context.request.json());
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }
  if (action !== "like" && action !== "unlike") return json({ error: "Invalid like action" }, { status: 400 });

  const database = binding(context);
  const visitorId = visitor(context.request);
  const addVote = database.prepare("INSERT OR IGNORE INTO visitor_video_likes (video_id, visitor_id) VALUES (?1, ?2)").bind(videoId, visitorId);
  const removeVote = database.prepare("DELETE FROM visitor_video_likes WHERE video_id = ?1 AND visitor_id = ?2").bind(videoId, visitorId);
  const increment = database.prepare("INSERT INTO video_likes (video_id, likes) SELECT ?1, 1 WHERE changes() > 0 ON CONFLICT(video_id) DO UPDATE SET likes = likes + 1").bind(videoId);
  const decrement = database.prepare("UPDATE video_likes SET likes = MAX(likes - 1, 0) WHERE video_id = ?1 AND changes() > 0").bind(videoId);

  try {
    await database.batch(action === "like" ? [addVote, increment] : [removeVote, decrement]);
    const state = await currentLikeState(database, videoId, visitorId);
    return json(state, { headers: { "set-cookie": visitorCookie(visitorId) } });
  } catch (error) {
    console.error(JSON.stringify({ message: "likes update failed", videoId, action, error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "Unable to update likes" }, { status: 500 });
  }
}
