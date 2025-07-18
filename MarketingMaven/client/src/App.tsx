import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LeadPipeline from "@/pages/lead-pipeline";
import AISequences from "@/pages/ai-sequences";
import LeadScoring from "@/pages/lead-scoring";
import Integrations from "@/pages/integrations";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/lead-pipeline" component={LeadPipeline} />
      <Route path="/ai-sequences" component={AISequences} />
      <Route path="/lead-scoring" component={LeadScoring} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
