import {
  Users,
  CreditCard,
  HandCoins,
  MessageCircle,
  LayoutDashboard,
  BotMessageSquare,
  LogIn,
  ChartNoAxesCombined,
} from "lucide-react";

const GridItems = () => {
  return (
    <section className="mt-20 py-10">
      <div>
        <div className="text-center mb-10">
          <h2 className="text-4xl font-semibold">
            Everything you need to scale
          </h2>
          <p className="my-4 leading-relaxed text-lg font-light">
            Consolidate your tech stack into one powerful, high-performance
            platform designed for growth.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <Users
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">Member Management</h4>
            <p className="font-light">
              Profile tracking, attendance, and member engagement tools.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <CreditCard
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">Dynamic Plans</h4>
            <p className="font-light">
              Create flexible membership tiers with ease.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <HandCoins
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">Global Payments</h4>
            <p className="font-light">
              Secure, automated recurring billing across all regions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <MessageCircle
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">WhatsApp Integration</h4>
            <p className="font-light">
              Direct member communication where they already are.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <LayoutDashboard
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">Unified Dashboard</h4>
            <p className="font-light">
              KPI tracking and real-time business health metrics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <BotMessageSquare
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">AI Assistant</h4>
            <p className="font-light">
              Predictive analytics and automated insights for owners.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <LogIn
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">Member Portal</h4>
            <p className="font-light">
              Self-service dashboard for memberships and bookings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-secondary border border-outline-variant hover:shadow-lg transition-all group">
            <ChartNoAxesCombined
              size={30}
              className="text-primary mb-5 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold mb-1.5">Advanced Reports</h4>
            <p className="font-light">
              Exportable, drill-down data for financial planning.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GridItems;
