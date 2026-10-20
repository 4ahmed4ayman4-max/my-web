import { AuthProvider, useAuth } from "@/features/auth/useAuth";
import { Outlet } from "react-router-dom";
import { Header } from "@/shared/ui/Header";
import { Footer } from "@/shared/ui/Footer";

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/**
 * Root provider with AuthContext
 */
export function Provider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/**
 * Layout component with header/footer.
 * AuthProvider lives here (inside the Router context) so that AuthProvider's
 * useNavigate() call is valid while still wrapping every routed page.
 */
export function Layout() {
  return (
    <Provider>
      <AppContent />
    </Provider>
  );
}