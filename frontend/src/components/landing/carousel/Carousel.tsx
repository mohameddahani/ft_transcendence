"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Dumbbell,
  Feather,
  Flag,
  Goal,
  HandFist,
  Medal,
  Pause,
  Play,
  Swords,
  Target,
  Trophy,
  Users,
  Waves,
} from "lucide-react";

import { ProgressiveBlur } from "../motion-primitives/progressive-blur";
import { Container, SectionHeading } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/motion";

type CarouselApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>;

const categories = [
  { label: "Fitness clubs", icon: Dumbbell },
  { label: "Boxing", icon: Trophy },
  { label: "Swimming", icon: Waves },
  { label: "Tennis", icon: Target },
  { label: "Badminton", icon: Feather },
  { label: "Golf", icon: Flag },
  { label: "Basketball", icon: Medal },
  { label: "Football", icon: Goal },
  { label: "Judo", icon: Swords },
  { label: "Grappling", icon: HandFist },
  { label: "Cycling", icon: Bike },
];

const sports = [
  {
    title: "Built on discipline.",
    category: "Boxing",
    description: "From the first jab to fight night.",
    image: "/landing/boxing.jpg",
    alt: "A boxer in a white T-shirt punching a heavy bag",
    icon: Trophy,
  },
  {
    title: "Find your flow.",
    category: "Swimming",
    description: "From the first length to the next personal best.",
    image: "/landing/swimming.jpg",
    alt: "A swimmer doing butterfly in a pool lane",
    icon: Waves,
  },
  {
    title: "Every serve counts.",
    category: "Tennis",
    description: "Courts, coaches and members in one schedule.",
    image: "/landing/tennis.jpg",
    alt: "A tennis player tossing the ball for a serve",
    icon: Target,
  },
  {
    title: "Quick on your feet.",
    category: "Badminton",
    description: "Fill every court, every session.",
    image: "/landing/badminton.jpg",
    alt: "A badminton player jumping for a smash on an indoor court",
    icon: Feather,
  },
  {
    title: "Play your best round.",
    category: "Golf",
    description: "Members, lessons and tee times, all in one place.",
    image: "/landing/golf.jpg",
    alt: "A golfer swinging a driver on a green course",
    icon: Flag,
  },
  {
    title: "Made for the team.",
    category: "Basketball",
    description: "Squads, sessions and court time in one place.",
    image: "/landing/basketball.jpg",
    alt: "Basketball players on an indoor court",
    icon: Medal,
  },
  {
    title: "Played together.",
    category: "Football",
    description: "From training sessions to match day.",
    image: "/landing/football.jpg",
    alt: "Players in a five-a-side football game on an indoor pitch",
    icon: Goal,
  },
  {
    title: "Respect on the mat.",
    category: "Judo",
    description: "Belts, classes and progress, all tracked.",
    image: "/landing/judo.jpg",
    alt: "Two judoka in blue and white uniforms during a throw",
    icon: Swords,
  },
  {
    title: "Train hard, train smart.",
    category: "Grappling",
    description: "Sessions and members, ready before the warm-up.",
    image: "/landing/grappling.jpg",
    alt: "Two men grappling during a training session",
    icon: HandFist,
  },
  {
    title: "Go further, together.",
    category: "Cycling",
    description: "Group rides and members in one place.",
    image: "/landing/cycling.jpg",
    alt: "Three mountain bikers looking over a valley",
    icon: Bike,
  },
  {
    title: "Learn as a group.",
    category: "Classes",
    description: "Every class, every attendee, every week.",
    image: "/landing/class.jpg",
    alt: "A martial arts class sitting on the mats",
    icon: Users,
  },
];

const categoryItems = [...categories, ...categories, ...categories];
const sportItems = [...sports, ...sports];

const controlClassName =
  "inline-flex size-11 shrink-0 items-center justify-center " +
  "rounded-full border border-border bg-card text-foreground shadow-xs " +
  "transition-[background-color,border-color,color,transform] duration-200 " +
  "hover:border-primary/40 hover:bg-selected hover:text-selected-foreground " +
  "active:scale-95 motion-reduce:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background disabled:opacity-40 " +
  "disabled:pointer-events-none";

/**
 * Blurs the content near each edge and gently blends it
 * into the section background.
 */
function EdgeBlur({ images = false }: { images?: boolean }) {
  return (
    <>
      {(["left", "right"] as const).map((direction) => (
        <div
          key={direction}
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-y-0 z-20",
            direction === "left" ? "left-0" : "right-0",
            // Narrow on phones so captions stay readable.
            images ? "w-5 sm:w-14 lg:w-24" : "w-8 sm:w-20 lg:w-32",
          ].join(" ")}
        >
          <ProgressiveBlur
            className="absolute inset-0 h-full w-full"
            direction={direction}
            blurLayers={6}
            blurIntensity={images ? 1 : 0.8}
          />

          <div
            className={[
              "absolute inset-0",
              direction === "left" ? "bg-linear-to-r" : "bg-linear-to-l",
              "from-background via-background/20 to-transparent",
            ].join(" ")}
          />
        </div>
      ))}
    </>
  );
}

/**
 * Keeps the pause button authoritative, including after
 * hover, dragging, or an Embla reinitialization.
 */
function useScrollPlayback(
  api: CarouselApi | undefined,
  paused: boolean,
  reducedMotion: boolean | null,
) {
  useEffect(() => {
    if (!api) return;

    const plugin = api.plugins().autoScroll;

    if (!plugin) return;

    const shouldStop = paused || reducedMotion !== false;

    const enforcePause = () => {
      if (shouldStop) plugin.stop();
    };

    const synchronize = () => {
      if (shouldStop) {
        plugin.stop();
      } else {
        plugin.play();
      }
    };

    api.on("autoScroll:play", enforcePause);
    api.on("reInit", synchronize);

    synchronize();

    return () => {
      api.off("autoScroll:play", enforcePause);
      api.off("reInit", synchronize);
      plugin.stop();
    };
  }, [api, paused, reducedMotion]);
}

export default function Carousel() {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const [categoriesRef, categoriesApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "start",
      skipSnaps: true,
    },
    [
      AutoScroll({
        speed: 0.4,
        startDelay: 500,
        // Opposite direction keeps the two ribbons visually independent.
        direction: "backward",
        playOnInit: false,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  const [imagesRef, imagesApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "center",
      duration: 35,
    },
    [
      AutoScroll({
        speed: 0.6,
        startDelay: 500,
        playOnInit: false,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  useScrollPlayback(categoriesApi, paused, reducedMotion);
  useScrollPlayback(imagesApi, paused, reducedMotion);

  const imageNodes = useRef<(HTMLDivElement | null)[]>([]);

  const updateParallax = useCallback(
    (api: CarouselApi, eventName?: string) => {
      if (reducedMotion !== false) {
        imageNodes.current.forEach((node) => {
          if (node) node.style.transform = "";
        });
        return;
      }

      const engine = api.internalEngine();
      const progress = api.scrollProgress();
      const visibleSlides = new Set(api.slidesInView());

      api.scrollSnapList().forEach((snap, snapIndex) => {
        const slideIndexes = engine.slideRegistry[snapIndex];

        slideIndexes?.forEach((slideIndex) => {
          if (eventName === "scroll" && !visibleSlides.has(slideIndex)) {
            return;
          }

          const node = imageNodes.current[slideIndex];

          if (!node) return;

          let difference = snap - progress;

          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((point) => {
              const target = point.target();

              if (point.index !== slideIndex || target === 0) {
                return;
              }

              difference =
                target < 0 ? snap - (1 + progress) : snap + (1 - progress);
            });
          }

          // A restrained parallax shift within the image overscan.
          const offset = Math.max(-7, Math.min(7, difference * -24));

          node.style.transform = `translate3d(${offset}%, 0, 0)`;
        });
      });
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (!imagesApi) return;

    const initialize = (api: CarouselApi) => {
      imageNodes.current = api
        .slideNodes()
        .map((slide) =>
          slide.querySelector<HTMLDivElement>("[data-parallax-layer]"),
        );

      updateParallax(api);
    };

    initialize(imagesApi);

    imagesApi.on("reInit", initialize);
    imagesApi.on("scroll", updateParallax);
    imagesApi.on("settle", updateParallax);

    return () => {
      imagesApi.off("reInit", initialize);
      imagesApi.off("scroll", updateParallax);
      imagesApi.off("settle", updateParallax);
    };
  }, [imagesApi, updateParallax]);

  const navigate = (direction: "previous" | "next") => {
    if (!imagesApi) return;

    // Manual navigation pauses continuous movement.
    setPaused(true);
    imagesApi.plugins().autoScroll?.stop();

    if (direction === "previous") {
      imagesApi.scrollPrev(Boolean(reducedMotion));
    } else {
      imagesApi.scrollNext(Boolean(reducedMotion));
    }
  };

  return (
    <section
      id="sports"
      aria-labelledby="sports-title"
      className="relative w-full min-w-0 overflow-hidden py-16 sm:py-24"
    >
      {/* Section introduction */}
      <Container className="mb-10 sm:mb-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionHeading
              id="sports-title"
              eyebrow="Built around your club"
              icon={Trophy}
              title={
                <>
                  Different sports.
                  <br />
                  <span className="text-muted-foreground">
                    One connected club.
                  </span>
                </>
              }
              description="From martial arts schools to swimming clubs, bring your team, your members and your daily operations together."
            />
          </Reveal>

          {/* Working carousel controls */}
          <Reveal delay={0.08} className="flex items-center gap-2">
            {!reducedMotion && (
              <button
                type="button"
                className={controlClassName}
                onClick={() => setPaused((value) => !value)}
                aria-pressed={paused}
                aria-label={
                  paused
                    ? "Resume automatic scrolling"
                    : "Pause automatic scrolling"
                }
                title={paused ? "Resume scrolling" : "Pause scrolling"}
              >
                {paused ? (
                  <Play size={16} aria-hidden="true" />
                ) : (
                  <Pause size={16} aria-hidden="true" />
                )}
              </button>
            )}

            {!reducedMotion && (
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
            )}

            <button
              type="button"
              className={controlClassName}
              disabled={!imagesApi}
              onClick={() => navigate("previous")}
              aria-label="Previous sport"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={controlClassName}
              disabled={!imagesApi}
              onClick={() => navigate("next")}
              aria-label="Next sport"
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </Reveal>
        </div>
      </Container>

      {/* Sports category ribbon */}
      <div className="relative isolate mb-6 w-full">
        <div
          ref={categoriesRef}
          role="list"
          aria-label="Sports organizations we support"
          className="touch-pan-y overflow-hidden"
        >
          <div className="flex cursor-grab select-none py-3 active:cursor-grabbing">
            {categoryItems.map(({ label, icon: Icon }, index) => (
              <div
                key={`${label}-${index}`}
                role={index < categories.length ? "listitem" : undefined}
                className="shrink-0 px-1.5 sm:px-2"
                aria-hidden={index >= categories.length ? true : undefined}
              >
                <div className="group flex items-center gap-3 rounded-full border border-border bg-card py-2 pr-5 pl-2 shadow-xs transition-colors duration-200 hover:border-selected hover:bg-popover">
                  <span className="flex size-8 items-center justify-center rounded-full bg-selected text-selected-foreground">
                    <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                  </span>

                  <span className="whitespace-nowrap text-sm font-medium text-foreground/85">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <EdgeBlur />
      </div>

      {/* Photography carousel */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Explore sports clubs"
        className="relative isolate w-full"
      >
        <div ref={imagesRef} className="touch-pan-y overflow-hidden">
          <div className="flex cursor-grab select-none py-5 active:cursor-grabbing">
            {sportItems.map((sport, index) => {
              const Icon = sport.icon;

              return (
                <div
                  key={`${sport.category}-${index}`}
                  aria-hidden={index >= sports.length ? true : undefined}
                  className="min-w-0 shrink-0 grow-0 basis-[84%] px-2.5 sm:basis-[64%] sm:px-3 md:basis-[48%] lg:basis-[37%] xl:basis-[30%] 2xl:basis-[25%]"
                >
                  <article className="group relative h-[390px] overflow-hidden rounded-[24px] bg-neutral-900 shadow-lg shadow-black/10 sm:h-[460px] lg:h-[500px]">
                    {/* Parallax and hover transforms are separate. */}
                    <div
                      data-parallax-layer
                      className="pointer-events-none absolute inset-y-0 -left-[12%] w-[124%] will-change-transform motion-reduce:will-change-auto"
                    >
                      { }
                      <img
                        src={sport.image}
                        alt={sport.alt}
                        loading={index < 3 ? "eager" : "lazy"}
                        draggable={false}
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                      />
                    </div>

                    {/* Contrast for the category and caption */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent to-black/90"
                    />

                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent"
                    />

                    {/* Category label */}
                    <div className="absolute top-5 left-5 sm:top-6 sm:left-6">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-sm">
                        <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                        {sport.category}
                      </span>
                    </div>

                    {/* Caption */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                      <div
                        aria-hidden="true"
                        className="mb-5 h-px w-10 bg-white/60 transition-[width] duration-300 group-hover:w-16 motion-reduce:transition-none"
                      />

                      <h3 className="max-w-[14ch] text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-[2.1rem]">
                        {sport.title}
                      </h3>

                      <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-white/85">
                        {sport.description}
                      </p>
                    </div>

                    {/* Subtle frame */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/15 ring-inset"
                    />
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progressive blur on the image carousel too */}
        <EdgeBlur images />
      </div>

      <Container className="mt-6">
        <p className="text-center text-sm text-muted-foreground">
          Drag to explore, or use the arrows above.
        </p>
      </Container>
    </section>
  );
}
