import { Button } from "../ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

import { TextLoop } from "../motion-primitives/text-loop";
import { CircleCheck } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-15">
      <span className="block mx-auto w-fit bg-primary/10 text-primary rounded-full mb-15 px-4 py-0.5 text-sm font-semibold">
        REVOLUTIONIZING SPORTS CLUB MANAGEMENT
      </span>
      <div className="mb-10 flex justify-center px-4">
        <TextLoop
          interval={4}
          mode="wait"
          className="overflow-visible"
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          variants={{
            initial: {
              opacity: 0,
              y: 16,
              filter: "blur(6px)",
            },
            animate: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            },
            exit: {
              opacity: 0,
              y: -12,
              filter: "blur(4px)",
            },
          }}
        >
          <h1 className="w-[min(90vw,56rem)] py-2 text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Run your club
            <br className="sm:hidden" />
            <span className="gradient-text text-primary"> smarter.</span>
          </h1>

          <h1 className="w-[min(90vw,56rem)] py-2 text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Make every visit
            <br className="sm:hidden" />
            <span className="gradient-text text-primary"> better.</span>
          </h1>
        </TextLoop>
      </div>
      <p className="mx-auto text-center max-w-3xl text-lg font-light mb-10 text-muted-foreground">
        Manage members, memberships, schedules, and payment records in one
        intuitive platform. Give your front desk the tools to simplify check-ins
        and your members a dedicated space to book visits and access their QR
        pass—with an AI assistant by your side.
      </p>
      {/* <div className="flex flex-col sm:flex-row gap-md mb-xl justify-center gap-4 mb-7">
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
      </div> */}
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
          alt="Dashboard Mockup"
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
      </section>
    </section>
  );
};

export default Hero;
