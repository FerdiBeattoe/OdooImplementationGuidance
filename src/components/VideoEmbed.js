import { el } from "../../app/frontend/src/lib/dom.js";

const VIDEO_PROVIDERS = {
  YOUTUBE: "youtube",
  VIMEO: "vimeo",
  DIRECT: "direct"
};

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function extractVideoId(url, provider) {
  if (!url) return null;

  switch (provider) {
    case VIDEO_PROVIDERS.YOUTUBE: {
      const match = url.match(YOUTUBE_REGEX);
      return match ? match[1] : null;
    }
    case VIDEO_PROVIDERS.VIMEO: {
      const match = url.match(VIMEO_REGEX);
      return match ? match[1] : null;
    }
    case VIDEO_PROVIDERS.DIRECT:
      return url;
    default:
      return null;
  }
}

export function detectVideoProvider(url) {
  if (!url) return null;
  if (YOUTUBE_REGEX.test(url)) return VIDEO_PROVIDERS.YOUTUBE;
  if (VIMEO_REGEX.test(url)) return VIDEO_PROVIDERS.VIMEO;
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return VIDEO_PROVIDERS.DIRECT;
  return null;
}

export function buildEmbedUrl(videoId, provider, options = {}) {
  const { startTime = 0, autoplay = false, muted = false, controls = true } = options;

  switch (provider) {
    case VIDEO_PROVIDERS.YOUTUBE:
      return `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
        start: startTime,
        autoplay: autoplay ? 1 : 0,
        mute: muted ? 1 : 0,
        controls: controls ? 1 : 0,
        rel: 0,
        modestbranding: 1
      }).toString()}`;

    case VIDEO_PROVIDERS.VIMEO:
      return `https://player.vimeo.com/video/${videoId}?${new URLSearchParams({
        t: startTime,
        autoplay: autoplay ? 1 : 0,
        muted: muted ? 1 : 0,
        controls: controls ? 1 : 0
      }).toString()}`;

    case VIDEO_PROVIDERS.DIRECT:
      return videoId;

    default:
      return null;
  }
}

export function createVideoEmbed(options = {}) {
  const {
    url,
    provider: forcedProvider,
    title = "Video",
    aspectRatio = "16:9",
    responsive = true,
    lazyLoad = true,
    startTime = 0,
    autoplay = false,
    muted = false,
    controls = true,
    thumbnailUrl,
    onLoad = () => {},
    onError = () => {}
  } = options;

  const provider = forcedProvider || detectVideoProvider(url);
  const videoId = extractVideoId(url, provider);

  if (!videoId || !provider) {
    return createErrorEmbed("Invalid video URL or unsupported provider");
  }

  const embedUrl = buildEmbedUrl(videoId, provider, { startTime, autoplay, muted, controls });
  const container = el("div", {
    className: `video-embed video-embed--${provider} ${responsive ? "video-embed--responsive" : ""}`,
    dataset: { testid: "video-embed", provider, videoId }
  });

  const aspectPadding = calculateAspectPadding(aspectRatio);

  const wrapper = el("div", {
    className: "video-embed__wrapper",
    style: `padding-bottom: ${aspectPadding}%`
  });

  let iframe;

  if (lazyLoad && !autoplay) {
    const thumbnail = thumbnailUrl || getDefaultThumbnail(provider, videoId);

    const placeholder = el("div", {
      className: "video-embed__placeholder",
      onclick: loadVideo
    }, [
      el("img", {
        className: "video-embed__thumbnail",
        src: thumbnail,
        alt: escapeAttr(title),
        loading: "lazy"
      }),
      el("button", {
        className: "video-embed__play-button",
        type: "button",
        ariaLabel: `Play ${title}`
      }, [
        el("span", { className: "video-embed__play-icon", text: "▶" })
      ])
    ]);

    wrapper.appendChild(placeholder);
  } else {
    loadVideo();
  }

  function loadVideo() {
    iframe = el("iframe", {
      className: "video-embed__iframe",
      src: embedUrl,
      title: escapeAttr(title),
      frameborder: "0",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      allowfullscreen: true,
      loading: lazyLoad ? "lazy" : "eager",
      onload: onLoad,
      onerror: onError
    });

    wrapper.innerHTML = "";
    wrapper.appendChild(iframe);
  }

  container.appendChild(wrapper);

  if (title) {
    container.appendChild(
      el("figcaption", { className: "video-embed__caption", text: title })
    );
  }

  return container;
}

export function createErrorEmbed(message) {
  return el("div", {
    className: "video-embed video-embed--error",
    dataset: { testid: "video-embed-error" }
  }, [
    el("div", { className: "video-embed__error" }, [
      el("span", { className: "video-embed__error-icon", text: "⚠️" }),
      el("span", { className: "video-embed__error-text", text: message })
    ])
  ]);
}

export function createVideoPlaylist(options = {}) {
  const {
    videos = [],
    currentIndex = 0,
    onVideoChange = () => {},
    showPlaylist = true,
    aspectRatio = "16:9"
  } = options;

  const container = el("div", { className: "video-playlist", dataset: { testid: "video-playlist" } });
  let currentVideoIndex = currentIndex;

  function renderCurrentVideo() {
    const video = videos[currentVideoIndex];
    if (!video) return createErrorEmbed("No video available");

    return createVideoEmbed({
      ...video,
      aspectRatio,
      autoplay: false,
      lazyLoad: false
    });
  }

  function renderPlaylist() {
    if (!showPlaylist || videos.length <= 1) return null;

    const playlist = el("div", { className: "video-playlist__list" });

    videos.forEach((video, index) => {
      const isActive = index === currentVideoIndex;
      const item = el("button", {
        className: `video-playlist__item ${isActive ? "video-playlist__item--active" : ""}`,
        onclick: () => selectVideo(index)
      }, [
        el("span", { className: "video-playlist__number", text: String(index + 1) }),
        el("span", { className: "video-playlist__title", text: video.title || `Video ${index + 1}` }),
        el("span", { className: "video-playlist__duration", text: video.duration || "" })
      ]);
      playlist.appendChild(item);
    });

    return playlist;
  }

  function selectVideo(index) {
    if (index < 0 || index >= videos.length) return;
    currentVideoIndex = index;
    render();
    onVideoChange(videos[index], index);
  }

  function render() {
    container.innerHTML = "";
    container.appendChild(renderCurrentVideo());
    const playlist = renderPlaylist();
    if (playlist) container.appendChild(playlist);
    return container;
  }

  function next() {
    if (currentVideoIndex < videos.length - 1) {
      selectVideo(currentVideoIndex + 1);
    }
  }

  function previous() {
    if (currentVideoIndex > 0) {
      selectVideo(currentVideoIndex - 1);
    }
  }

  render();

  return {
    element: container,
    render,
    selectVideo,
    next,
    previous,
    getCurrentIndex: () => currentVideoIndex,
    getCurrentVideo: () => videos[currentVideoIndex]
  };
}

export function createHelpVideo(options = {}) {
  const {
    title,
    description,
    videoUrl,
    relatedVideos = [],
    onWatchComplete = () => {}
  } = options;

  const container = el("div", { className: "help-video", dataset: { testid: "help-video" } });

  const header = el("div", { className: "help-video__header" }, [
    el("h4", { className: "help-video__title", text: title }),
    description ? el("p", { className: "help-video__description", text: description }) : null
  ]);

  const video = createVideoEmbed({
    url: videoUrl,
    title,
    aspectRatio: "16:9",
    lazyLoad: true
  });

  container.appendChild(header);
  container.appendChild(video);

  if (relatedVideos.length > 0) {
    const related = el("div", { className: "help-video__related" }, [
      el("h5", { text: "Related Videos" })
    ]);

    relatedVideos.forEach(rv => {
      const link = el("button", {
        className: "help-video__related-link",
        onclick: () => onWatchComplete(rv)
      }, [
        el("span", { text: rv.title }),
        rv.duration ? el("span", { className: "help-video__duration", text: rv.duration }) : null
      ]);
      related.appendChild(link);
    });

    container.appendChild(related);
  }

  return container;
}

function calculateAspectPadding(ratio) {
  const [w, h] = ratio.split(":").map(Number);
  return ((h / w) * 100).toFixed(2);
}

function getDefaultThumbnail(provider, videoId) {
  switch (provider) {
    case VIDEO_PROVIDERS.YOUTUBE:
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case VIDEO_PROVIDERS.VIMEO:
      return `https://vumbnail.com/${videoId}.jpg`;
    default:
      return "";
  }
}

export { VIDEO_PROVIDERS };
