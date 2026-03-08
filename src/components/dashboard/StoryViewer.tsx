import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Story {
  name: string;
  avatar: string;
  image: string;
  hasNew: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

const StoryViewer = ({ stories, initialIndex, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const story = stories[currentIndex];

  const close = useCallback(() => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setSlideDirection("left");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setProgress(0);
        setSlideDirection(null);
      }, 200);
    } else {
      close();
    }
  }, [currentIndex, stories.length, close]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSlideDirection("right");
      setTimeout(() => {
        setCurrentIndex((i) => i - 1);
        setProgress(0);
        setSlideDirection(null);
      }, 200);
    }
  }, [currentIndex]);

  // Timer logic
  useEffect(() => {
    if (isPaused || slideDirection) return;

    startTimeRef.current = performance.now() - (progress / 100) * STORY_DURATION;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentIndex, isPaused, slideDirection, goNext]);

  // Reset progress on index change
  useEffect(() => {
    setProgress(0);
    pausedAtRef.current = 0;
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "p") setIsPaused((p) => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close, goNext, goPrev]);

  // Touch support
  const touchStartRef = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (diff < -50) goNext();
    else if (diff > 50) goPrev();
  };

  // Click left/right halves
  const handleAreaClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) goPrev();
    else if (x > (rect.width * 2) / 3) goNext();
    else setIsPaused((p) => !p);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black/95 flex items-center justify-center transition-opacity duration-300 ${
        isExiting ? "opacity-0" : "opacity-100 animate-fade-in"
      }`}
    >
      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-16 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors hidden md:flex"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Story card */}
      <div
        className={`relative w-full max-w-[420px] h-[85vh] max-h-[750px] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-200 ${
          slideDirection === "left"
            ? "-translate-x-10 opacity-0"
            : slideDirection === "right"
            ? "translate-x-10 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleAreaClick}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3 pb-0">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    i < currentIndex
                      ? "100%"
                      : i === currentIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-30 flex items-center gap-3 px-4">
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-blue-400">
            <Avatar className="w-10 h-10 border-2 border-black">
              <AvatarImage src={story.avatar} />
              <AvatarFallback className="text-xs bg-muted">{story.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{story.name}</p>
            <p className="text-white/60 text-xs">Il y a 2h</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused((p) => !p);
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-white" />
            ) : (
              <Pause className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Story image */}
        <img
          src={story.image}
          alt={story.name}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none" />

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-4 rounded-full bg-black/40 animate-fade-in">
              <Pause className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Story counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        {currentIndex + 1} / {stories.length}
      </div>
    </div>
  );
};

export default StoryViewer;
