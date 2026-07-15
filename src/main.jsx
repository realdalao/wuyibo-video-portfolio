import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ExternalLink,
  Grid2X2,
  Mail,
  Phone,
  Play,
  Sparkles,
  X
} from "lucide-react";
import "./styles.css";
import "./experience.css";

const portfolioSource = "https://fcnapthanwru.feishu.cn/wiki/VNwkwSqvriUfmrklQQNc2mNanJE?from=from_copylink";

const highlights = [
  { label: "ReelShort 短剧", href: "#reelshort", copy: "AIGC 短剧生产与交付" },
  { label: "纪录片学院奖片花", href: "#academy", copy: "纪录片片花剪辑" },
  { label: "新华社", href: "#xinhua", copy: "长纪录片与主题短视频" },
  { label: "央视频", href: "#yangshipin", copy: "风物短片策划与剪辑" },
  { label: "小米宣传片", href: "#xiaomi", copy: "产品传播内容剪辑" }
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
    id: "academy",
    category: "academy",
    title: "纪录片学院奖片花",
    role: "核心片花剪辑",
    client: "第十五届“光影纪年”中国纪录片学院奖",
    description: "独立剪辑《窗外是蓝星》《绿色星球 2：城市天际线》《正义的审判》《河湟三章·河》《如何与莉迪亚交谈？》等获奖片花。",
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
    title: "课程作业与纪录片",
    role: "编导 / 拍摄 / 剪辑",
    client: "中国传媒大学",
    description: "包括反家暴公益广告《残妆》、自制谈话综艺《平行线-爱人再见》、纪录片《郝姐 上京赶集》等。",
    links: [{ label: "查看合集", href: portfolioSource }]
  }
];

const experiences = [
  { time: "2025.07 - 2025.10", title: "新华社", role: "编导 / 剪辑实习生", body: "参与《我们的故宫》《向新而行》《西藏一日》等重磅视频项目，并承担高规格报道任务的拍摄执行。" },
  { time: "2026.04 - 2026.06", title: "ReelShort", role: "AI 短剧实习生", body: "使用 AIGC 工具完成短剧生产、审核、返修和交付，把生成能力落到稳定的视频流程中。" },
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
  "ai-manga-01": "灯神救人",
  "ai-manga-02": "狼人女主",
  "ai-manga-03": "阿拉丁许愿",
  "ai-manga-04": "流落街头的父亲",
  "ai-manga-05": "女歌手假唱",
  "ai-manga-06": "日漫女孩",
  "ai-manga-07": "亚洲男孩武打片",
  "ai-manga-08": "忠诚四男",
  "documentary-trailers-01": "窗外是蓝星",
  "documentary-trailers-02": "方舟·布氏鲸",
  "documentary-trailers-03": "河湟三章",
  "documentary-trailers-04": "凌云壮志",
  "documentary-trailers-05": "绿色星球 2",
  "documentary-trailers-06": "如何与莉迪亚交谈",
  "documentary-trailers-07": "正义的审判",
  "guangxi-01": "甜美广西·坚果",
  "palace-01": "我们的故宫·第二集",
  "palace-02": "我们的故宫·第一集",
  "palace-03": "故宫藻井",
  "palace-04": "故宫数字文物",
  "palace-05": "故宫文物修复",
  "xiangxin-01": "向新而行·广西上集",
  "xiangxin-02": "向新而行·广西下集",
  "xiangxin-03": "广西蚝排",
  "xiangxin-04": "广西百香果",
  "xiangxin-05": "榴莲炖鸡",
  "tibet-01": "西藏一日",
  "xinhua-01": "九三阅兵",
  "xinhua-02": "三国的星空",
  "xiaomi-01": "安卓机皇",
  "xiaomi-02": "小米 11 Ultra 影像",
  "xiaomi-03": "小米 11 Pro 影像",
  "xiaomi-04": "小米春季发布会",
  "xiaomi-05": "小米 11 超级夜景",
  "xiaomi-06": "小米 11 屏幕抗摔",
  "xiaomi-07": "小米 11 心率测试",
  "course-01": "残妆",
  "course-02": "扬声",
  "course-03": "先开枪再瞄准",
  "course-04": "郝姐上京赶集",
  "course-05": "平行线·爱人再见"
};

function getDisplayTitle(video) {
  return displayTitleById[video.id] || video.title;
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="返回顶部">吴义博</a>
      <nav aria-label="主导航">
        <a href="#works">作品</a>
        <a href="#experience">经历</a>
        <a href="#contact">联系</a>
      </nav>
      <div className="header-actions">
        <a className="soft-button" href="mailto:754087377@qq.com">Email</a>
        <a className="dark-button" href="#works">View Works</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="editor-hero" id="top">
      <div className="hero-intro">
        <h1 style={{ fontWeight: 600 }}>Video<br />Creator</h1>
      </div>
      <div className="portrait-frame">
        <img src="/profile/wuyibo-portrait.jpg" alt="吴义博肖像" />
      </div>
      <div className="hero-sidecopy">
        <p className="hero-summary" style={{ fontWeight: 500 }}>
          <span style={{ width: "100%" }}>你好，我是吴义博。</span>
          <span style={{ width: "86%" }}>用影像讲故事，以 AI 重塑生产力。</span>
          <span style={{ width: "76%" }}>持续创造直观、有温度的数字体验。</span>
        </p>
        <div className="hero-cta">
          <a className="dark-button" href="#works">查看作品 <ArrowRight size={15} /></a>
          <a className="text-button" href="#contact">联系我</a>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats-section">
      <div className="stats-lead"><h2>视频不只是画面的流动，更是思想与 AI 碰撞的艺术。</h2></div>
      <p className="stats-note">从真实世界的现场，到生成式影像的实验，我关心内容如何被看见，也关心它如何被更高效地生产。</p>
      <div className="stats-grid"><div><strong>41</strong><span>本地视频作品</span></div><div><strong>4</strong><span>核心创作方向</span></div><div><strong>1亿元+</strong><span>广电系统项目执行经验</span></div></div>
    </section>
  );
}

function AutoplayPreview({ video }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;

    const keepPlaying = () => element.play().catch(() => {});
    keepPlaying();
    element.addEventListener("canplay", keepPlaying);
    element.addEventListener("pause", keepPlaying);
    document.addEventListener("visibilitychange", keepPlaying);

    return () => {
      element.removeEventListener("canplay", keepPlaying);
      element.removeEventListener("pause", keepPlaying);
      document.removeEventListener("visibilitychange", keepPlaying);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={video.src}
      poster={video.poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

function VideoGallery({ title, videos, description, onOpen }) {
  if (!videos.length) return <div className="gallery-empty">视频封面正在准备中</div>;

  const landscapeVideos = videos.filter((video) => video.orientation !== "portrait");
  const portraitVideos = videos.filter((video) => video.orientation === "portrait");

  const renderVideos = (items) => (
    <div className="video-gallery">
      {items.map((video) => (
        <figure className={`video-card ${video.orientation}`} key={video.id}>
          <button className="video-tile" type="button" onClick={() => onOpen(videos.indexOf(video))} aria-label={`播放${getDisplayTitle(video)}`}>
            <AutoplayPreview video={video} />
            <span className="tile-shade" aria-hidden="true" />
            <span className="tile-play" aria-hidden="true"><Play size={18} fill="currentColor" /></span>
          </button>
          <figcaption className="video-caption">
            <strong>{getDisplayTitle(video)}</strong>
            <small>{formatDuration(video.duration)}{video.metaDescription || description ? ` / ${video.metaDescription || description}` : ""}</small>
          </figcaption>
        </figure>
      ))}
    </div>
  );

  return (
    <div className="video-groups" aria-label={`${title}视频列表`}>
      {landscapeVideos.length > 0 && <div className="video-group landscape-group">{renderVideos(landscapeVideos)}</div>}
      {portraitVideos.length > 0 && <div className="video-group portrait-group">{renderVideos(portraitVideos)}</div>}
    </div>
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

function Works({ manifest, onOpen }) {
  const categories = [
    { id: "reelshort", title: "ReelShort 短剧", kicker: "01 / AIGC 视频制作", ids: ["ai"] },
    { id: "academy", title: "纪录片学院奖片花", kicker: "02 / 纪录片片花", ids: ["academy"] },
    { id: "xinhua", title: "新华社", kicker: "03 / 纪实与主题影像", subgroups: [
      { title: "长纪录片", durationRule: "long", ids: ["xinhua", "xiangxin", "tibet"] },
      { title: "短视频", durationRule: "short", ids: ["xinhua", "xiangxin", "tibet", "xinhua-more", "xinhua-animation", "yangsheng-xinhua"] }
    ] },
    { id: "yangshipin", title: "央视频", kicker: "04 / 风物与品牌影像", ids: ["guangxi"] },
    { id: "xiaomi", title: "小米宣传片", kicker: "05 / 产品传播内容", ids: ["commercial"] }
  ];

  const getWorkVideos = (id, durationRule) => {
    const work = works.find((item) => item.id === id);
    let videos = manifest[work.category] || [];
    if (work.videoIds) videos = work.videoIds.map((videoId) => videos.find((video) => video.id === videoId)).filter(Boolean);
    if (work.id === "commercial") {
      const preferredOrder = ["xiaomi-05", "xiaomi-06", "xiaomi-07", "xiaomi-01", "xiaomi-02", "xiaomi-03", "xiaomi-04"];
      videos = preferredOrder.map((videoId) => videos.find((video) => video.id === videoId)).filter(Boolean);
    }
    if (durationRule === "long") videos = videos.filter((video) => video.duration > 20 * 60);
    if (durationRule === "short") videos = videos.filter((video) => video.duration <= 20 * 60);
    return videos.map((video) => ({
      ...video,
      metaDescription: `${work.client} / ${work.role}`
    }));
  };

  const renderGallery = (ids, durationRule, title) => {
    const videos = ids.flatMap((id) => getWorkVideos(id, durationRule));
    if (!videos.length) return null;
    return <VideoGallery title={title} videos={videos} onOpen={(videoIndex) => onOpen(videos, videoIndex, title)} />;
  };

  return (
    <section className="editor-works" id="works">
      <nav className="category-tabs" aria-label="作品分类">
        {highlights.map((item) => <a href={item.href} key={item.href}>{item.label}<ArrowRight size={14} /></a>)}
      </nav>
      {categories.map((category) => (
        <section className="chapter category-section" id={category.id} key={category.id}>
          <header className="category-heading"><h3>{category.title}</h3></header>
          <div className="category-content">
            {category.subgroups ? category.subgroups.map((group) => <section className="subcategory" key={group.title}><h4>{group.title}</h4><div className="subcategory-gallery">{renderGallery(group.ids, group.durationRule, group.title)}</div></section>) : <div className="category-gallery">{renderGallery(category.ids, undefined, category.title)}</div>}
          </div>
        </section>
      ))}
    </section>
  );
}

function VideoModal({ viewer, onClose, onChange }) {
  const closeButtonRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const { videos, index, collectionTitle } = viewer;
  const video = videos[index];

  useEffect(() => {
    setFailed(false);
  }, [video.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange((index - 1 + videos.length) % videos.length);
      if (event.key === "ArrowRight") onChange((index + 1) % videos.length);
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [index, onChange, onClose, videos]);

  return (
    <div className="video-modal" role="dialog" aria-modal="true" aria-labelledby="video-modal-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal-shell ${video.orientation}`}>
        <div className={`player-stage ${video.orientation}`}>
          {failed ? (
            <div className="player-error"><Play size={30} /><strong>暂时无法播放此视频</strong><span>请检查本地素材文件是否完整。</span></div>
          ) : (
            <video key={video.src} src={video.src} poster={video.poster} controls autoPlay playsInline preload="metadata" onError={() => setFailed(true)} />
          )}
        </div>
        <aside className="modal-info">
          <button className="modal-close" ref={closeButtonRef} type="button" onClick={onClose} aria-label="关闭播放器"><X size={22} /></button>
          <div className="modal-info-copy">
            <span className="modal-info-label">PROJECT</span>
            <strong id="video-modal-title">{getDisplayTitle(video)}</strong>
            <p>{collectionTitle}</p>
            <dl>
              <div><dt>ROLE</dt><dd>{video.metaDescription || "视频作品"}</dd></div>
              <div><dt>FORMAT</dt><dd>{video.orientation === "portrait" ? "Vertical video" : "Landscape video"}</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
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
      <div className="experience-intro">
        <div>
          <span className="experience-pill">Experience</span>
          <h2>以影像实践，<br />记录每一步成长。</h2>
        </div>
        <p>从工程执行、品牌内容到央媒纪录片与 AIGC 短剧，持续扩展创作方法与制作边界。</p>
      </div>
      <div className="experience-list">
        {experiences.map((item) => (
          <article key={`${item.title}-${item.time}`}>
            <div className="experience-copy">
              <h3>{item.role} · {item.title}</h3>
              <p>{item.body}</p>
            </div>
            <time>{item.time}</time>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="editor-footer" id="contact">
      <div><h2>完整的视频<br />创作能力</h2><p>覆盖视频策划、现场拍摄、后期剪辑与 AIGC 内容生产，能够独立完成从创意构思到成片交付的完整制作流程。</p></div>
      <div className="contact-list">
        <a href="mailto:754087377@qq.com"><Mail size={16} />754087377@qq.com</a>
        <a href="tel:18800102979"><Phone size={16} />18800102979</a>
        <a href={portfolioSource} target="_blank" rel="noreferrer"><Sparkles size={16} />飞书作品集</a>
      </div>
      <div className="skill-cloud">
        {["Premiere", "DaVinci", "After Effects", "Photoshop", "AIGC", "FX6/FX3", "Z280", "Broadcast Systems"].map((skill) => <span key={skill}>{skill}</span>)}
      </div>
    </footer>
  );
}

function App() {
  const [manifest, setManifest] = useState({});
  const [viewer, setViewer] = useState(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    fetch("/media/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load media manifest");
        return response.json();
      })
      .then(setManifest)
      .catch(() => setManifest({}));
  }, []);

  const openViewer = (videos, index, collectionTitle) => {
    if (!videos.length) return;
    restoreFocusRef.current = document.activeElement;
    setViewer({ videos, index, collectionTitle });
  };

  const closeViewer = () => {
    setViewer(null);
    window.requestAnimationFrame(() => restoreFocusRef.current?.focus());
  };

  const changeVideo = (index) => setViewer((current) => current ? { ...current, index } : current);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Works manifest={manifest} onOpen={openViewer} />
        <Experience />
      </main>
      <Footer />
      {viewer && <VideoModal viewer={viewer} onClose={closeViewer} onChange={changeVideo} />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
