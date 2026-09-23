import React, { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
} from "lucide-react";
import "./styles.css";
import "./gallery-grid.css";
import "./experience.css";
import "./footer.css";
import FoldText from "./FoldText";
import BlurText from "./BlurText";
import "./BlurText.css";
import TiltedCard from "./TiltedCard";
import AnimatedListItem from "./AnimatedListItem";
import PageLoader from "./components/ui/PageLoader";
import VideoAmbient from "./components/ui/VideoAmbient";
import DecryptedText from "./components/ui/DecryptedText";
import WebThreads from "./components/ui/WebThreads";
import DepthText from "./components/ui/DepthText";
import MetallicPaint from "./components/ui/MetallicPaint";
import HalftoneDotsBackground from "./components/ui/HalftoneDotsBackground";

// Start fetching the WebGL background with the main page instead of waiting
// for the first video modal to open. React.lazy still keeps it in a separate
// chunk, while reusing this already-settled promise when the player mounts.
const magicRingsModule = import("./components/ui/MagicRings");
const MagicRings = lazy(() => magicRingsModule);
const playerInfoBlurFrom = { filter: "blur(6px)", opacity: 0, y: 8 };
const playerInfoBlurTo = [
  { filter: "blur(3px)", opacity: 0.58, y: 3 },
  { filter: "blur(0px)", opacity: 1, y: 0 }
];

const portfolioSource = "https://fcnapthanwru.feishu.cn/wiki/VNwkwSqvriUfmrklQQNc2mNanJE?from=from_copylink";
const localLikeStorageKey = (videoId) => `portfolio_local_like:${videoId}`;
const heroAlphaSources = {
  webm: { src: "/profile/hero-fishbowl-alpha.webm?v=5", fallback: false },
  safari: { src: "/profile/hero-fishbowl.mp4?v=7", fallback: true }
};

function getHeroAlphaSource() {
  const userAgent = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafariDesktop = /safari/i.test(userAgent)
    && !/chrome|chromium|android|crios|fxios|edgios|opr/i.test(userAgent);

  // Safari and every iOS browser use the HEVC-with-Alpha delivery asset.
  return isAppleMobile || isSafariDesktop ? heroAlphaSources.safari : heroAlphaSources.webm;
}

function getLocalLikeState(videoId) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(localLikeStorageKey(videoId)) || "null");
    return {
      count: Math.max(0, Number(saved?.count) || 0),
      liked: Boolean(saved?.liked)
    };
  } catch {
    return { count: 0, liked: false };
  }
}

function saveLocalLikeState(videoId, state) {
  try {
    window.localStorage.setItem(localLikeStorageKey(videoId), JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private browsing; the in-memory UI still updates.
  }
}

const highlights = [
  { label: "ReelShort 短剧", href: "#reelshort", copy: "AIGC 短剧生产与交付" },
  { label: "AIGC 知识视频", href: "#newtestament", copy: "AI 全素材生成与视觉叙事" },
  { label: "纪录片学院奖片花", href: "#academy", copy: "纪录片片花剪辑" },
  { label: "新华社", href: "#xinhua", copy: "长纪录片与主题短视频" },
  { label: "央视频", href: "#yangshipin", copy: "风物短片策划与剪辑" },
  { label: "小米宣传片", href: "#xiaomi", copy: "产品传播内容剪辑" },
  { label: "课程作业与纪录片", href: "#student", copy: "校园创作与独立纪录片" }
];

const works = [
  {
    id: "ai",
    category: "ai",
    title: "ReelShort 短剧",
    role: "AIGC 视频制作",
    client: "ReelShort",
    description: "熟练运用 AI 文生图、图生视频、AI 配音等生成工具，完成短剧内容制作、审核、返修和迭代输出。",
    links: [{ label: "作品集来源", href: portfolioSource }]
  },
  {
    id: "newtestament",
    category: "newtestament",
    title: "AIGC 知识视频",
    role: "AI 全素材生成 · 视觉叙事 · 动态制作与剪辑",
    client: "新约百晓生",
    description: "根据甲方提供的配音旁白，独立完成视觉拆解、AI 素材生成、镜头设计、动态影像制作与后期剪辑，将文字叙述转化为完整、连贯的知识短视频。视频中的人物、场景与视觉素材均由 AI 生成。",
    links: [{ label: "作品集来源", href: portfolioSource }]
  },
  {
    id: "academy",
    category: "academy",
    title: "纪录片学院奖片花",
    role: "核心片花剪辑",
    client: "第十五届“光影纪年”中国纪录片学院奖",
    description: "为第十五届“光影纪年”中国纪录片学院奖独立完成多部获奖及提名作品的官方片花剪辑。",
    links: [{ label: "查看作品集", href: portfolioSource }]
  },
  {
    id: "guangxi",
    category: "guangxi",
    title: "央视频《甜美广西风物篇·坚果》",
    role: "编导 + 剪辑",
    client: "央视频",
    description: "独立完成单集短视频《再“难”也要吃的崇左坚果》的策划与后期制作，作品上线央视频平台并获得个人署名。",
    links: [{ label: "观看正片", href: "https://w.yangshipin.cn/video?type=0&vid=j000002zt8b" }]
  },
  {
    id: "xinhua",
    category: "palace",
    representativeId: "palace-02",
    title: "新华社、腾讯视频《我们的故宫》",
    role: "剪辑助理",
    client: "新华社 / 腾讯视频",
    description: "参与 8 集纪实访谈纪录片《我们的故宫》的后期策划与剪辑工作，项目为纪念故宫博物院建院 100 周年创作。",
    links: [{ label: "观看正片", href: "https://v.qq.com/x/cover/mzc00200c6lnllu/g41016ymsfa.html?url_from=share" }]
  },
  {
    id: "xiangxin",
    category: "xiangxin",
    title: "董宇辉、新华社《向新而行》",
    role: "剪辑助理",
    client: "新华社",
    description: "参与《向新而行》广西篇剪辑协作，从蔚蓝海岸到秀美峰林、蚝排、果园和蔗田，呈现鲜活广西。",
    links: [{ label: "微信正片", href: "https://mp.weixin.qq.com/s/l_p9cjSUXo53B8RRGYDw3g" }]
  },
  {
    id: "tibet",
    category: "tibet",
    title: "新华社《西藏一日》",
    role: "摄影助理",
    client: "新华社",
    description: "参与央媒现场摄制执行，完成纪实报道项目中的影像辅助与素材协作。",
    links: [
      { label: "微信视频号", href: "https://weixin.qq.com/sph/ApSCTXePXZ" },
      { label: "微信文章", href: "https://mp.weixin.qq.com/s/PylSk2109RYNDbXt8nSszA" }
    ]
  },
  {
    id: "xinhua-more",
    category: "xinhua",
    videoIds: ["xinhua-01"],
    title: "新华社《我的阅兵记忆》",
    role: "摄制助理",
    client: "新华社",
    description: "参与重大主题报道的影像制作与素材协作，记录集体记忆中的现场与人物。",
    links: [{ label: "作品集来源", href: portfolioSource }]
  },
  {
    id: "xinhua-animation",
    category: "xinhua",
    videoIds: ["xinhua-02"],
    title: "新华社《三国的星空》报道",
    role: "摄制助理",
    client: "新华社",
    description: "参与国产动画电影相关文化报道的影像制作与素材协作。",
    links: [{ label: "作品集来源", href: portfolioSource }]
  },
  {
    id: "yangsheng-xinhua",
    category: "student",
    videoIds: ["course-02"],
    title: "新华社《扬声》推介片",
    role: "剪辑",
    client: "新华社",
    description: "纪录片推介片剪辑作品。",
    links: [{ label: "作品集来源", href: portfolioSource }]
  },
  {
    id: "commercial",
    category: "commercial",
    representativeId: "xiaomi-06",
    title: "小米宣传片",
    role: "剪辑",
    client: "小米官微",
    description: "参与小米 11 系列传播内容剪辑，包括心率监测、超级夜景视频、屏幕抗摔测试与新品发布会系列。",
    links: [
      { label: "心率监测", href: "https://weibo.com/2202387347/JFQR8o0u1" },
      { label: "超级夜景", href: "https://weibo.com/2202387347/JFpaysrtI" }
    ]
  },
  {
    id: "student",
    category: "student",
    videoIds: ["course-01", "course-05", "course-04", "course-03"],
    title: "课程作业与纪录片",
    role: "编导 / 拍摄 / 剪辑",
    client: "中国传媒大学",
    description: "包括反家暴公益广告《残妆》、自制谈话综艺《平行线-爱人再见》、纪录片《郝姐 上京赶集》等。",
    links: [{ label: "查看合集", href: portfolioSource }]
  }
];

const commercialVideoOrder = ["xiaomi-05", "xiaomi-06", "xiaomi-07", "xiaomi-01", "xiaomi-02", "xiaomi-03", "xiaomi-04"];

function getWorkVideosForDisplay(manifest, id, durationRule) {
  const work = works.find((item) => item.id === id);
  if (!work) return [];
  let videos = manifest[work.category] || [];
  if (work.videoIds) videos = work.videoIds.map((videoId) => videos.find((video) => video.id === videoId)).filter(Boolean);
  if (work.id === "commercial") videos = commercialVideoOrder.map((videoId) => videos.find((video) => video.id === videoId)).filter(Boolean);
  if (durationRule === "long") videos = videos.filter((video) => video.duration > 20 * 60);
  if (durationRule === "short") videos = videos.filter((video) => video.duration <= 20 * 60);
  return videos.map((video) => ({
    ...video,
    metaDescription: work.role,
    projectDescription: work.description,
    collectionTitle: work.title
  }));
}

function galleryDisplayOrder(videos) {
  return [
    ...videos.filter((video) => video.orientation !== "portrait"),
    ...videos.filter((video) => video.orientation === "portrait")
  ];
}

function buildPortfolioVideoQueue(manifest) {
  const knowledgeVideos = getWorkVideosForDisplay(manifest, "newtestament");
  const aiVideos = getWorkVideosForDisplay(manifest, "ai");
  const pageSections = [
    galleryDisplayOrder(["xinhua", "tibet", "xiangxin"].flatMap((id) => getWorkVideosForDisplay(manifest, id, "long"))),
    galleryDisplayOrder(["yangsheng-xinhua", "xinhua-more", "xinhua-animation", "xinhua", "xiangxin", "tibet"].flatMap((id) => getWorkVideosForDisplay(manifest, id, "short"))),
    galleryDisplayOrder(getWorkVideosForDisplay(manifest, "academy")),
    aiVideos.filter((video) => video.orientation !== "portrait"),
    galleryDisplayOrder(knowledgeVideos.filter((video) => video.id !== "yiyan-nanjing")),
    knowledgeVideos.filter((video) => video.id === "yiyan-nanjing"),
    aiVideos.filter((video) => video.orientation === "portrait"),
    galleryDisplayOrder(getWorkVideosForDisplay(manifest, "guangxi")),
    galleryDisplayOrder(getWorkVideosForDisplay(manifest, "commercial")),
    galleryDisplayOrder(getWorkVideosForDisplay(manifest, "student"))
  ];
  const seen = new Set();
  return pageSections.flat().filter((video) => {
    if (seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

const experiences = [
  { time: "2026.04 - 2026.06", title: "ReelShort", role: "AI 短剧实习生", body: "使用 AIGC 工具完成短剧生产、审核、返修和交付，把生成能力落到稳定的视频流程中。" },
  { time: "2025.07 - 2025.10", title: "新华社", role: "编导 / 剪辑实习生", body: "参与《我们的故宫》《向新而行》《西藏一日》等重磅视频项目，并承担高规格报道任务的拍摄执行。" },
  { time: "2025.04 - 2025.06", title: "西门子（中国）有限公司", role: "运营实习生", body: "参与活动视频拍摄和后期剪辑，独立完成素材整理、成片输出与多轮修改。" },
  { time: "2021.06 - 2023.06", title: "北京冠华信达科技股份有限公司", role: "广电系统工程师", body: "负责广电演播室系统设计、招投标、设备采购与项目执行，累计执行中标项目总金额超过 1 亿元。" }
];

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

const displayTitleById = {
  "white-horse-wedding": "白马婚礼",
  "ai-manga-01": "灯神救人",
  "ai-manga-02": "狼人女主",
  "ai-manga-03": "阿拉丁许愿",
  "ai-manga-04": "流落街头的父亲",
  "ai-manga-05": "女歌手假唱",
  "ai-manga-06": "日漫女孩",
  "ai-manga-07": "亚洲男孩武打片",
  "ai-manga-08": "忠诚四男",
  "newtestament-01": "为什么罗马皇帝都叫“凯撒”？",
  "newtestament-02": "十字架的由来",
  "newtestament-03": "凯撒的归凯撒，上帝的归上帝",
  "newtestament-04": "666 到底是什么？",
  "newtestament-05": "耶稣讲过的“富二代”有多败家？",
  "yiyan-nanjing": "一言难靖预告片",
  "documentary-trailers-01": "《窗外是蓝星》",
  "documentary-trailers-02": "《方舟·布氏鲸》",
  "documentary-trailers-03": "《河湟三章·河》",
  "documentary-trailers-04": "《凌云壮志》",
  "documentary-trailers-05": "《绿色星球 2：城市天际线》",
  "documentary-trailers-06": "《如何与莉迪亚交谈？》",
  "documentary-trailers-07": "《正义的审判》",
  "guangxi-01": "甜美广西风物篇·坚果",
  "palace-01": "《我们的故宫》第二集预告",
  "palace-02": "《我们的故宫》第一集",
  "palace-03": "故宫藻井“活”了？",
  "palace-04": "故宫数字文物是这样制作的",
  "palace-05": "在故宫修了50多年文物",
  "xiangxin-01": "《向新而行》广西篇·上集",
  "xiangxin-02": "《向新而行》广西篇·下集",
  "xiangxin-03": "董宇辉广西出海被蚝排震惊！",
  "xiangxin-04": "董宇辉在广西实现百香果自由？",
  "xiangxin-05": "后厨小董上线：榴莲炖鸡",
  "tibet-01": "《西藏一日》",
  "xinhua-01": "九三阅兵记者张扬后采",
  "xinhua-02": "易中天《三国的星空》采访",
  "xiaomi-01": "雷总带你划重点：安卓机皇和安卓之光",
  "xiaomi-02": "雷总带你划重点：小米 11 Ultra 巅峰影像",
  "xiaomi-03": "雷总带你划重点：小米 11 Pro 影像巅峰",
  "xiaomi-04": "三分钟回顾小米春季新品发布会",
  "xiaomi-05": "小米 11 求真大挑战：超级视频夜景篇",
  "xiaomi-06": "小米 11 求真大挑战：屏幕抗摔测试篇",
  "xiaomi-07": "小米 11 求真大挑战：心率测试篇",
  "course-01": "反家暴公益广告《残妆》",
  "course-02": "纪录片《扬声》推介片",
  "course-03": "纪录片研究课程作业《先开枪再瞄准》",
  "course-04": "中国口述历史国际周入围作品《郝姐 上京赶集》",
  "course-05": "自制谈话综艺《平行线：爱人再见》"
};

const videoDetailsById = {
  "white-horse-wedding": {
    description: "白马婚礼预告片。"
  },
  "newtestament-01": {
    description: "从罗马皇帝的称谓出发，回到彼拉多与耶稣受难的历史语境。"
  },
  "newtestament-02": {
    description: "追溯十字架如何从处刑刑具，成为基督教最具辨识度的象征。"
  },
  "newtestament-03": {
    description: "重新理解“凯撒的归凯撒，上帝的归上帝”所处的时代与文本脉络。"
  },
  "newtestament-04": {
    description: "666，是《启示录》中最神秘、也最令人害怕的一个数字。\n\n有人说，它代表撒但；有人说，它预示世界末日；也有人把它与各种都市传说和阴谋论联系在一起。但很多人不知道，在两千年前，《启示录》的第一批读者，看到666时，想到的或许根本不是恶魔，而是一位真实存在的罗马皇帝——尼禄。\n\n本集带你回到罗马帝国最黑暗的年代，从约翰被流放拔摩岛、《启示录》的异象，到尼禄迫害基督徒，以及希伯来字母数字（Gematria）的文化背景，一起重新认识666真正可能代表的意思。",
    links: [{ label: "B站观看", href: "https://www.bilibili.com/video/BV1sdt46oEkS/" }]
  },
  "newtestament-05": {
    description: "“浪子回头金不换”，是中国人耳熟能详的一句话。\n\n但早在两千年前，耶稣就讲过一个关于“浪子”的故事：一个富家少爷，在父亲还活着的时候就要求分家产，带着巨额财富远走他乡，最后却把一切挥霍殆尽，甚至沦落到替人放猪。\n\n\n如果把这个故事当成一则两千年前的“财经新闻”，这位浪子究竟拿走了多少家产？他的家庭到底有多富有？而当他一无所有地回家时，等待他的又是什么？\n\n本集《新约百晓生》，从古代犹太人的继承制度、土地与家族财产出发，重新读一次耶稣最著名的比喻之一——浪子的比喻。\n\n《新约百晓生》是一档历史文化节目，每一集解答一个问题，从历史、文化、语言与考古等角度出发，带你走进《新约》背后的真实世界。",
    links: [{ label: "B站观看", href: "https://www.bilibili.com/video/BV1noYH6JE2g/" }]
  },
  "yiyan-nanjing": {
    description: "一言难靖预告片。"
  },
  "documentary-trailers-01": { award: "评委会大奖 & 最佳音乐音响奖" },
  "documentary-trailers-02": { award: "最佳短纪录片奖提名" },
  "documentary-trailers-03": { award: "最佳短纪录片奖" },
  "documentary-trailers-04": { award: "最佳历史文献奖提名" },
  "documentary-trailers-05": { award: "最佳创新纪录片奖" },
  "documentary-trailers-06": { award: "最佳长纪录片奖" },
  "documentary-trailers-07": { award: "最佳文献纪录片奖" },
  "guangxi-01": {
    description: "独立完成单集短视频《再“难”也要吃的崇左坚果》的策划与后期制作，作品上线央视频平台并获得个人署名。",
    links: [{ label: "央视频观看", href: "https://w.yangshipin.cn/video?type=0&vid=j000002zt8b" }]
  },
  "palace-01": {
    description: "《我们的故宫》第二集预告。",
    links: [{ label: "腾讯视频正片", href: "https://v.qq.com/x/cover/mzc00200c6lnllu/g41016ymsfa.html?url_from=share" }]
  },
  "palace-02": {
    description: "《我们的故宫》（Our Palace Museum）由新华社、腾讯视频联合出品，共 8 集。项目为纪念故宫博物院建院 100 周年创作。",
    links: [{ label: "腾讯视频正片", href: "https://v.qq.com/x/cover/mzc00200c6lnllu/g41016ymsfa.html?url_from=share" }]
  },
  "palace-03": { description: "故宫藻井“活”了？你可以永远相信老祖宗的审美！" },
  "palace-04": { description: "你看到的故宫数字文物是这样制作的？" },
  "palace-05": { description: "在故宫修了 50 多年文物，他见证哪些变化？" },
  "xiangxin-01": {
    description: "新华社与董宇辉合作共创的《向新而行》广西篇，从蔚蓝海岸出发到秀美峰林、上蚝排、进果园、下蔗田，带全国观众看更鲜活、更有滋味的广西。",
    links: [{ label: "抖音观看上集", href: "https://v.douyin.com/2-x40slEV3Y/" }]
  },
  "xiangxin-02": {
    description: "新华社与董宇辉合作共创的《向新而行》广西篇，从蔚蓝海岸出发到秀美峰林、上蚝排、进果园、下蔗田，带全国观众看更鲜活、更有滋味的广西。",
    links: [{ label: "抖音观看下集", href: "https://v.douyin.com/hLdSs5n9zlM/" }]
  },
  "xiangxin-03": { description: "董宇辉广西出海被蚝排震惊！" },
  "xiangxin-04": { description: "董宇辉在广西实现百香果自由？" },
  "xiangxin-05": { description: "后厨小董上线！榴莲炖鸡你吃过吗？" },
  "tibet-01": {
    description: "新华社纪实报道项目，参与现场摄制执行与影像素材协作。",
    links: [
      { label: "微信视频号", href: "https://weixin.qq.com/sph/ApSCTXePXZ" },
      { label: "微信文章", href: "https://mp.weixin.qq.com/s/PylSk2109RYNDbXt8nSszA" }
    ]
  },
  "xinhua-01": { description: "九三阅兵结束后，新华社记者张扬回望震撼人心的受阅方队与动容面孔。通过这场集体的盛典和仪式，纪念 80 年前的胜利，传承不能忘却的记忆。" },
  "xinhua-02": { description: "著名文化学者、作家易中天担任编剧并监制的国产动画电影《三国的星空第一部》于 10 月 1 日上映。新华社记者陶治对话易中天，聊聊他与“三国”的故事。" },
  "xiaomi-05": { description: "铛铛铛铛，你们要的求真大挑战之超级夜景视频来了！北京冬夜再冷，小米 11 的夜景视频功能也不惧黑夜。" },
  "xiaomi-06": { description: "在颠倒的世界里摔手机？求真大挑战第一期屏幕抗摔测试篇来了，一起看看小米 11 翻了几次跟头。" },
  "xiaomi-07": { description: "期待已久的冰天雪地极速赛道心率监测来了，带你体验从初级到高级雪道的心跳加速。" }
};

const captionlessGalleryVideoIds = new Set(["white-horse-wedding", "palace-01", "palace-03", "palace-04", "palace-05"]);
const playerSummaryHiddenIds = new Set(["white-horse-wedding", "yiyan-nanjing", "course-02"]);

function hidesPlayerSummary(videoId) {
  return playerSummaryHiddenIds.has(videoId) || videoId.startsWith("ai-manga-");
}

function hidesPlayerTitle(videoId) {
  return videoId === "white-horse-wedding" || videoId.startsWith("ai-manga-");
}

function getVideoDetails(video) {
  return videoDetailsById[video.id] || {};
}

function getDisplayTitle(video) {
  return displayTitleById[video.id] || video.title;
}

function formatVideoDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "时长待定";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return minutes ? `${minutes}:${String(remainder).padStart(2, "0")}` : `0:${String(remainder).padStart(2, "0")}`;
}

// Start only nearby previews in a short queue so scrolling never triggers
// dozens of video decoders in a single frame.
const previewPlayQueue = new Set();
let previewPlayTimer = null;

function PlayerGlyph({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.35,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };

  if (name === "play") return <svg {...common}><path d="M7.5 5.4c0-1.2 1.32-1.92 2.32-1.25l8.7 5.85a1.5 1.5 0 0 1 0 2.5l-8.7 5.85A1.5 1.5 0 0 1 7.5 17.1Z" fill="currentColor" stroke="none" /></svg>;
  if (name === "pause") return <svg {...common}><rect x="6.2" y="4.3" width="4.1" height="15.4" rx="1.55" fill="currentColor" stroke="none" /><rect x="13.7" y="4.3" width="4.1" height="15.4" rx="1.55" fill="currentColor" stroke="none" /></svg>;
  if (name === "forward") return <svg {...common}><path d="M4.3 6.6c0-1.12 1.25-1.8 2.2-1.18l7.24 4.72a1.41 1.41 0 0 1 0 2.36L6.5 17.22a1.41 1.41 0 0 1-2.2-1.18Z" fill="currentColor" stroke="none" /><path d="M11.2 6.6c0-1.12 1.25-1.8 2.2-1.18l6.1 3.98a2.28 2.28 0 0 1 0 3.84l-6.1 3.98a1.41 1.41 0 0 1-2.2-1.18Z" fill="currentColor" stroke="none" /></svg>;
  if (name === "rewind") return <svg {...common}><path d="M19.7 6.6c0-1.12-1.25-1.8-2.2-1.18l-7.24 4.72a1.41 1.41 0 0 0 0 2.36l7.24 4.72a1.41 1.41 0 0 0 2.2-1.18Z" fill="currentColor" stroke="none" /><path d="M12.8 6.6c0-1.12-1.25-1.8-2.2-1.18L4.5 9.4a2.28 2.28 0 0 0 0 3.84l6.1 3.98a1.41 1.41 0 0 0 2.2-1.18Z" fill="currentColor" stroke="none" /></svg>;
  if (name === "volume") return <svg {...common}><path d="M4.2 9.2v5.6h3.3l4.1 3.55V5.65L7.5 9.2Z" /><path d="M15.1 8.4a5.15 5.15 0 0 1 0 7.2" /><path d="M18 5.7a8.9 8.9 0 0 1 0 12.6" /></svg>;
  if (name === "muted") return <svg {...common}><path d="M3.8 9.2v5.6h3.1l4 3.55V5.65l-4 3.55Z" /><path d="m15 9 5 5m0-5-5 5" /></svg>;
  if (name === "fullscreen") return <svg {...common}><path d="M8.6 4.5H5.9a1.4 1.4 0 0 0-1.4 1.4v2.7M15.4 4.5h2.7a1.4 1.4 0 0 1 1.4 1.4v2.7M19.5 15.4v2.7a1.4 1.4 0 0 1-1.4 1.4h-2.7M8.6 19.5H5.9a1.4 1.4 0 0 1-1.4-1.4v-2.7" /></svg>;
  if (name === "more") return <svg {...common}><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>;
  if (name === "close") return <svg {...common}><path d="m6.5 6.5 11 11m0-11-11 11" /></svg>;
  if (name === "external") return <svg {...common}><rect x="4.5" y="7.2" width="12.3" height="12.3" rx="3" /><path d="M12.2 4.5h7.3v7.3m0-7.3-8.7 8.7" /></svg>;
  return null;
}

function schedulePreviewPlayback(video) {
  previewPlayQueue.add(video);
  if (previewPlayTimer !== null) return;

  const playNextBatch = () => {
    previewPlayTimer = null;
    let started = 0;

    for (const queuedVideo of previewPlayQueue) {
      previewPlayQueue.delete(queuedVideo);
      if (queuedVideo.isConnected && queuedVideo.paused) {
        queuedVideo.play().catch(() => {});
        started += 1;
      }
      if (started === 3) break;
    }

    if (previewPlayQueue.size > 0) {
      previewPlayTimer = window.setTimeout(playNextBatch, 48);
    }
  };

  previewPlayTimer = window.requestAnimationFrame(playNextBatch);
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="返回顶部">吴义博作品集</a>
      <div className="header-actions">
        <a className="soft-button" href="mailto:wu.yibo@foxmail.com">Email</a>
        <a className="dark-button" href="#works">View Works</a>
      </div>
    </header>
  );
}

function CrossfadeHeroVideo() {
  const videoRefs = useRef([]);
  const activeIndex = useRef(0);
  const transitioning = useRef(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [crossfade, setCrossfade] = useState(null);
  const heroSource = getHeroAlphaSource();

  const beginCrossfade = useCallback((index) => {
    if (index !== activeIndex.current || transitioning.current) return;
    const current = videoRefs.current[index];
    // Start preparing slightly early, then only fade once a decoded frame is on screen.
    if (!current?.duration || current.duration - current.currentTime > 1.25) return;

    const nextIndex = index === 0 ? 1 : 0;
    const next = videoRefs.current[nextIndex];
    if (!next) return;
    transitioning.current = true;
    next.currentTime = 0;
    const revealNextFrame = () => {
      // Keep both decoded clips on screen during the hand-off. A single
      // visible index can briefly expose the layer below between opacity swaps.
      setCrossfade({ from: index, to: nextIndex });
      window.setTimeout(() => {
        activeIndex.current = nextIndex;
        setVisibleIndex(nextIndex);
        setCrossfade(null);
        current.pause();
        current.currentTime = 0;
        transitioning.current = false;
      }, 1000);
    };

    next.play()
      .then(() => {
        if (typeof next.requestVideoFrameCallback === "function") {
          next.requestVideoFrameCallback(revealNextFrame);
        } else {
          window.requestAnimationFrame(() => window.requestAnimationFrame(revealNextFrame));
        }
      })
      .catch(() => { transitioning.current = false; });
  }, []);

  return (
    <div className="hero-video-crossfade" aria-label="玻璃鱼缸与人像的动态艺术视觉">
      {heroSource.fallback && (
        <img
          className="hero-fallback-poster"
          src="/profile/hero-fishbowl-poster.png?v=6"
          alt=""
          aria-hidden="true"
        />
      )}
      {[0, 1].map((index) => (
        <video
          key={index}
          ref={(node) => { videoRefs.current[index] = node; }}
          className={`hero-background-video ${heroSource.fallback ? "hero-background-video--safari-fallback" : ""} ${visibleIndex === index && crossfade?.from !== index ? "is-visible" : ""} ${crossfade?.from === index ? "is-fading-out" : ""} ${crossfade?.to === index ? "is-fading-in" : ""}`}
          src={heroSource.src}
          autoPlay={index === 0}
          muted
          playsInline
          loop={false}
          preload="auto"
          onTimeUpdate={() => beginCrossfade(index)}
        />
      ))}
    </div>
  );
}

function Hero() {
  return (
    <div className="hero-thread-stage">
      <WebThreads
        className="hero-web-threads"
        color1="#a855f7"
        mouseInteraction={false}
        pinchPosition={0.36}
        position={0.58}
        glow={0.02}
        falloff={0.6}
        thickness={0.2}
        grain={false}
      />
      <section className="editor-hero" id="top">
        <CrossfadeHeroVideo />
        <div className="hero-intro hero-intro--depth">
          <h1 className="hero-depth-title"><DepthText className="hero-depth-text" text={"吴义博\n视频作品集"} /></h1>
        </div>
        <div className="portrait-frame">
          <img src="/profile/hero-subway.jpg" alt="吴义博在地铁站台的肖像" decoding="async" />
        </div>
      </section>
    </div>
  );
}

function HeroDivider() {
  const ribbonText = "VIDEO CREATOR · AIGC · DIRECTING · EDITING ✦ ";
  return (
    <div className="hero-text-loop" aria-label="VIDEO CREATOR · AIGC · DIRECTING · EDITING">
      <div className="hero-ribbon-track" aria-hidden="true">
        <span>{ribbonText.repeat(4)}</span>
        <span>{ribbonText.repeat(4)}</span>
      </div>
    </div>
  );
}

function Stats() {
  return (
    <section className="stats-section">
      <div className="stats-lead"><h2>视频不只是画面的流动，更是思想与 AI 碰撞的艺术。</h2></div>
      <p className="stats-note">从真实世界的现场，到生成式影像的实验，我关心内容如何被看见，也关心它如何被更高效地生产。</p>
      <div className="stats-grid"><div><strong>43</strong><span>本站视频作品</span></div><div><strong>5</strong><span>核心创作方向</span></div><div><strong>1000W+</strong><span>全网播放量</span></div></div>
    </section>
  );
}

const AutoplayPreview = memo(function AutoplayPreview({ video }) {
  if (video.previewGif) {
    return <img src={video.previewGif} alt="" aria-hidden="true" />;
  }

  const videoRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewSrc = previewFailed
    ? (video.remoteStream ? undefined : video.src)
    : `/previews/${video.id}.mp4`;

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: "320px 0px" }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;

    // Mobile browsers already have a constrained decode budget. Keep the
    // poster-first gallery treatment there and reserve playback for the video
    // the visitor explicitly opens.
    if (window.matchMedia("(max-width: 720px)").matches) {
      previewPlayQueue.delete(element);
      element.pause();
      return undefined;
    }

    if (!isNearViewport) {
      previewPlayQueue.delete(element);
      element.pause();
      return undefined;
    }

    const keepPlaying = () => schedulePreviewPlayback(element);
    keepPlaying();
    element.addEventListener("canplay", keepPlaying);
    element.addEventListener("pause", keepPlaying);

    return () => {
      previewPlayQueue.delete(element);
      element.removeEventListener("canplay", keepPlaying);
      element.removeEventListener("pause", keepPlaying);
    };
  }, [isNearViewport, previewSrc]);

  return (
    <video
      ref={videoRef}
      src={isNearViewport ? previewSrc : undefined}
      poster={video.poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onError={() => setPreviewFailed(true)}
    />
  );
});

function VideoGallery({ title, videos, description, onOpen, hideCaptions = false }) {
  if (!videos.length) return <div className="gallery-empty">视频封面正在准备中</div>;

  const landscapeVideos = [];
  const portraitVideos = [];
  videos.forEach((video, index) => {
    const item = { video, index };
    (video.orientation === "portrait" ? portraitVideos : landscapeVideos).push(item);
  });

  const renderVideos = (items) => (
    <div className="video-gallery">
      {items.map(({ video, index }, itemIndex) => {
        const mediaRatio = video.orientation === "portrait"
          ? (video.width && video.height ? `${video.width} / ${video.height}` : "9 / 16")
          : "16 / 9";
        const mediaRatioValue = video.orientation === "portrait" && video.width && video.height
          ? video.width / video.height
          : video.orientation === "portrait" ? 9 / 16 : 16 / 9;

        return (
        <AnimatedListItem key={video.id} index={index} delay={Math.min(itemIndex * 0.055, 0.22)} style={{
          "--card-ratio": mediaRatio,
          "--card-ratio-value": mediaRatioValue,
        }}>
        <TiltedCard rotateAmplitude={12} scaleOnHover={1.03}>
        <figure className={`video-card video-card--${video.id} ${video.orientation} ${hideCaptions || captionlessGalleryVideoIds.has(video.id) ? "video-card--untitled" : "video-card--titled"}`}>
            <button
              className="video-tile"
              type="button"
              onClick={() => onOpen(index)}
              aria-label={`播放${getDisplayTitle(video)}`}
              style={{ aspectRatio: mediaRatio }}
            >
              <AutoplayPreview video={video} />
              <span className="tile-shade" aria-hidden="true" />
            </button>
          {!hideCaptions && !captionlessGalleryVideoIds.has(video.id) && (
            <figcaption className="video-caption">
              <strong>
                {video.id === "course-04" ? (
                  <>
                    <span>中国口述历史国际周入围作品</span><span className="course-04-title-phrase">《郝姐 上京赶集》</span>
                  </>
                ) : (
                  <BlurText as="span" text={getDisplayTitle(video)} delay={150} animateBy="words" direction="top" />
                )}
              </strong>
            </figcaption>
          )}
        </figure>
        </TiltedCard>
        </AnimatedListItem>
        );
      })}
    </div>
  );

  return (
    <div className="video-groups" aria-label={`${title}视频列表`}>
      {landscapeVideos.length > 0 && <div className="video-group landscape-group">{renderVideos(landscapeVideos)}</div>}
      {portraitVideos.length > 0 && <div className="video-group portrait-group">{renderVideos(portraitVideos)}</div>}
    </div>
  );
}

function LabeledGalleryRow({ className = "", title, videos, allVideos, collectionTitle, onOpen }) {
  const indexById = new Map(allVideos.map((video, index) => [video.id, index]));
  const titleSplitMode = className.includes("labeled-gallery-row--reelshort") ? "word" : "char";

  return (
    <section className={`labeled-gallery-row ${className}`} aria-label={title}>
      <header className="labeled-gallery-heading"><h3><FoldText text={title} splitBy={titleSplitMode} trigger="scroll" fontSize="inherit" fontWeight="inherit" color="currentColor" /></h3></header>
      <div className="labeled-gallery-media">
        <VideoGallery
          title={title}
          videos={videos}
          hideCaptions={className.includes("labeled-gallery-row--reelshort")}
          onOpen={(localIndex) => onOpen(allVideos, indexById.get(videos[localIndex].id), collectionTitle)}
        />
      </div>
    </section>
  );
}

function WorkSection({ work, videos, onOpen }) {
  return (
    <article className={`grid-work grid-work--${work.id}`} data-work-id={work.id}>
      <div className="grid-work-gallery">
        <VideoGallery title={work.title} videos={videos} description={`${work.client} / ${work.role}`} onOpen={(videoIndex) => onOpen(videos, videoIndex, work.title)} />
      </div>
    </article>
  );
}

const Works = memo(function Works({ manifest, onOpen }) {
  const categories = [
    { id: "xinhua", title: "新华社", kicker: "01 / 纪实与主题影像", subgroups: [
      { title: "长纪录片", durationRule: "long", ids: ["xinhua", "tibet", "xiangxin"] },
      { title: "短视频", durationRule: "short", ids: ["yangsheng-xinhua", "xinhua-more", "xinhua-animation", "xinhua", "xiangxin", "tibet"] }
    ] },
    {
      id: "academy",
      title: "纪录片学院奖片花",
      heading: "第十五届“光影纪年”中国纪录片学院奖片花",
      kicker: "02 / 纪录片片花",
      ids: ["academy"]
    },
    { id: "aigc", title: "AIGC视频", kicker: "03 / AIGC 视频制作", ids: ["ai"] },
    {
      id: "newtestament",
      title: "AIGC 知识视频",
      kicker: "04 / AI 全素材生成与视觉叙事",
      ids: ["newtestament"]
    },
    { id: "reelshort", title: "ReelShort 短剧", kicker: "05 / AIGC 短剧制作", ids: ["ai"] },
    { id: "yangshipin", title: "央视频", kicker: "06 / 风物与品牌影像", ids: ["guangxi"] },
    { id: "xiaomi", title: "小米宣传片", kicker: "07 / 产品传播内容", ids: ["commercial"] },
    { id: "student", title: "课程作业与纪录片", kicker: "08 / 校园创作与独立纪录片", ids: ["student"] }
  ];

  const getWorkVideos = (id, durationRule) => getWorkVideosForDisplay(manifest, id, durationRule);

  const renderGallery = (ids, durationRule, title) => {
    const videos = ids.flatMap((id) => getWorkVideos(id, durationRule));
    if (!videos.length) return null;
    return <VideoGallery title={title} videos={videos} onOpen={(videoIndex) => onOpen(videos, videoIndex, title)} />;
  };

  const renderAigcRow = () => {
    const videos = getWorkVideos("ai");
    return (
      <LabeledGalleryRow
        className="labeled-gallery-row--aigc"
        title="AIGC视频"
        videos={videos.filter((video) => video.orientation !== "portrait")}
        allVideos={videos}
        collectionTitle="AIGC视频"
        onOpen={onOpen}
      />
    );
  };

  const renderReelshortRow = () => {
    const videos = getWorkVideos("ai");
    return (
      <LabeledGalleryRow
        className="labeled-gallery-row--reelshort"
        title="ReelShort 短剧"
        videos={videos.filter((video) => video.orientation === "portrait")}
        allVideos={videos}
        collectionTitle="ReelShort 短剧"
        onOpen={onOpen}
      />
    );
  };

  const renderKnowledgeRows = (category) => {
    const videos = getWorkVideos("newtestament");
    const oralVideo = videos.filter((video) => video.id === "yiyan-nanjing");
    const knowledgeVideos = videos.filter((video) => video.id !== "yiyan-nanjing");
    return (
      <>
        <section className="knowledge-video-row">
          <header className="category-heading">
            <h3><FoldText text={category.heading || category.title} trigger="scroll" fontSize="inherit" fontWeight="inherit" color="currentColor" /></h3>
            {category.description && <p>{category.description}</p>}
          </header>
          <div className="category-content">
          <div className="knowledge-gallery category-gallery">
            <VideoGallery title="AIGC 知识视频" videos={knowledgeVideos} onOpen={(videoIndex) => onOpen(videos, videoIndex, "AIGC 知识视频")} />
            </div>
          </div>
        </section>
        <LabeledGalleryRow
          className="labeled-gallery-row--oral"
          title="口播视频"
          videos={oralVideo}
          allVideos={videos}
          collectionTitle="AIGC 知识视频"
          onOpen={onOpen}
        />
      </>
    );
  };

  return (
    <section className="editor-works" id="works">
      {categories.map((category) => (
        <section className={`chapter category-section category-section--${category.id}`} id={category.id} key={category.id}>
          {category.id !== "aigc" && category.id !== "reelshort" && category.id !== "newtestament" && <header className="category-heading">
            <h3><FoldText text={category.heading || category.title} trigger="scroll" fontSize="inherit" fontWeight="inherit" color="currentColor" /></h3>
            {category.description && <p>{category.description}</p>}
          </header>}
          {category.id === "newtestament" ? renderKnowledgeRows(category) : <div className="category-content">
            {category.id === "aigc" ? renderAigcRow() : category.id === "reelshort" ? renderReelshortRow() : category.subgroups ? category.subgroups.map((group) => <section className={`subcategory subcategory--${group.durationRule || "all"}`} key={group.title}><h4><FoldText text={group.title} trigger="scroll" fontSize="inherit" fontWeight="inherit" color="currentColor" /></h4><div className="subcategory-gallery">{renderGallery(group.ids, group.durationRule, group.title)}</div></section>) : <div className="category-gallery">{renderGallery(category.ids, undefined, category.title)}</div>}
          </div>}
        </section>
      ))}
    </section>
  );
});

function VideoModal({ viewer, isClosing, onClose, onChange, onExited }) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikePending, setIsLikePending] = useState(false);
  const [likeAnimationKey, setLikeAnimationKey] = useState(0);
  const [likeStatus, setLikeStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [isContactAnimating, setIsContactAnimating] = useState(false);
  const [orientationSwitchPhase, setOrientationSwitchPhase] = useState("idle");
  const [isSameOrientationSwitching, setIsSameOrientationSwitching] = useState(false);
  const [playerInstanceKey, setPlayerInstanceKey] = useState(0);
  const playerVideoRef = useRef(null);
  const fullscreenPlaybackRef = useRef(null);
  const wasPlayerFullscreenRef = useRef(false);
  const fullscreenRestoreTimerRef = useRef(null);
  const switchTransitionRef = useRef(null);
  const orientationSwitchTimersRef = useRef([]);
  const { videos, index, collectionTitle } = viewer;
  const video = videos[index];
  const details = getVideoDetails(video);
  const hidePlayerSummary = hidesPlayerSummary(video.id);
  const hidePlayerTitle = hidesPlayerTitle(video.id);
  const playbackSources = video.remoteStream
    ? [video.src, `/previews/${video.id}.mp4`]
    : [`/api/video/${video.id}?mapping=2`, `/previews/${video.id}.mp4`];
  const playbackSrc = playbackSources[sourceIndex];
  const previousIndex = (index - 1 + videos.length) % videos.length;
  const nextIndex = (index + 1) % videos.length;

  const prepareVideoSwitch = (targetIndex) => {
    setFailed(false);
    setSourceIndex(0);
    onChange(targetIndex);
  };

  const switchVideo = (targetIndex, direction) => {
    if (isClosing || targetIndex === index || switchTransitionRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const changesOrientation = videos[targetIndex].orientation !== video.orientation;

    if (prefersReducedMotion) {
      prepareVideoSwitch(targetIndex);
      return;
    }

    if (changesOrientation) {
      const transitionToken = {};
      switchTransitionRef.current = transitionToken;
      setOrientationSwitchPhase("out");

      const changeTimer = window.setTimeout(() => {
        if (switchTransitionRef.current !== transitionToken) return;
        setOrientationSwitchPhase("in");
        prepareVideoSwitch(targetIndex);

        const finishTimer = window.setTimeout(() => {
          if (switchTransitionRef.current !== transitionToken) return;
          setOrientationSwitchPhase("idle");
          switchTransitionRef.current = null;
        }, 280);
        orientationSwitchTimersRef.current.push(finishTimer);
      }, 180);
      orientationSwitchTimersRef.current.push(changeTimer);
      return;
    }

    if (!document.startViewTransition) {
      prepareVideoSwitch(targetIndex);
      return;
    }

    document.documentElement.dataset.videoSwitchDirection = direction;
    document.documentElement.dataset.videoSwitchLayout = "same-orientation";
    document.querySelector(".video-modal .video-frame video")?.pause();
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsSameOrientationSwitching(true);
        prepareVideoSwitch(targetIndex);
      });
    });
    switchTransitionRef.current = transition;
    transition.finished.catch(() => {}).finally(() => {
      delete document.documentElement.dataset.videoSwitchDirection;
      delete document.documentElement.dataset.videoSwitchLayout;
      setIsSameOrientationSwitching(false);
      window.requestAnimationFrame(() => {
        document.querySelector(".video-modal .video-frame video")?.play().catch(() => {});
      });
      if (switchTransitionRef.current === transition) switchTransitionRef.current = null;
    });
  };

  useEffect(() => () => {
    orientationSwitchTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    setFailed(false);
    setSourceIndex(0);
    setPlayerInstanceKey(0);
    fullscreenPlaybackRef.current = null;
    wasPlayerFullscreenRef.current = false;
    setIsLiked(false);
    setLikeCount(0);
    setIsLikePending(false);
    setLikeAnimationKey(0);
    setLikeStatus("");
    setShareStatus("");
    setIsContactAnimating(false);
  }, [video.id]);

  useEffect(() => {
    const playerVideo = playerVideoRef.current;
    if (!playerVideo) return undefined;

    const playerIsFullscreen = () => {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      return fullscreenElement === playerVideo
        || fullscreenElement?.contains?.(playerVideo)
        || playerVideo.webkitDisplayingFullscreen === true;
    };

    const rememberFullscreenEntry = () => {
      wasPlayerFullscreenRef.current = true;
    };

    const restoreInlinePlayer = () => {
      if (!window.matchMedia("(max-width: 720px)").matches) return;
      if (!wasPlayerFullscreenRef.current || playerIsFullscreen()) return;

      wasPlayerFullscreenRef.current = false;
      fullscreenPlaybackRef.current = {
        videoId: video.id,
        currentTime: Number.isFinite(playerVideo.currentTime) ? playerVideo.currentTime : 0,
        wasPaused: playerVideo.paused,
      };

      window.clearTimeout(fullscreenRestoreTimerRef.current);
      fullscreenRestoreTimerRef.current = window.setTimeout(() => {
        setPlayerInstanceKey((current) => current + 1);
      }, 0);
    };

    const handleFullscreenChange = () => {
      if (playerIsFullscreen()) {
        rememberFullscreenEntry();
      } else {
        restoreInlinePlayer();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    playerVideo.addEventListener("webkitbeginfullscreen", rememberFullscreenEntry);
    playerVideo.addEventListener("webkitendfullscreen", restoreInlinePlayer);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      playerVideo.removeEventListener("webkitbeginfullscreen", rememberFullscreenEntry);
      playerVideo.removeEventListener("webkitendfullscreen", restoreInlinePlayer);
      window.clearTimeout(fullscreenRestoreTimerRef.current);
    };
  }, [playerInstanceKey, playbackSrc, video.id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/likes/${encodeURIComponent(video.id)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load likes")))
      .then((data) => {
        if (!cancelled) {
          setLikeCount(data.count || 0);
          setIsLiked(Boolean(data.liked));
        }
      })
      .catch(() => {
        if (import.meta.env.DEV && !cancelled) {
          const localState = getLocalLikeState(video.id);
          setLikeCount(localState.count);
          setIsLiked(localState.liked);
        }
      });
    return () => { cancelled = true; };
  }, [video.id]);

  const shareProject = async () => {
    const videoUrl = new URL(window.location.href);
    videoUrl.searchParams.set("video", video.id);
    videoUrl.hash = "";
    try {
      await navigator.clipboard.writeText(videoUrl.href);
      setShareStatus("已复制");
      window.setTimeout(() => setShareStatus(""), 1800);
    } catch {
      setShareStatus("复制失败");
      window.setTimeout(() => setShareStatus(""), 1800);
    }
  };

  const toggleLike = async () => {
    if (isLikePending) return;
    setLikeAnimationKey((current) => current + 1);
    setIsLikePending(true);
    try {
      const response = await fetch(`/api/likes/${encodeURIComponent(video.id)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: isLiked ? "unlike" : "like" })
      });
      if (!response.ok) throw new Error("Unable to update likes");
      const data = await response.json();
      setLikeCount(data.count || 0);
      setIsLiked(Boolean(data.liked));
    } catch {
      if (import.meta.env.DEV) {
        const nextState = {
          liked: !isLiked,
          count: Math.max(0, likeCount + (isLiked ? -1 : 1))
        };
        saveLocalLikeState(video.id, nextState);
        setLikeCount(nextState.count);
        setIsLiked(nextState.liked);
        setLikeStatus("已在本地浏览器保存");
      } else {
        setLikeStatus("点赞服务暂不可用");
      }
    } finally {
      setIsLikePending(false);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") switchVideo((index - 1 + videos.length) % videos.length, "previous");
      if (event.key === "ArrowRight") switchVideo((index + 1) % videos.length, "next");
      if (event.key === "Tab") {
        const focusable = [...document.querySelectorAll(".video-modal button, .video-modal video")];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [index, isClosing, onClose, videos]);

  useEffect(() => {
    if (!isClosing) return undefined;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onExited, prefersReducedMotion ? 0 : 460);
    return () => window.clearTimeout(timer);
  }, [isClosing, onExited]);

  return createPortal((
    <div className={`video-modal video-modal--${video.orientation}${isClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" {...(hidePlayerTitle ? { "aria-label": "视频播放器" } : { "aria-labelledby": "video-modal-title" })} onMouseDown={(event) => !isClosing && event.target === event.currentTarget && onClose()}>
      <div className="spatial-backdrop" style={{ backgroundImage: `url(${video.poster})` }} aria-hidden="true" />
      <button className="spatial-close" type="button" onClick={onClose} aria-label="关闭播放器"><PlayerGlyph name="close" size={20} /></button>
      {videos.length > 1 && <button className="player-switch player-switch--previous" type="button" onClick={() => switchVideo(previousIndex, "previous")} aria-label={`上一个视频：${getDisplayTitle(videos[previousIndex])}`}><ChevronLeft size={22} /></button>}
      {videos.length > 1 && <button className="player-switch player-switch--next" type="button" onClick={() => switchVideo(nextIndex, "next")} aria-label={`下一个视频：${getDisplayTitle(videos[nextIndex])}`}><ChevronRight size={22} /></button>}
      <div className={`modal-shell ${video.orientation}`}>
        <div className="spatial-main">
          <div className={`player-stage ${video.orientation}`} style={{ "--video-ratio": video.orientation === "portrait" ? 9 / 16 : 16 / 9 }}>
            <div key={video.id} className={`video-frame${orientationSwitchPhase === "idle" ? "" : ` video-frame--orientation-${orientationSwitchPhase}`}`}>
              {failed ? (
                <div className="player-error"><PlayerGlyph name="play" size={32} /><strong>暂时无法播放此视频</strong><span>请检查本地素材文件是否完整。</span></div>
              ) : (
                <VideoAmbient
                  key={`${playbackSrc}-${playerInstanceKey}`}
                  ref={playerVideoRef}
                  src={playbackSrc}
                  poster={video.poster}
                  autoPlay
                  controls
                  controlsList="nodownload noremoteplayback noplaybackrate"
                  disablePictureInPicture
                  disableRemotePlayback
                  playsInline
                  preload="metadata"
                  blurAmount={70}
                  intensity={0.9}
                  active={!isSameOrientationSwitching}
                  onLoadedMetadata={(event) => {
                    const savedPlayback = fullscreenPlaybackRef.current;
                    if (!savedPlayback || savedPlayback.videoId !== video.id) return;

                    const element = event.currentTarget;
                    element.currentTime = Math.min(savedPlayback.currentTime, element.duration || savedPlayback.currentTime);
                    if (savedPlayback.wasPaused) {
                      element.pause();
                    } else {
                      element.play().catch(() => {});
                    }
                    fullscreenPlaybackRef.current = null;
                  }}
                  onPointerUp={(event) => {
                    const element = event.currentTarget;
                    window.requestAnimationFrame(() => element.blur());
                  }}
                  onError={() => {
                    if (sourceIndex < playbackSources.length - 1) {
                      setSourceIndex(sourceIndex + 1);
                    } else {
                      setFailed(true);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
        {/* Keep the information rail opaque while the player changes aspect ratio.
            Fading this entire panel out/in leaves a visible blank flash between
            portrait and landscape videos. */}
        <section className={`player-detail-panel${hidePlayerTitle ? " player-detail-panel--title-hidden" : ""}`} aria-label="作品信息">
          {!hidePlayerTitle && (
            <h2 id="video-modal-title">
              <BlurText
                key={`player-title-${video.id}`}
                as="span"
                text={getDisplayTitle(video)}
                animateBy="letters"
                delay={18}
                stepDuration={0.16}
                animationFrom={playerInfoBlurFrom}
                animationTo={playerInfoBlurTo}
              />
            </h2>
          )}
          <div className="player-detail-row">
            <div className="player-creator">
              <span className="player-avatar"><img src="/wa-logo.png" alt="" /></span>
              <span>
                <BlurText key={`player-author-${video.id}`} as="strong" text="吴义博" animateBy="letters" delay={22} stepDuration={0.16} animationFrom={playerInfoBlurFrom} animationTo={playerInfoBlurTo} />
                <BlurText key={`player-role-${video.id}`} as="small" text={video.metaDescription || collectionTitle} animateBy="letters" delay={12} stepDuration={0.16} animationFrom={playerInfoBlurFrom} animationTo={playerInfoBlurTo} />
              </span>
              <a className={`player-contact-button${isContactAnimating ? " is-animating" : ""}`} href="mailto:wu.yibo@foxmail.com" onClick={() => setIsContactAnimating(true)} onAnimationEnd={() => setIsContactAnimating(false)}>联系</a>
            </div>
            <div className="player-actions" aria-label="作品操作">
              <div className="player-rating">
                <button key={`like-${likeAnimationKey}`} type="button" className={`${isLiked ? "is-active" : ""}${likeAnimationKey > 0 ? " is-actioning" : ""}`} onClick={toggleLike} disabled={isLikePending} aria-label={`点赞数 ${likeCount}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H3V10h4Zm2 11V9l4-7 1 1v5h5.4a1.6 1.6 0 0 1 1.55 2l-2.1 9.2A2.3 2.3 0 0 1 16.6 21H9Z" /></svg>
                  {likeCount}
                </button>
              </div>
              {likeStatus && <span className="player-like-status" role="status">{likeStatus}</span>}
              <button type="button" className={`player-share-button${shareStatus ? " is-feedback" : ""}`} onClick={shareProject}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.9a3.4 3.4 0 0 0 0-2.6l6.7-3.9A3 3 0 1 0 15 5c0 .23.03.46.08.67L8.35 9.6A3 3 0 1 0 8.35 14l6.73 3.93A3 3 0 1 0 18 16Z" /></svg><span>{shareStatus || "分享"}</span></button>
            </div>
          </div>
          {!hidePlayerSummary && <div className="player-project-summary">
            <div className="player-project-meta" aria-label="视频信息">
              <span>{formatVideoDuration(video.duration)}</span>
              <span>{video.orientation === "portrait" ? "竖版影像" : "横版影像"}</span>
              {details.award && <span>{details.award}</span>}
            </div>
            <BlurText
              key={`player-description-${video.id}`}
              text={details.description || video.projectDescription || "视频作品选集，记录从创意、素材到成片的影像实践。"}
              animateBy="letters"
              delay={7}
              stepDuration={0.16}
              animationFrom={playerInfoBlurFrom}
              animationTo={playerInfoBlurTo}
            />
            {details.links?.length > 0 && <div className="player-project-links">{details.links.map((link) => <a href={link.href} key={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</div>}
          </div>}
        </section>
      </div>
    </div>
  ), document.body);
}

function ResearchBlock() {
  return (
    <section className="research-block">
      <div>
        <p className="eyebrow">Practice Thesis</p>
        <h2>影像创作不是单点技能，而是一套从系统、素材到叙事节奏的协同能力。</h2>
        <a className="outline-button" href="#contact">联系合作</a>
      </div>
      <div className="research-list">
        <a href="#ai"><span>AIGC Production</span><small>文生图、图生视频、AI 配音与短剧返修交付</small><ArrowRight size={16} /></a>
        <a href="#xinhua"><span>Documentary Editing</span><small>央媒纪实项目的后期策划、剪辑与平台传播</small><ArrowRight size={16} /></a>
        <a href="#commercial"><span>Broadcast Systems</span><small>亿元级广电系统集成经验带来的工程化执行力</small><ArrowRight size={16} /></a>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section className="editor-experience" id="experience">
      <div className="experience-list">
        {experiences.map((item) => (
          <article key={`${item.title}-${item.time}`}>
            <div className="experience-copy">
              <h3>{item.role} · {item.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FooterDecrypt({ text, delay = 0 }) {
  return <DecryptedText text={text} delay={Math.round(delay * 0.4)} speed={28} encryptedClassName="footer-decrypt-encrypted" />;
}

function Footer() {
  return (
    <footer className="editor-footer" id="contact">
      <div className="footer-main">
        <div className="footer-brand">
          <a href="#top" className="footer-logo" aria-label="返回顶部">
            <span className="footer-logo-metallic" aria-hidden="true">
              <img className="footer-logo-image footer-logo-fallback" src="/wa-logo.png" alt="" />
              <MetallicPaint
                imageSrc="/wa-logo.png"
                seed={42}
                scale={4}
                patternSharpness={1}
                noiseScale={0.5}
                speed={0.3}
                liquid={0.75}
                mouseAnimation={false}
                brightness={2}
                contrast={0.5}
                refraction={0.01}
                blur={0.015}
                chromaticSpread={2}
                fresnel={1}
                angle={0}
                waveAmplitude={1}
                distortion={1}
                contour={0.2}
                lightColor="#ffffff"
                darkColor="#000000"
                tintColor="#feb3ff"
              />
            </span>
            <FooterDecrypt text="吴义博" delay={180} />
          </a>
          <p><FooterDecrypt text="视频创作者与 AIGC 内容制作者，覆盖策划、拍摄、剪辑及从创意到交付的完整制作流程。" delay={520} /></p>
        </div>

        <div className="footer-contact-grid">
          <div><strong><FooterDecrypt text="Location" delay={340} /></strong><span><FooterDecrypt text="中国 · 北京" delay={700} /></span><span><FooterDecrypt text="支持线上办公" delay={1040} /></span></div>
          <div><strong><FooterDecrypt text="Email Address" delay={460} /></strong><a href="mailto:wu.yibo@foxmail.com"><FooterDecrypt text="wu.yibo@foxmail.com" delay={980} /></a></div>
          <div><strong><FooterDecrypt text="Phone Number" delay={580} /></strong><a href="tel:18800102979"><FooterDecrypt text="18800102979" delay={1220} /></a><span><FooterDecrypt text="微信同号" delay={1580} /></span></div>
        </div>
      </div>

      <div className="footer-lower">
        <span><FooterDecrypt text="© 2026 吴义博 · All rights reserved" delay={1280} /></span>
        <nav aria-label="页脚导航">
          <a href="#works"><FooterDecrypt text="作品" delay={1500} /></a>
          <a href="#contact"><FooterDecrypt text="联系" delay={1640} /></a>
          <a href="#top"><FooterDecrypt text="返回顶部" delay={1780} /></a>
        </nav>
      </div>
    </footer>
  );
}

function App() {
  const [manifest, setManifest] = useState({});
  const [manifestReady, setManifestReady] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [isViewerClosing, setIsViewerClosing] = useState(false);
  const restoreFocusRef = useRef(null);
  const portfolioVideos = useMemo(() => buildPortfolioVideoQueue(manifest), [manifest]);

  useEffect(() => {
    fetch("/media/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load media manifest");
        return response.json();
      })
      .then((data) => {
        const resolvedManifest = Object.fromEntries(
          Object.entries(data).map(([category, videos]) => [
            category,
            videos
          ])
        );
        setManifest(resolvedManifest);
      })
      .catch(() => setManifest({}))
      .finally(() => setManifestReady(true));
  }, []);

  useEffect(() => {
    if (!manifestReady || viewer) return;
    const videoId = new URLSearchParams(window.location.search).get("video");
    if (!videoId) return;
    const index = portfolioVideos.findIndex((video) => video.id === videoId);
    if (index >= 0) setViewer({ videos: portfolioVideos, index, collectionTitle: "全部视频作品" });
  }, [manifestReady, portfolioVideos, viewer]);

  useEffect(() => {
    if (!viewer) return;
    const url = new URL(window.location.href);
    url.searchParams.set("video", viewer.videos[viewer.index].id);
    url.hash = "";
    window.history.replaceState(null, "", url);
  }, [viewer]);

  useEffect(() => {
    let cancelled = false;
    const minimumDisplay = new Promise((resolve) => window.setTimeout(resolve, 700));
    const windowLoaded = document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    const fontsLoaded = document.fonts?.ready || Promise.resolve();

    Promise.all([minimumDisplay, windowLoaded, fontsLoaded]).then(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) setPageReady(true);
        });
      });
    });

    const safetyTimer = window.setTimeout(() => {
      if (!cancelled) {
        setPageReady(true);
        setManifestReady(true);
      }
    }, 2400);

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
    };
  }, []);

  const openViewer = useCallback((videos, index, collectionTitle) => {
    if (!videos.length) return;
    const selectedVideo = videos[index];
    const globalIndex = portfolioVideos.findIndex((video) => video.id === selectedVideo.id);
    restoreFocusRef.current = document.activeElement;
    setIsViewerClosing(false);
    setViewer({
      // Once opened, the viewer moves continuously through the full portfolio.
      // Keep the local collection only as a safe fallback for unmatched items.
      videos: globalIndex >= 0 ? portfolioVideos : videos,
      index: globalIndex >= 0 ? globalIndex : index,
      collectionTitle: globalIndex >= 0 ? "全部视频作品" : (collectionTitle || "全部视频作品")
    });
  }, [portfolioVideos]);

  const closeViewer = useCallback(() => {
    if (!viewer || isViewerClosing) return;
    setIsViewerClosing(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("video");
    window.history.replaceState(null, "", url);
  }, [isViewerClosing, viewer]);

  const finishClosingViewer = useCallback(() => {
    setViewer(null);
    setIsViewerClosing(false);
    window.requestAnimationFrame(() => restoreFocusRef.current?.focus());
  }, []);

  const changeVideo = useCallback((index) => {
    setViewer((current) => current ? { ...current, index } : current);
  }, []);

  return (
    <>
      <HalftoneDotsBackground />
      <PageLoader visible={!pageReady} />
      <Header />
      <main>
        <Hero />
        <HeroDivider />
        <Works manifest={manifest} onOpen={openViewer} />
      </main>
      <Footer />
      <div className={`player-rings-layer${viewer ? " is-active" : ""}${isViewerClosing ? " is-closing" : ""}`} aria-hidden="true">
        <Suspense fallback={null}>
          <MagicRings active={Boolean(viewer)} />
        </Suspense>
      </div>
      {viewer && <VideoModal viewer={viewer} isClosing={isViewerClosing} onClose={closeViewer} onChange={changeVideo} onExited={finishClosingViewer} />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
