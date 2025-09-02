'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface SwipeableImageProps {
  images: string[];
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  onImageChange?: (index: number) => void;
}

export function SwipeableImage({
  images,
  alt,
  className = '',
  fallbackIcon = <Package className="h-12 w-12 text-gray-400" />,
  onImageChange,
}: SwipeableImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const validImages = images.filter(Boolean);
  const hasImages = validImages.length > 0;
  const hasMultipleImages = validImages.length > 1;

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < validImages.length) {
        setCurrentIndex(index);
        onImageChange?.(index);
      }
    },
    [validImages.length, onImageChange]
  );

  const nextImage = useCallback(() => {
    goToImage((currentIndex + 1) % validImages.length);
  }, [currentIndex, validImages.length, goToImage]);

  const prevImage = useCallback(() => {
    goToImage(currentIndex === 0 ? validImages.length - 1 : currentIndex - 1);
  }, [currentIndex, validImages.length, goToImage]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !hasMultipleImages) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !hasMultipleImages) return;
    
    setIsDragging(false);
    
    // Threshold for swipe (30% of container width)
    const threshold = containerRef.current ? containerRef.current.offsetWidth * 0.3 : 100;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
    
    setTranslateX(0);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!hasMultipleImages) return;
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !hasMultipleImages) return;
    
    const currentX = e.clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleMouseUp = () => {
    if (!isDragging || !hasMultipleImages) return;
    
    setIsDragging(false);
    
    // Threshold for swipe
    const threshold = containerRef.current ? containerRef.current.offsetWidth * 0.3 : 100;
    
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
    
    setTranslateX(0);
  };

  if (!hasImages) {
    return (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Current Image */}
      <div
        className="w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
        }}
      >
        <Image
          src={validImages[currentIndex]}
          alt={alt}
          width={400}
          height={400}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Image Indicators */}
      {hasMultipleImages && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-1">
            {validImages.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white shadow-md'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
            {validImages.length > 5 && (
              <span className="text-white text-xs bg-black/50 px-1 rounded ml-1">
                +{validImages.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Swipe Hint */}
      {hasMultipleImages && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
          <div className="w-1/3 h-full bg-gradient-to-r from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
          <div className="w-1/3 h-full bg-gradient-to-l from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}
