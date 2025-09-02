'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Package } from 'lucide-react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  alt?: string;
}

interface SwipeableMediaGalleryProps {
  media: MediaItem[];
  className?: string;
  showArrows?: boolean;
  showIndicators?: boolean;
  showThumbnailGrid?: boolean;
  compact?: boolean;
}

export function SwipeableMediaGallery({
  media,
  className = '',
  showArrows = true,
  showIndicators = true,
  showThumbnailGrid = true,
  compact = false,
}: SwipeableMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMedia = media[currentIndex];
  const hasMultiple = media.length > 1;

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Mouse drag handling for desktop
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < media.length - 1) {
      goToNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      goToPrevious();
    }
  };

  // Mouse drag handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragEnd(null);
    setDragStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const distance = dragStart - dragEnd;
    const isLeftDrag = distance > minSwipeDistance;
    const isRightDrag = distance < -minSwipeDistance;

    if (isLeftDrag && currentIndex < media.length - 1) {
      goToNext();
    }
    if (isRightDrag && currentIndex > 0) {
      goToPrevious();
    }

    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          if (media[currentIndex]?.type === 'video') {
            togglePlay();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, media.length]);

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : media.length - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex < media.length - 1 ? currentIndex + 1 : 0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (media.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">Ingen medier</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-white overflow-hidden ${compact ? '' : 'rounded-xl shadow-sm border'} ${className}`}
      tabIndex={0}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Main media display */}
      <div className="relative aspect-square overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {media.map((item, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={item.alt || `Media ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
              ) : (
                <video
                  ref={index === currentIndex ? videoRef : null}
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {hasMultiple && showArrows && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-10"
              aria-label="Forrige billede"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-10"
              aria-label="Næste billede"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Video controls */}
        {media[currentIndex]?.type === 'video' && (
          <div className="absolute bottom-2 left-2 flex gap-2 z-10">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Afspil'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label={isMuted ? 'Slå lyd til' : 'Slå lyd fra'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        )}

        {/* Media counter */}
        {hasMultiple && showIndicators && (
          <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-black/50 text-white text-sm z-10">
            {currentIndex + 1} / {media.length}
          </div>
        )}

        {/* Simple dots indicator for compact mode */}
        {hasMultiple && compact && showIndicators && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex gap-1">
              {media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isTransitioning) {
                      setIsTransitioning(true);
                      setCurrentIndex(index);
                      setTimeout(() => setIsTransitioning(false), 300);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white shadow-md'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Hover hint for desktop */}
        {hasMultiple && compact && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                Swipe eller træk for flere billeder
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && showThumbnailGrid && !compact && (
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex gap-2 overflow-x-auto">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
