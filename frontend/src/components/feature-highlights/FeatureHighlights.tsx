import { CircleCheck } from "lucide-react";

const FeatureHighlights = () => {
  return (
    <section className="grid grid-cols-1 gap-20">
      {/* <!-- Feature 1 --> */}
      <div className="grid grid-cols-2 items-center gap-10 max-lg:grid-cols-1">
        <div>
          <span className="text-primary mb-2.5 font-medium block">
            EFFORTLESS OPERATIONS
          </span>
          <h2 className="text-4xl font-semibold">Run your gym on autopilot</h2>
          <p className="my-4 leading-relaxed text-lg font-light">
            Stop wasting hours on manual spreadsheets. Our intelligent system
            handles Circle-ins, attendance tracking, and capacity management
            automatically.
          </p>
          <ul className="flex flex-col justify-between gap-y-4">
            <li className="flex gap-sm items-start gap-x-2">
              <CircleCheck className="text-primary" />
              <span className="font-body-md text-body-md text-on-surface">
                Automated attendance logging
              </span>
            </li>
            <li className="flex gap-sm items-start gap-x-2">
              <CircleCheck className="text-primary" />
              <span className="font-body-md text-body-md text-on-surface">
                Smart capacity alerts
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Operations Dashboard"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlRUpge1GPJgffqE4RvvwrF02yVB2r3xK6x_lnPFL2-y97nGHW_9zYFWkPZxQ1nYhd4BLT8T2jRU1jT2NcWzeOxPHc2AyCUDe-sjSEfCs5C6QJJg648Fu5C_tqqq373nAa2cQndkjpd2oln8bVTl39YaZfmzBfIPNvQBqVi0iCN_PTo3fNwKcUHEK_5fxMPqQsQtHwzitZASuAHCUVng6jH-tyAQUD7ZhC51RwKptEzu0qtZRwtwcc"
          />
        </div>
      </div>

      {/* Feature 2 */}
      <div className="grid grid-cols-2 items-center gap-10 max-lg:grid-cols-1">
        <div className="order-2 max-lg:order-1">
          <span className="text-secondary-green mb-2.5 font-medium block">
            FINANCIAL VELOCITY
          </span>
          <h2 className="text-4xl font-semibold">
            Never chase a payment again
          </h2>
          <p className="my-4 leading-relaxed text-lg font-light">
            Set up recurring billing and let GymFlow do the rest. Our integrated
            WhatsApp automation sends friendly reminders for failed payments
            instantly.
          </p>
          <div className="bg-secondary p-7 rounded-xl flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white">
              {/* <MessageSquareText /> */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/whatsapp.svg" alt="" />
            </div>
            <div>
              <div className="text-md font-semibold">WhatsApp Automation</div>
              <div className="text-sm font-light">
                {'"'}Hi John, your payment is due. Click here...{'"'}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border w-full h-full order-1 max-lg:order-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Payments Interface"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnlSn02nRNgpEaxEjCtBpHGedTq9UVQ2k5I76xcJO_hkmjz93ycBuPbSLJFFHJV5n4fvYSB0VjdZKxkVw1G_FNvFTfDaZ8jHKCXH4eXsF69moHsMiMt_RWzNztNjjOa9qiElsufjcJZy48ivQ64XJWqtj7i34XdaZ8NQvg6wKtrkXKXR7rMXArFNX9YPPYzNfA-2fo5hLJE02qbxJlEKgXpSPaGfhMMfvYlCGucXqdNKRXTmIiWfWE"
          />
        </div>
      </div>

      {/* Feature 3 */}
      <div className="grid grid-cols-2 items-center gap-10 max-lg:grid-cols-1">
        <div>
          <span className="text-tertiary mb-2.5 font-medium block">
            AI ANALYTICS
          </span>
          <h2 className="text-4xl font-semibold">Ask your gym anything</h2>
          <p className="my-4 leading-relaxed text-lg font-light">
            Our AI Assistant analyzes your data in real-time. Just ask {'"'}Who
            is at risk of churning?{'"'} or {'"'}What{"'"}s my busiest hour?
            {'"'} and get instant answers.
          </p>
          <div className="flex items-center justify-cente max-xl:justify-center gap-4 flex-wrap">
            <span className="px-4 py-sm bg-tertiary/10 text-tertiary rounded-full border border-tertiary/20">
              Churn Prediction
            </span>
            <span className="px-4 py-sm bg-tertiary/10 text-tertiary rounded-full border border-tertiary/20">
              Revenue Forecasting
            </span>
            <span className="px-4 py-sm bg-tertiary/10 text-tertiary rounded-full border border-tertiary/20">
              Staff Performance
            </span>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg border w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="AI Insights Assistant"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_NRbJFp-0nBQM1v4WKzeiyXHMQFawaI79Mdm5ycSDr-JZpeOpZ55HrJemmFr8By-xGk-UGTiVhOU7HH3k-DuEwBq3omg9JD06xRmdzPSQqdnN2r28I6XdQZjQq75UiHepz-cfo0mj3mjKynK7dKfQM95Clcu4dKSzQOhD7qJ_bSLmUy7tqRB_u8pVXMDB6RYjsRxFQaFvt3tNZwcb0yo9gGLMOXn9Ti2tn8mjQlI5KgbbvX8qZE2W"
          />
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
