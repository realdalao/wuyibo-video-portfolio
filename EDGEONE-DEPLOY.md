# EdgeOne Makers Git 自动部署

- Git 仓库：https://github.com/realdalao/wuyibo-video-portfolio
- 生产分支：`main`
- Makers 项目：`wuyibo-video-portfolio`（`makers-ws2jco4xhhqe`）
- 控制台：https://console.cloud.tencent.com/edgeone/makers/project/makers-ws2jco4xhhqe/setting

后续修改代码、提交并推送到 `main`，由 Makers 后台自动构建部署。构建配置由根目录 `edgeone.json` 管理：`npm ci` → `npm run build` → `dist`。Node 22.22.0 满足当前 Vite 8 的版本要求。

EdgeOne 的 `edge-functions/api/[[path]].js` 将视频、B 站和点赞请求转发至原 Cloudflare 服务。Cloudflare 的 `functions/` 和 D1 数据库继续提供后端服务，不能下线。两站共享点赞累计数，访客 Cookie 按域名隔离。

此前 CLI 上传的线上快照保留在 `work/edgeone-mirror/`，仅作历史备份，不再作为部署入口。新的 Git 构建发布仓库中的源码。

默认预览域名需要完整验证链接；长期正式分享应绑定自定义域名。

2026-10-26 已在控制台确认仓库关联成功，生产环境关联 `main`，自动部署已开启。原先的 `vibe-coding-agent` 项目保持原仓库关联。
