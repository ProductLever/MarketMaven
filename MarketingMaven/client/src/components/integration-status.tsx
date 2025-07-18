import { useQuery } from "@tanstack/react-query";
import { Database, Layers, Mail, Users, Brain } from "lucide-react";
import type { Integration } from "@shared/schema";

const integrationIcons = {
  Apollo: Database,
  Clay: Layers,
  SmartLead: Mail,
  Rb2b: Users,
  "OpenAI GPT-4": Brain,
};

const integrationColors = {
  Apollo: "bg-ibm-blue",
  Clay: "bg-yellow-30",
  SmartLead: "bg-green-50",
  Rb2b: "bg-red-60",
  "OpenAI GPT-4": "bg-cool-gray-70",
};

const statusColors = {
  connected: "bg-green-50 text-green-50",
  syncing: "bg-yellow-30 text-yellow-30",
  disconnected: "bg-red-60 text-red-60",
  error: "bg-red-60 text-red-60",
};

export default function IntegrationStatus() {
  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <h3 className="text-lg font-semibold text-cool-gray-80">Integration Health</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-cool-gray-20 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cool-gray-20 rounded"></div>
                <div>
                  <div className="h-4 bg-cool-gray-20 rounded mb-1 w-20"></div>
                  <div className="h-3 bg-cool-gray-20 rounded w-24"></div>
                </div>
              </div>
              <div className="h-6 w-16 bg-cool-gray-20 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!integrations || integrations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <h3 className="text-lg font-semibold text-cool-gray-80">Integration Health</h3>
        </div>
        <div className="p-6">
          <p className="text-cool-gray-70 text-center">No integrations configured</p>
        </div>
      </div>
    );
  }

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return "Never";
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-cool-gray-20">
      <div className="p-6 border-b border-cool-gray-20">
        <h3 className="text-lg font-semibold text-cool-gray-80">Integration Health</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {integrations.map((integration) => {
          const IconComponent = integrationIcons[integration.name as keyof typeof integrationIcons] || Database;
          const iconColor = integrationColors[integration.name as keyof typeof integrationColors] || "bg-cool-gray-70";
          const statusColor = statusColors[integration.status as keyof typeof statusColors] || "bg-cool-gray-20 text-cool-gray-70";
          
          return (
            <div key={integration.id} className="flex items-center justify-between p-3 border border-cool-gray-20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${iconColor} rounded flex items-center justify-center`}>
                  <IconComponent className="text-white" size={14} />
                </div>
                <div>
                  <p className="font-semibold text-cool-gray-80">{integration.name}</p>
                  <p className="text-xs text-cool-gray-70">
                    Last sync: {formatLastSync(integration.lastSync?.toString() || null)}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 ${statusColor} bg-opacity-10 text-xs font-medium rounded capitalize`}>
                {integration.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
