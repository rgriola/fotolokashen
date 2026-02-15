"use client";
import * as React from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import Image from "next/image";

interface CarouselProps {
  images: string[];
  alt?: string;
  className?: string;
}

export function Carousel({ images, alt = "Photo", className = "" }: CarouselProps) {
  const [index, setIndex] = React.useState(0);
  const total = images.length;

  if (total === 0) return null;

  const prev = () => setIndex((i) => (i === 0 ? total - 1 : i - 1));
  const next = () => setIndex((i) => (i === total - 1 ? 0 : i + 1));

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={images[index]}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        style={{ aspectRatio: "16/9" }}
        width={1200}
        height={675}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
        draggable={false}
      />
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-10 hover:bg-black/70"
            aria-label="Previous photo"
            type="button"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 z-10 hover:bg-black/70"
            aria-label="Next photo"
            type="button"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
