import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Brain,
  ChartLine,
  Users,
  Bot,
  Star,
  Settings,
  BarChart,
  Cog
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartLine },
  { name: "Lead Pipeline", href: "/lead-pipeline", icon: Users },
  { name: "AI Sequences", href: "/ai-sequences", icon: Bot },
  { name: "Lead Scoring", href: "/lead-scoring", icon: Star },
  { name: "Integrations", href: "/integrations", icon: Cog },
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-cool-gray-20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-cool-gray-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
            <Brain className="text-white" size={16} />
          </div>
          <span className="font-semibold text-lg text-cool-gray-80">OutboundAI</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href} className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-ibm-blue bg-opacity-10 text-ibm-blue"
                    : "text-cool-gray-70 hover:bg-cool-gray-20"
                )}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-cool-gray-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-ibm-blue rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-cool-gray-80">Jane Doe</p>
            <p className="text-xs text-cool-gray-70">Marketing Director</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
