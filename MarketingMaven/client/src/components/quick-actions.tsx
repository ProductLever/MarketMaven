import { Bot, Upload, Settings, TrendingUp } from "lucide-react";

const quickActions = [
  {
    title: "Create AI Sequence",
    description: "Set up a new automated outreach campaign",
    icon: Bot,
    color: "bg-ibm-blue",
    href: "/ai-sequences",
  },
  {
    title: "Import Prospects",
    description: "Upload a CSV file of potential leads",
    icon: Upload,
    color: "bg-green-50",
    href: "/lead-pipeline",
  },
  {
    title: "Configure Scoring",
    description: "Adjust lead scoring criteria and weights",
    icon: Settings,
    color: "bg-yellow-30",
    href: "/lead-scoring",
  },
  {
    title: "Generate Report",
    description: "Create performance analytics report",
    icon: TrendingUp,
    color: "bg-red-60",
    href: "/analytics",
  },
];

export default function QuickActions() {
  return (
    <section className="bg-white rounded-lg border border-cool-gray-20 p-6">
      <h3 className="text-lg font-semibold text-cool-gray-80 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.title}
            className="p-4 border border-cool-gray-20 rounded-lg hover:border-ibm-blue hover:bg-ibm-blue hover:bg-opacity-5 transition-colors text-left"
            onClick={() => window.location.href = action.href}
          >
            <div className={`w-8 h-8 ${action.color} bg-opacity-10 rounded-lg flex items-center justify-center mb-3`}>
              <action.icon className={action.color.replace('bg-', 'text-')} size={18} />
            </div>
            <h4 className="font-semibold text-cool-gray-80 mb-1">{action.title}</h4>
            <p className="text-sm text-cool-gray-70">{action.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
