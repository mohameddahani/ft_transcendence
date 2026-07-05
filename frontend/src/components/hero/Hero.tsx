import { CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";

const Hero = () => {
  {
    /* Hero Section */
  }
  return (
    <section className="py-15">
      <span className="block mx-auto w-fit bg-primary/10 text-primary rounded-full mb-15 px-4 text-sm font-semibold">
        REVOLUTIONIZING GYM MANAGEMENT
      </span>
      <h1 className="text-center text-6xl font-bold mb-10 max-w-4xl mx-auto">
        Run your gym on{" "}
        <span className="gradient-text text-primary">autopilot</span>
      </h1>
      <p className="mx-auto text-center max-w-2xl text-lg font-light mb-10">
        The premium management platform for elite fitness centers. Automate
        memberships, payments, and insights in one unified dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-md mb-xl justify-center gap-4">
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
      <div className="flex items-center gap-sm text-on-surface-variant opacity-80 mb-3xl">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-body-sm text-body-sm">
          No credit card required
        </span>
      </div>

      <div className="w-full max-w-5xl rounded-xl border border-outline-variant bg-surface shadow-2xl overflow-hidden p-xs relative">
        <div className="flex items-center gap-xs px-md py-sm border-b border-outline-variant bg-surface-container-low">
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
          className="w-full h-auto"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkZD5RMCf5Yk5nyeMtB1sfcbYwN-LhgJIhFBokM8BU20Rcfvcu8WJFDMJXEZd_4P8I6ZgpiFjW-OYVWQ1_Ur3TF965nmrspgwNdjgR99oUzLEBScJEG9DaauCf954aa2iNdWTqsQj4KCyfCpZQXs024Iox5GZwQwZmajCChkRWP7dD1zqsRKI2tzZ3mFi6cr-NN-TlVZS1PwnpvnNc5dVOG3TPBimwUdAxV_zfkYyISKQTICzzNpE_"
        />
      </div>
    </section>
  );
};

export default Hero;
