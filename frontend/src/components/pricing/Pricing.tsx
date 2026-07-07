import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // shadcn's standard utility for merging classes

// 1. Separate your Data from your UI
const pricingPlans = [
  {
    name: "Starter",
    price: "49",
    features: [
      "Up to 100 members",
      "Basic reporting",
      "Email support",
    ],
    buttonText: "Choose Starter",
    isPopular: false,
  },
  {
    name: "Growth",
    price: "149",
    features: [
      "Unlimited members",
      "Full WhatsApp automation",
      "AI Assistant tools",
      "Priority chat support",
    ],
    buttonText: "Choose Growth",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Multiple locations",
      "Dedicated account manager",
      "Custom API integrations",
    ],
    buttonText: "Contact Sales",
    isPopular: false,
  },
];

const Pricing = () => {
  return (
    <section>
      <div className="text-center">
        <h2 className="text-4xl font-semibold">
          Scale your <span className="text-primary">Empire</span>
        </h2>
        <p className="my-4 leading-relaxed text-lg font-light text-muted-foreground">
          Transparent plans designed to grow with your business.
        </p>
      </div>

      <div className="mt-15 grid grid-cols-3 gap-10 max-lg:grid-cols-2 max-sm:grid-cols-1 items-stretch">
        {/* 2. Map over the actual data, not a dummy array */}
        {pricingPlans.map((plan, index) => (
          <Card
            key={index}
            // 3. Use cn() to cleanly handle conditional styling
            className={cn(
              "relative flex flex-col shadow-2xl [--card-spacing:--spacing(8)] transition-all",
              plan.isPopular 
                ? "bg-primary text-white scale-105 border-primary z-10" 
                : "bg-card"
            )}
          >
            {/* 4. Conditionally render the popular badge */}
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary-green px-4 py-1 text-xs font-bold tracking-widest text-white rounded-full uppercase shadow-md">
                Most Popular
              </div>
            )}

            <CardHeader>
              <CardTitle
                className={cn(
                  "text-lg font-semibold",
                  !plan.isPopular && "text-muted-foreground"
                )}
              >
                {plan.name}
              </CardTitle>
              <CardDescription
                className={cn(
                  "text-4xl font-bold mt-2",
                  plan.isPopular ? "text-white" : "text-foreground"
                )}
              >
                {plan.price !== "Custom" ? `$${plan.price}` : plan.price}
                
                {plan.price !== "Custom" && (
                  <span
                    className={cn(
                      "text-2xl font-light ml-1",
                      !plan.isPopular && "text-muted-foreground"
                    )}
                  >
                    /mo
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            {/* flex-1 pushes the footer to the bottom if cards are different heights */}
            <CardContent className="flex-1 mt-4">
              <ul className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-4">
                    <Check
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        plan.isPopular ? "text-white" : "text-primary"
                      )}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="border-none bg-transparent pt-6 mt-auto">
              <Button
                variant={plan.isPopular ? "default" : "outline"}
                className={cn(
                  "w-full py-6 text-md font-semibold cursor-pointer transition-all",
                  plan.isPopular && "btn-primary-gradient border border-white/20 hover:bg-white/10"
                )}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Pricing;