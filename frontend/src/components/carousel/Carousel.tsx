/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

interface SlideItem {
  title: string;
  subtitle: string;
  image: string;
}

const baseSlides: SlideItem[] = [
  {
    title: "CrossFit",
    subtitle: "High-intensity functional training",
    image: "/crossFit.jpg",
  },
  {
    title: "Martial Arts",
    subtitle: "Discipline meets technique",
    image: "/martialArts.jpg",
  },
  {
    title: "Aquatic",
    subtitle: "Low-impact, full-body performance",
    image: "/aquatic.jpg",
  },
  {
    title: "Yoga Flow",
    subtitle: "Balance strength and stillness",
    image: "/yogaFlow.jpg",
  },
  {
    title: "Run Club",
    subtitle: "Community-driven endurance",
    image: "/runClub.jpg",
  },
];

const slides = [...baseSlides, ...baseSlides];

const TWEEN_FACTOR_BASE = 0.15; // Controls the strength of the parallax (15%)

export default function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", dragFree: true },
    [
      AutoScroll({
        speed: 1.2,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  const tweenNodes = useRef<HTMLElement[]>([]);

  // 1. Grab all the image nodes
  const setTweenNodes = useCallback((api: any): void => {
    tweenNodes.current = api.slideNodes().map((slideNode: HTMLElement) => {
      return slideNode.querySelector(".parallax-bg") as HTMLElement;
    });
  }, []);

  // 2. Official Embla Parallax Math (handles infinite looping perfectly)
  const tweenParallax = useCallback((api: any, eventName?: string) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();
    const isScrollEvent = eventName === "scroll";

    api.scrollSnapList().forEach((scrollSnap: number, snapIndex: number) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];

      slidesInSnap.forEach((slideIndex: number) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem: any) => {
            const target = loopItem.target();

            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) {
                diffToTarget = scrollSnap - (1 + scrollProgress);
              }
              if (sign === 1) {
                diffToTarget = scrollSnap + (1 - scrollProgress);
              }
            }
          });
        }

        const translate = diffToTarget * (-100 * TWEEN_FACTOR_BASE);
        const tweenNode = tweenNodes.current[slideIndex];
        if (tweenNode) {
          tweenNode.style.transform = `translate3d(${translate}%, 0, 0)`;
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    tweenParallax(emblaApi);

    emblaApi.on("reInit", setTweenNodes);
    emblaApi.on("reInit", tweenParallax);
    emblaApi.on("scroll", tweenParallax);

    return () => {
      emblaApi.off("reInit", setTweenNodes);
      emblaApi.off("reInit", tweenParallax);
      emblaApi.off("scroll", tweenParallax);
    };
  }, [emblaApi, tweenParallax, setTweenNodes]);

  const onMouseEnter = useCallback(() => {
    emblaApi?.plugins()?.autoScroll?.stop();
  }, [emblaApi]);

  const onMouseLeave = useCallback(() => {
    emblaApi?.plugins()?.autoScroll?.play();
  }, [emblaApi]);

  return (
    <section className="w-full bg-background py-16">
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Soft edge masks for blending into the background */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-linear-to-r from-background to-transparent sm:w-32"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-linear-to-l from-background to-transparent sm:w-32"
          aria-hidden="true"
        />

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex cursor-grab select-none active:cursor-grabbing">
            {slides.map((slide, i) => (
              <div
                key={`${slide.title}-${i}`}
                className="relative flex-none px-3 basis-[85%] md:basis-[60%] lg:basis-[45%] xl:basis-[35%]"
              >
                <div className="group relative h-100 w-full overflow-hidden rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 sm:h-120">
                  {/* The Parallax Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="parallax-bg absolute inset-0 left-[-15%] h-full w-[130%] max-w-none object-cover will-change-transform"
                  />

                  {/* Premium Gradients */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 transition-all duration-500 group-hover:ring-primary/50" />

                  {/* Text Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <span className="mb-3 inline-block h-1 w-10 rounded-full bg-primary shadow-md shadow-primary/50" />
                    <h3 className="font-headline-lg text-headline-lg text-white mb-1">
                      {slide.title}
                    </h3>
                    <p className="font-body-md text-body-md text-white/80 max-w-sm">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
