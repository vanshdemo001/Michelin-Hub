import { GlobalNavigation } from "@/components/GlobalNavigation";
import { MenuDashboard } from "@/components/MenuDashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-muted/20">
      <GlobalNavigation />
      <main>
        <MenuDashboard />
      </main>
    </div>
  );
}
