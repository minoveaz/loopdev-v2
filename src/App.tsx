import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";
import { ThemeConfigBridge } from "@/providers/ThemeConfigBridge";
import { ThemeCustomizerProvider } from "@/components/theme/ThemeCustomizer";
import { AuthProvider } from "@/hooks/use-auth";
import { AppRoutes } from "@/routes/AppRoutes";
import { I18nProvider } from "@/i18n";
import { wireActivityLogging } from "@/lib/activity-wiring";

wireActivityLogging();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ThemeConfigProvider>
        <ThemeConfigBridge />
        <I18nProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={150}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ThemeCustomizerProvider>
                <AppRoutes />
              </ThemeCustomizerProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
        </I18nProvider>
      </ThemeConfigProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
