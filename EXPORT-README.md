# 吴义博视频作品集

## 本地预览

```bash
npm install
npm run dev
```

打开终端显示的本地地址，通常为 `http://localhost:5173/`。

## 生产构建

```bash
npm run build
npm run preview
```

`public/media/` 保存作品清单和封面，`public/previews/` 保存卡片短预览；完整视频通过远程视频流播放。`public/fonts/` 和 `public/profile/` 保存页面使用的字体及个人展示资源。生产构建会把静态资源复制到 `dist/`，该目录可以通过构建重新生成。

## B 站视频流

`functions/api/bilibili/[bvid].js` 会在播放时实时解析并代理已登记的 B 站原片。项目本地仅保存用于作品卡片自动播放的 7 秒静音预览，Vite 开发服务器使用相同的代理逻辑。

## Cloudflare Pages 飞书视频流

`functions/api/video/[id].js` 会使用飞书 OpenAPI 为弹窗播放器提供支持 HTTP Range 的完整视频流。

在 Cloudflare Pages 项目的 Settings → Variables and Secrets 中配置两个加密变量：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`

飞书不可用或未配置时，前端会自动回退到现有 R2 完整视频，再回退到 `/previews/` 短预览。

## 全站视频点赞

点赞接口使用 Cloudflare D1 提供全体访客共享的累计数。在 Cloudflare Dashboard 中创建 D1 数据库后，先执行 `migrations/0001_video_likes.sql`，再在 Pages 项目的 **Settings → Bindings** 添加 D1 绑定：

- 变量名：`VIDEO_LIKES_DB`
- 数据库：选择新建的点赞数据库

配置后重新部署 Pages 项目。同一浏览器的同一使客对每条视频只会计入一次点赞，且可取消。
