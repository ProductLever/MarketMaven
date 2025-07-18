import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import type { Prospect } from "@shared/schema";

export default function HighIntentProspects() {
  const { data: prospects, isLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects/high-intent"],
  });

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-cool-gray-80">High-Intent Prospects</h3>
            <div className="h-6 w-16 bg-cool-gray-20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-cool-gray-10 rounded-lg animate-pulse">
              <div className="h-4 bg-cool-gray-20 rounded mb-2"></div>
              <div className="h-3 bg-cool-gray-20 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!prospects || prospects.length === 0) {
    return (
      <div className="lg:col-span-2 bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-cool-gray-80">High-Intent Prospects</h3>
            <span className="px-3 py-1 bg-cool-gray-20 text-cool-gray-70 text-sm font-medium rounded-full">
              0 Urgent
            </span>
          </div>
        </div>
        <div className="p-6">
          <p className="text-cool-gray-70 text-center">No high-intent prospects found</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-red-60 text-red-60";
    if (score >= 80) return "bg-yellow-30 text-yellow-30";
    return "bg-green-50 text-green-50";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = ["bg-ibm-blue", "bg-green-50", "bg-yellow-30", "bg-red-60"];
    return colors[index % colors.length];
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-lg border border-cool-gray-20">
      <div className="p-6 border-b border-cool-gray-20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-cool-gray-80">High-Intent Prospects</h3>
          <span className="px-3 py-1 bg-red-60 bg-opacity-10 text-red-60 text-sm font-medium rounded-full">
            {prospects.length} Urgent
          </span>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {prospects.slice(0, 5).map((prospect, index) => (
          <div key={prospect.id} className="flex items-center justify-between p-4 bg-cool-gray-10 rounded-lg hover:bg-cool-gray-20 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">
                  {getInitials(prospect.firstName, prospect.lastName)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-cool-gray-80">
                  {prospect.firstName} {prospect.lastName}
                </p>
                <p className="text-sm text-cool-gray-70">{prospect.company}</p>
                <p className="text-xs text-cool-gray-70">{prospect.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 ${getScoreColor(prospect.leadScore)} bg-opacity-10 text-xs font-medium rounded`}>
                  {prospect.leadScore} Score
                </span>
              </div>
              <p className="text-xs text-cool-gray-70">
                <Clock className="inline w-3 h-3 mr-1" />
                {new Date(prospect.lastActivity).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        
        <div className="pt-4">
          <button className="w-full py-2 text-ibm-blue font-medium hover:bg-ibm-blue hover:bg-opacity-5 rounded-lg transition-colors">
            View All High-Intent Prospects
          </button>
        </div>
      </div>
    </div>
  );
}
