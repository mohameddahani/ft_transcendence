import {
  CircleCheck,
  Dumbbell,
  Swords,
  Waves,
  Flower2,
  Footprints,
  Trophy,
  Bike,
  Zap,
} from "lucide-react";
import { Button } from "../ui/button";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useCallback } from "react";

const categories = [
  { label: "CrossFit", icon: Dumbbell },
  { label: "Martial Arts", icon: Swords },
  { label: "Aquatic", icon: Waves },
  { label: "Yoga Flow", icon: Flower2 },
  { label: "Run Club", icon: Footprints },
  { label: "Boxing", icon: Trophy },
  { label: "Cycling", icon: Bike },
  { label: "HIIT", icon: Zap },
];

const Hero = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "start",
      skipSnaps: true,
    },
    [
      AutoScroll({
        speed: 0.8,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  const onMouseEnter = useCallback(() => {
    const autoScroll = emblaApi?.plugins()?.autoScroll;
    autoScroll?.stop();
  }, [emblaApi]);

  const onMouseLeave = useCallback(() => {
    const autoScroll = emblaApi?.plugins()?.autoScroll;
    autoScroll?.play();
  }, [emblaApi]);

  const items = [...categories, ...categories, ...categories];
  return (
    <section className="py-15">
      <span className="block mx-auto w-fit bg-primary/10 text-primary rounded-full mb-15 px-4 py-0.5 text-sm font-semibold">
        REVOLUTIONIZING GYM MANAGEMENT
      </span>
      <h1 className="text-center text-6xl font-bold mb-10 max-w-4xl mx-auto">
        Run your gym on{" "}
        <span className="gradient-text text-primary">autopilot</span>
      </h1>
      <p className="mx-auto text-center max-w-2xl text-lg font-light mb-10 text-muted-foreground">
        The premium management platform for elite fitness centers. Automate
        memberships, payments, and insights in one unified dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-md mb-xl justify-center gap-4 mb-7">
        <Button
          size={"lg"}
          className={
            "shadow-lg rounded-full text-md px-7 py-5 btn-primary-gradient"
          }
        >
          Start Free Trial
        </Button>
        <Button
          size={"lg"}
          variant={"outline"}
          className={"shadow-lg rounded-full text-md px-7 py-5"}
        >
          Contact Us
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2 opacity-80 mb-18">
        <CircleCheck className="text-secondary-green" size={18} />
        <span className="text-sm">No credit card required</span>
      </div>

      <div className="w-full bg-secondary rounded-xl border border-outline-variant shadow-2xl overflow-hidden p-2 relative">
        <div className="flex items-center gap-x-1 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <div className="ml-sm text-on-surface-variant font-label-sm text-[10px] uppercase tracking-widest">
            Dashboard Preview
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="GymFlow Dashboard Mockup"
          className="w-full h-auto rounded-lg"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkZD5RMCf5Yk5nyeMtB1sfcbYwN-LhgJIhFBokM8BU20Rcfvcu8WJFDMJXEZd_4P8I6ZgpiFjW-OYVWQ1_Ur3TF965nmrspgwNdjgR99oUzLEBScJEG9DaauCf954aa2iNdWTqsQj4KCyfCpZQXs024Iox5GZwQwZmajCChkRWP7dD1zqsRKI2tzZ3mFi6cr-NN-TlVZS1PwnpvnNc5dVOG3TPBimwUdAxV_zfkYyISKQTICzzNpE_"
        />
      </div>

      <div className="mt-10 flex items-center justify-center gap-x-5 text-sm">
        <AvatarGroup className="grayscale">
          <Avatar>
            <AvatarImage
              src="https://github.com/mohameddahani.png"
              alt="@shadcn"
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              src="https://github.com/mohameddahani.png"
              alt="@maxleiter"
            />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              src="https://github.com/mohameddahani.png"
              alt="@evilrabbit"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3K</AvatarGroupCount>
        </AvatarGroup>
        <p className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-full">
          Trusted By +3K Fitness Hubs
        </p>
      </div>

      <section className="w-full mt-10">
        <p className="mb-6 text-center text-xs font-semibold tracking-widest text-violet-600 dark:text-violet-400">
          BUILT FOR GROWING FITNESS BUSINESSES
        </p>

        <div
          className="relative w-full overflow-hidden"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-white to-transparent dark:from-neutral-950 sm:w-32"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-white to-transparent dark:from-neutral-950 sm:w-32"
            aria-hidden="true"
          />

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex cursor-grab select-none active:cursor-grabbing">
              {items.map(({ label, icon: Icon }, index) => (
                <div
                  key={`${label}-${index}`}
                  className="flex-none px-3"
                  style={{ flex: "0 0 auto" }}
                >
                  <div className="group flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 shadow-sm transition-all duration-200 hover:border-violet-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                    <Icon
                      size={16}
                      strokeWidth={2}
                      className="text-neutral-400 transition-colors duration-200 group-hover:text-violet-500 dark:text-neutral-500"
                    />
                    <span className="whitespace-nowrap text-sm font-medium italic text-neutral-500 transition-colors duration-200 group-hover:text-neutral-800 dark:text-neutral-400 dark:group-hover:text-neutral-200">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Hero;
