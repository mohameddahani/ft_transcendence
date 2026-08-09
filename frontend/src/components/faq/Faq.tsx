import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    value: "migration",
    trigger: "How easy is it to migrate from my current software?",
    content:
      "We handle the entire data migration for you. Our team will import your member records, payment history, and plans within 24 hours of onboarding.",
  },
  {
    value: "locations",
    trigger: "Can I manage multiple gym locations?",
    content:
      "Yes, GymFlow Enterprise is built specifically for franchises and multi-location groups, providing a global view of all your centers.",
  },
  {
    value: "hardware",
    trigger: "Do I need to buy any special hardware?",
    content:
      "No special hardware is required. GymFlow runs on any tablet, computer, or smartphone. We also support standard QR and RFID scanners.",
  },
];

const Faq = () => {
  return (
    <section className="my-30 w-full bg-secondary p-10">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-semibold">Frequently Asked Questions</h2>
      </div>
      <div className="flex justify-center items-center">
        <Accordion multiple className="max-w-4xl" defaultValue={["migration"]}>
          {items.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger className={"text-lg font-medium"}>
                {item.trigger}
              </AccordionTrigger>
              <AccordionContent className="text-[16px] font-light text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default Faq;
