import { Check, MessageSquare } from "lucide-react";

const FeatureHighlights = () => {
  return (
    <section className="py-3xl space-y-3xl" id="features">
      <div className="max-w-container-max mx-auto px-lg grid md:grid-cols-2 gap-2xl items-center">
        <div>
          <span className="text-primary font-label-md text-label-md mb-md block">
            EFFORTLESS OPERATIONS
          </span>
          <h2 className="font-headline-lg text-headline-lg mb-lg">
            Run your gym on autopilot
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-xl leading-relaxed">
            Stop wasting hours on manual spreadsheets. Our intelligent system
            handles check-ins, attendance tracking, and capacity management
            automatically.
          </p>
          <ul className="space-y-md">
            <li className="flex gap-sm items-start">
              <Check className="w-6 h-6 text-primary shrink-0" />
              <span className="font-body-md text-body-md text-on-surface">
                Automated attendance logging
              </span>
            </li>
            <li className="flex gap-sm items-start">
              <Check className="w-6 h-6 text-primary shrink-0" />
              <span className="font-body-md text-body-md text-on-surface">
                Smart capacity alerts
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border border-outline-variant">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Operations Dashboard"
            className="w-full"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlRUpge1GPJgffqE4RvvwrF02yVB2r3xK6x_lnPFL2-y97nGHW_9zYFWkPZxQ1nYhd4BLT8T2jRU1jT2NcWzeOxPHc2AyCUDe-sjSEfCs5C6QJJg648Fu5C_tqqq373nAa2cQndkjpd2oln8bVTl39YaZfmzBfIPNvQBqVi0iCN_PTo3fNwKcUHEK_5fxMPqQsQtHwzitZASuAHCUVng6jH-tyAQUD7ZhC51RwKptEzu0qtZRwtwcc"
          />
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-lg grid md:grid-cols-2 gap-2xl items-center md:flex-row-reverse">
        <div className="md:order-2">
          <span className="text-secondary font-label-md text-label-md mb-md block">
            FINANCIAL VELOCITY
          </span>
          <h2 className="font-headline-lg text-headline-lg mb-lg">
            Never chase a payment again
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-xl leading-relaxed">
            Set up recurring billing and let GymFlow do the rest. Our integrated
            WhatsApp automation sends friendly reminders for failed payments
            instantly.
          </p>
          <div className="bg-surface-container p-lg rounded-xl glass-card flex gap-md items-center mb-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="font-label-md text-label-md">
                WhatsApp Automation
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">
                {"Hi John, your payment is due. Click here..."}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border border-outline-variant md:order-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Payments Interface"
            className="w-full"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnlSn02nRNgpEaxEjCtBpHGedTq9UVQ2k5I76xcJO_hkmjz93ycBuPbSLJFFHJV5n4fvYSB0VjdZKxkVw1G_FNvFTfDaZ8jHKCXH4eXsF69moHsMiMt_RWzNztNjjOa9qiElsufjcJZy48ivQ64XJWqtj7i34XdaZ8NQvg6wKtrkXKXR7rMXArFNX9YPPYzNfA-2fo5hLJE02qbxJlEKgXpSPaGfhMMfvYlCGucXqdNKRXTmIiWfWE"
          />
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-lg grid md:grid-cols-2 gap-2xl items-center">
        <div>
          <span className="text-tertiary font-label-md text-label-md mb-md block">
            AI ANALYTICS
          </span>
          <h2 className="font-headline-lg text-headline-lg mb-lg">
            Ask your gym anything
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-xl leading-relaxed">
            Our AI Assistant analyzes your data in real-time. Just ask {'"'}Who
            is at risk of churning?{'"'} or {'"'}What{"'"}s my busiest hour?
            {'"'} and get instant answers.
          </p>
          <div className="flex gap-md flex-wrap">
            <span className="px-md py-sm bg-tertiary/10 text-tertiary rounded-full font-label-sm text-label-sm border border-tertiary/20">
              Churn Prediction
            </span>
            <span className="px-md py-sm bg-tertiary/10 text-tertiary rounded-full font-label-sm text-label-sm border border-tertiary/20">
              Revenue Forecasting
            </span>
            <span className="px-md py-sm bg-tertiary/10 text-tertiary rounded-full font-label-sm text-label-sm border border-tertiary/20">
              Staff Performance
            </span>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border border-outline-variant">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="AI Insights Assistant"
            className="w-full"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_NRbJFp-0nBQM1v4WKzeiyXHMQFawaI79Mdm5ycSDr-JZpeOpZ55HrJemmFr8By-xGk-UGTiVhOU7HH3k-DuEwBq3omg9JD06xRmdzPSQqdnN2r28I6XdQZjQq75UiHepz-cfo0mj3mjKynK7dKfQM95Clcu4dKSzQOhD7qJ_bSLmUy7tqRB_u8pVXMDB6RYjsRxFQaFvt3tNZwcb0yo9gGLMOXn9Ti2tn8mjQlI5KgbbvX8qZE2W"
          />
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
