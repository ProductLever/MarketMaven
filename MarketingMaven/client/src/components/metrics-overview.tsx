import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Star, DollarSign } from "lucide-react";

interface DashboardMetrics {
  activeLeads: number;
  activeLeadsChange: string;
  responseRate: string;
  responseRateChange: string;
  qualifiedLeads: number;
  qualifiedLeadsChange: string;
  pipelineValue: string;
  pipelineValueChange: string;
}

export default function MetricsOverview() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-cool-gray-20 animate-pulse">
            <div className="h-4 bg-cool-gray-20 rounded mb-2"></div>
            <div className="h-8 bg-cool-gray-20 rounded mb-2"></div>
            <div className="h-3 bg-cool-gray-20 rounded w-20"></div>
          </div>
        ))}
      </section>
    );
  }

  if (!metrics) {
    return (
      <section className="bg-white p-6 rounded-lg border border-cool-gray-20">
        <p className="text-cool-gray-70">Failed to load metrics</p>
      </section>
    );
  }

  const metricCards = [
    {
      title: "Active Leads",
      value: metrics.activeLeads.toLocaleString(),
      change: metrics.activeLeadsChange,
      icon: Users,
      color: "bg-ibm-blue",
    },
    {
      title: "Response Rate",
      value: `${metrics.responseRate}%`,
      change: metrics.responseRateChange,
      icon: TrendingUp,
      color: "bg-green-50",
    },
    {
      title: "Qualified Leads",
      value: metrics.qualifiedLeads.toLocaleString(),
      change: metrics.qualifiedLeadsChange,
      icon: Star,
      color: "bg-yellow-30",
    },
    {
      title: "Pipeline Value",
      value: metrics.pipelineValue,
      change: metrics.pipelineValueChange,
      icon: DollarSign,
      color: "bg-green-50",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric) => (
        <div key={metric.title} className="bg-white p-6 rounded-lg border border-cool-gray-20 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cool-gray-70 text-sm font-medium">{metric.title}</p>
              <p className="text-2xl font-semibold text-cool-gray-80 mt-1">{metric.value}</p>
              <p className="text-green-50 text-xs mt-2">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                {metric.change}
              </p>
            </div>
            <div className={`w-12 h-12 ${metric.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
              <metric.icon className={`${metric.color.replace('bg-', 'text-')}`} size={20} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
