# EdgeOne Makers Git 自动部署

- Git 仓库：https://github.com/realdalao/wuyibo-video-portfolio
- 生产分支：`main`
- Makers 项目：`wuyibo-video-portfolio`（`makers-ws2jco4xhhqe`）
- 控制台：https://console.cloud.tencent.com/edgeone/makers/project/makers-ws2jco4xhhqe/setting

后续修改代码、提交并推送到 `main`，由 Makers 后台自动构建部署。构建配置由根目录 `edgeone.json` 管理：`npm ci` → `npm run build` → `dist`。Node 24.18.0 满足当前 Vite 8 的版本要求。

点赞接口已迁移到 Makers Cloud Functions + Blob（`portfolio-likes-v1`），每个视频和访客使用独立记录，强一致列举计算总数；同一访客重复点赞不增加计数，不同访客并发写入不覆盖共享总数。当前原 D1 快照只有一条 0 计数、无有效投票，已核对并完成初始化。

飞书与 B 站接口均在 Makers Edge Functions 直接执行。飞书凭证复用已验证可访问原视频的本地飞书 CLI 应用，并配置于 Makers 生产环境；密钥不写入仓库。视频文件位置和前端源地址均保持原样。

原 Cloudflare 网站继续使用独立 D1 库，迁移后两站新增点赞不再自动互相同步。

此前 CLI 上传的线上快照保留在 `work/edgeone-mirror/`，仅作历史备份，不再作为部署入口。新的 Git 构建发布仓库中的源码。

默认预览域名需要完整验证链接；长期正式分享应绑定自定义域名。

2026-10-26 已在控制台确认仓库关联成功，生产环境关联 `main`，自动部署已开启。原先的 `vibe-coding-agent` 项目保持原仓库关联。
