import { Button } from "@/components/marketplace/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/marketplace/ui/card";
import { Input } from "@/components/marketplace/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/marketplace/ui/select";
import { TabsContent } from "@/components/marketplace/ui/tabs";
import type { MembershipPlan } from "@/types/marketplace";
import { CreditCard, Loader2 } from "lucide-react";

export function SubscriptionTab({
  tokenSymbol,
  subOwner,
  planItems,
  setSelectedPlanIndex,
  setSelectedDurationIndex,
  activePlans,
  durationItems,
  selectedPlan,
  selectedDuration,
  subscribing,
  account,
  handlePaySubscription,
}: {
  tokenSymbol: string;
  subOwner: string;
  planItems: { label: string; value: string }[];
  setSelectedPlanIndex: (value: string) => void;
  setSelectedDurationIndex: (value: string) => void;
  activePlans: MembershipPlan[];
  durationItems: { value: string; label: string }[];
  selectedPlan: MembershipPlan | undefined;
  selectedDuration: MembershipPlan["durations"][number] | undefined;
  subscribing: boolean;
  account: string;
  handlePaySubscription: () => Promise<void>;
}) {
  return (
    <TabsContent value="subscription" className="p-6">
      <div className="mx-auto max-w-xl py-4">
        <Card className="border-border bg-muted/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Pay Gym Subscription</CardTitle>
                <CardDescription className="text-xs">
                  Transfer {tokenSymbol} tokens to your gym owner to activate or
                  renew membership.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Gym Owner Address
              </label>
              <Input
                value={subOwner}
                placeholder="0x..."
                readOnly
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                The registered Ethereum address of your gym or fitness club.
              </p>
            </div>

            {/* Plans */}
            <Select
              items={planItems}
              onValueChange={(value: string | null) => {
                setSelectedPlanIndex(value ?? "0");
                setSelectedDurationIndex("0");
              }}
            >
              <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Plans</SelectLabel>

                  {activePlans.map((plan, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {plan.planName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Durations */}
            <Select
              items={durationItems}
              disabled={!selectedPlan || selectedPlan.durations.length === 0}
              onValueChange={(value: string | null) =>
                setSelectedDurationIndex(value ?? "0")
              }
            >
              <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Durations</SelectLabel>

                  {selectedPlan?.durations.map((duration, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {duration.durationDays} Days - {duration.priceByG} G
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {selectedDuration && (
              <p className="text-xl font-bold">
                Total: {selectedDuration.priceByG.toString()} G
              </p>
            )}

            <Button
              variant="default"
              className="w-full mt-2"
              disabled={subscribing || !account}
              onClick={() => {
                void handlePaySubscription();
              }}
            >
              {subscribing ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Confirming Subscription…
                </>
              ) : (
                <>
                  <CreditCard className="size-4 mr-2" />
                  Pay Subscription Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
