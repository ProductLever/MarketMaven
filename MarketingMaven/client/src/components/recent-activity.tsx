import { useQuery } from "@tanstack/react-query";
import { UserPlus, Mail, Reply, Star, RotateCcw } from "lucide-react";
import type { Activity } from "@shared/schema";

const activityIcons = {
  prospect_created: UserPlus,
  email_sent: Mail,
  response_received: Reply,
  score_updated: Star,
  data_enrichment: RotateCcw,
};

const activityColors = {
  prospect_created: "bg-green-50 text-green-50",
  email_sent: "bg-ibm-blue text-ibm-blue",
  response_received: "bg-yellow-30 text-yellow-30",
  score_updated: "bg-green-50 text-green-50",
  data_enrichment: "bg-ibm-blue text-ibm-blue",
};

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-cool-gray-80">Recent AI Activity</h3>
            <div className="h-4 w-16 bg-cool-gray-20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-cool-gray-20 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-cool-gray-20 rounded mb-1"></div>
                <div className="h-3 bg-cool-gray-20 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-cool-gray-80">Recent AI Activity</h3>
            <button className="text-ibm-blue text-sm font-medium hover:underline">View All</button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-cool-gray-70 text-center">No recent activity</p>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-cool-gray-20">
      <div className="p-6 border-b border-cool-gray-20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-cool-gray-80">Recent AI Activity</h3>
          <button className="text-ibm-blue text-sm font-medium hover:underline">View All</button>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {activities.slice(0, 5).map((activity) => {
          const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || RotateCcw;
          const colorClass = activityColors[activity.type as keyof typeof activityColors] || "bg-cool-gray-20 text-cool-gray-70";
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${colorClass} bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={colorClass.split(' ')[1]} size={14} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-cool-gray-80">{activity.description}</p>
                <p className="text-xs text-cool-gray-70 mt-1">
                  {formatTimestamp(activity.createdAt.toString())}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
