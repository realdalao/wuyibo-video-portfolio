import { Readable } from "node:stream";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { BILIBILI_VIDEOS, resolveBilibiliStreamUrl } from "./functions/_lib/bilibili.js";

function bilibiliDevelopmentProxy() {
  return {
    name: "bilibili-development-proxy",
    configureServer(server) {
      server.middlewares.use("/api/bilibili", async (request, response) => {
        const bvid = decodeURIComponent((request.url || "").split("?")[0]).replace(/^\/+/, "");
        const cid = BILIBILI_VIDEOS[bvid];
        if (!cid) {
          response.statusCode = 404;
          response.end("Video source not configured");
          return;
        }

        try {
          const streamUrl = await resolveBilibiliStreamUrl(bvid, cid);
          const headers = {
            referer: `https://www.bilibili.com/video/${bvid}/`,
            "user-agent": "Mozilla/5.0"
          };
          if (request.headers.range) headers.range = request.headers.range;

          const upstream = await fetch(streamUrl, { method: request.method, headers });
          response.statusCode = upstream.status;
          for (const name of ["accept-ranges", "content-length", "content-range", "content-type", "etag", "last-modified"]) {
            const value = upstream.headers.get(name);
            if (value) response.setHeader(name, value);
          }
          response.setHeader("cache-control", "no-store");
          response.setHeader("x-content-type-options", "nosniff");

          if (request.method === "HEAD" || !upstream.body) {
            response.end();
            return;
          }
          Readable.fromWeb(upstream.body).pipe(response);
        } catch (error) {
          console.error("Bilibili development proxy failed", error);
          response.statusCode = 502;
          response.end("Bilibili video stream unavailable");
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), bilibiliDevelopmentProxy()]
});
