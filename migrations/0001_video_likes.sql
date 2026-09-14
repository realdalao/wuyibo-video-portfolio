CREATE TABLE IF NOT EXISTS video_likes (
  video_id TEXT PRIMARY KEY,
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0)
);

CREATE TABLE IF NOT EXISTS visitor_video_likes (
  video_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (video_id, visitor_id)
);
