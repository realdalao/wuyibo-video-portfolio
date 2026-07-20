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

完整视频素材位于 `public/media/`。生产构建会把这些素材复制到 `dist/`，因此构建目录约为 3.5GB。

## Cloudflare Pages 飞书视频流

`functions/api/video/[id].js` 会使用飞书 OpenAPI 为弹窗播放器提供支持 HTTP Range 的完整视频流。

在 Cloudflare Pages 项目的 Settings → Variables and Secrets 中配置两个加密变量：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`

飞书不可用或未配置时，前端会自动回退到现有 R2 完整视频，再回退到 `/previews/` 短预览。
