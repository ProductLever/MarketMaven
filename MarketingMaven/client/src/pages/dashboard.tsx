import { Bell, Plus } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MetricsOverview from "@/components/metrics-overview";
import HighIntentProspects from "@/components/high-intent-prospects";
import ActiveSequences from "@/components/active-sequences";
import RecentActivity from "@/components/recent-activity";
import IntegrationStatus from "@/components/integration-status";
import QuickActions from "@/components/quick-actions";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-cool-gray-10">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-cool-gray-20 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-cool-gray-80">Dashboard</h1>
              <p className="text-cool-gray-70 mt-1">Monitor your outbound marketing performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-cool-gray-70 hover:bg-cool-gray-20 rounded-lg transition-colors">
                <Bell size={18} />
              </button>
              <button className="px-4 py-2 bg-ibm-blue text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center space-x-2">
                <Plus size={16} />
                <span>New Campaign</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Metrics Overview */}
          <MetricsOverview />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <HighIntentProspects />
            <ActiveSequences />
          </div>

          {/* Secondary Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecentActivity />
            <IntegrationStatus />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </main>
    </div>
  );
}
