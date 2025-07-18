import { useQuery } from "@tanstack/react-query";
import type { Sequence } from "@shared/schema";

export default function ActiveSequences() {
  const { data: sequences, isLoading } = useQuery<Sequence[]>({
    queryKey: ["/api/sequences/active"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <h3 className="text-lg font-semibold text-cool-gray-80">Active AI Sequences</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-cool-gray-20 rounded-lg animate-pulse">
              <div className="h-4 bg-cool-gray-20 rounded mb-3"></div>
              <div className="h-2 bg-cool-gray-20 rounded mb-2"></div>
              <div className="h-3 bg-cool-gray-20 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sequences || sequences.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-cool-gray-20">
        <div className="p-6 border-b border-cool-gray-20">
          <h3 className="text-lg font-semibold text-cool-gray-80">Active AI Sequences</h3>
        </div>
        <div className="p-6">
          <p className="text-cool-gray-70 text-center">No active sequences found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-50 text-green-50";
      case "testing": return "bg-yellow-30 text-yellow-30";
      case "paused": return "bg-cool-gray-70 text-cool-gray-70";
      default: return "bg-cool-gray-20 text-cool-gray-70";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "active": return "bg-ibm-blue";
      case "testing": return "bg-yellow-30";
      case "paused": return "bg-cool-gray-70";
      default: return "bg-cool-gray-20";
    }
  };

  const calculateProgress = (sequence: Sequence) => {
    const sent = sequence.totalSent || 0;
    const target = 500; // Default target, could be stored in sequence
    return Math.min((sent / target) * 100, 100);
  };

  return (
    <div className="bg-white rounded-lg border border-cool-gray-20">
      <div className="p-6 border-b border-cool-gray-20">
        <h3 className="text-lg font-semibold text-cool-gray-80">Active AI Sequences</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {sequences.slice(0, 3).map((sequence) => {
          const progress = calculateProgress(sequence);
          const responseRate = sequence.responseRate ? parseFloat(sequence.responseRate) : 0;
          
          return (
            <div key={sequence.id} className="p-4 border border-cool-gray-20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-cool-gray-80">{sequence.name}</h4>
                <span className={`px-2 py-1 ${getStatusColor(sequence.status)} bg-opacity-10 text-xs font-medium rounded capitalize`}>
                  {sequence.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-cool-gray-70">Progress</span>
                  <span className="text-cool-gray-80 font-medium">
                    {sequence.totalSent || 0} / 500
                  </span>
                </div>
                <div className="w-full bg-cool-gray-20 rounded-full h-2">
                  <div 
                    className={`${getProgressColor(sequence.status)} h-2 rounded-full`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-cool-gray-70 mt-3">
                <span>Response Rate: <span className="font-medium text-cool-gray-80">{responseRate.toFixed(1)}%</span></span>
                <span>Updated {new Date(sequence.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
