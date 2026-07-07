import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Testimonials = () => {
  return (
    <section className="my-15 w-full">
      <h2 className="text-4xl font-semibold text-center">
        Loved by gym owners everywhere
      </h2>
      <div className="my-12 text-center grid grid-cols-3 items-center gap-5 max-md:grid-cols-2">
        <div className="border rounded-2xl p-5 bg-secondary flex items-center justify-center flex-col gap-1">
          <span className="text-2xl font-extrabold text-primary">200+</span>
          <p className="font-medium text-sm">PARTNER GYMS</p>
        </div>
        <div className="border rounded-2xl p-5 bg-secondary flex items-center justify-center flex-col gap-1">
          <span className="text-2xl font-extrabold text-primary">50K+</span>
          <p className="font-medium text-sm">ACTIVE MEMBERS</p>
        </div>
        <div className="border rounded-2xl p-5 bg-secondary flex items-center justify-center flex-col gap-1">
          <span className="text-2xl font-extrabold text-primary">$2M+</span>
          <p className="font-medium text-sm">MONTHLY PAYMENTS</p>
        </div>
      </div>

      {/* Added mx-auto here to keep the carousel perfectly centered */}
      <div className="w-full max-w-6xl mx-auto px-12">
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem
                key={index}
                // 1. Keep flex here so the item can stretch
                className="basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4 flex"
              >
                <div className="p-1 w-full flex">
                  {/* 2. MOVED bg-secondary HERE. Now the entire card is gray, not just the inside */}
                  <Card className="w-full flex flex-col overflow-hidden bg-secondary">
                    {/* 3. REMOVED aspect-square. Added flex-1 to push the name/title to the bottom */}
                    <CardContent className="flex flex-1 flex-col items-center justify-center text-center p-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Gym Owner testimonial"
                        className="w-20 h-20 rounded-full mb-6 object-cover shadow-md"
                        src="https://github.com/mohameddahani.png"
                      />
                      <p className="italic mb-8 leading-relaxed font-medium text-base text-muted-foreground">
                        {'"'}GymFlow completely transformed how we handle
                        memberships. We{"'"}ve seen a 30% reduction in late
                        payments thanks to the WhatsApp automation.{'"'}
                      </p>

                      {/* Wrapping the author info in mt-auto guarantees it aligns at the bottom of the card */}
                      <div className="mt-auto">
                        <div className="text-primary font-bold">
                          Marcus Thompson
                        </div>
                        <div className="text-sm opacity-80">
                          Owner, Iron Peak Fitness
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
