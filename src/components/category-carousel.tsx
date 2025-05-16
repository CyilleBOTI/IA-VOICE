"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "@/lib/firebase-service";

interface CategoryCarouselProps {
  categories: Category[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
    speed: 10, // Even slower animation speed (higher number = slower)
    slidesToScroll: 1,
    containScroll: "trimSnaps",
    inViewThreshold: 0.7 // Ensures slides are mostly in view before considered "active"
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [autoplayActive, setAutoplayActive] = useState(false); // Disabled autoplay
  const [autoplayInterval, setAutoplayInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // No autoplay functionality

  // Setup basic event listeners without autoplay
  useEffect(() => {
    if (!emblaApi) return;

    // Setup event listeners
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // Cleanup
    return () => {
      if (emblaApi) {
        emblaApi.off("select", onSelect);
        emblaApi.off("reInit", onSelect);
      }
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {categories.map((category) => (
            <div key={category.id} className="embla__slide flex-[0_0_100%] min-w-0 sm:flex-[0_0_80%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
              <Link href={`/items?category=${category.id}`}>
                <div className="group relative overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-md mx-2">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="object-cover transition-all group-hover:scale-105 h-full w-full"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 p-4 text-white">
                    <h3 className="font-semibold text-xl">{category.name}</h3>
                    <p className="text-sm line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 rounded-full shadow-md hover:bg-background"
          onClick={scrollPrev}
          disabled={!prevBtnEnabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 rounded-full shadow-md hover:bg-background"
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-4">
        {categories.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 mx-1 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? "bg-primary w-4"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
