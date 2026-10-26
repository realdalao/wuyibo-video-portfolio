import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import "./video-ambient.css";

const CANVAS_WIDTH = 64;
const CANVAS_HEIGHT = 36;
const MOBILE_MEDIA_QUERY = "(max-width: 720px)";

/**
 * A lightweight ambient layer that samples the active video at low resolution.
 * Keeping the canvas small makes the blurred colour field inexpensive to paint.
 */
const VideoAmbient = forwardRef(function VideoAmbient(
  { className = "", blurAmount = 56, intensity = 0.78, active = true, ...videoProps },
  forwardedRef,
) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(MOBILE_MEDIA_QUERY).matches
  ));

  useImperativeHandle(forwardedRef, () => videoRef.current);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateViewport = (event) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!video || !canvas || !context || !active || isMobile) return undefined;

    let frame = 0;
    const paint = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          context.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } catch {
          // A playback failure should never stop the player itself.
        }
      }
      frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [active, isMobile]);

  return (
    <div className={`video-ambient ${className}`}>
      {!isMobile && (
        <canvas
          ref={canvasRef}
          className="video-ambient__glow"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-hidden="true"
          style={{ filter: `blur(${blurAmount}px) saturate(1.18)`, opacity: intensity }}
        />
      )}
      <video ref={videoRef} className="video-ambient__media" {...videoProps} />
    </div>
  );
});

export default VideoAmbient;
