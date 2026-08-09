import { Button } from "@/components/ui/button";

const Cta = () => {
  return (
    <section>
      <div className="py-15 px-20 bg-primary rounded-3xl text-center text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-semibold">
            Ready to transform your gym?
          </h2>

          <p className="text-lg my-8 opacity-80 max-w-2xl mx-auto font-light">
            Join the hundreds of high-performance fitness centers already using
            GymFlow to power their business.
          </p>

          <div className="flex flex-col gap-5 sm:flex-row gap-md justify-center">
            <Button
              size={"lg"}
              className={
                "shadow-lg rounded-full text-md px-7 py-5 btn-secondary-gradient"
              }
            >
              Start Free Trial
            </Button>
            <Button
              variant={"outline"}
              size={"lg"}
              className={
                "shadow-lg rounded-full text-md px-7 py-5 btn-secondary-gradient"
              }
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
