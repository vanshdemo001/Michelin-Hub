"use client";

import { ChefHat } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function AdminHeader({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl mr-2 md:mr-6">
            <ChefHat className="h-6 w-6" />
            <span className="hidden sm:inline-block">Admin Portal</span>
          </div>
          
          <nav className="flex items-center gap-1 md:gap-2">
            <Link href="/admin/kitchen">
              <Button variant={pathname === "/admin/kitchen" ? "secondary" : "ghost"} size="sm" className="font-semibold">
                Kitchen Orders
              </Button>
            </Link>
            <Link href="/admin/menu">
              <Button variant={pathname === "/admin/menu" ? "secondary" : "ghost"} size="sm" className="font-semibold">
                Menu Management
              </Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden lg:inline-block opacity-70">Logged in as {userEmail}</span>
          <Button variant="outline" size="sm" onClick={() => router.push("/")} className="hidden sm:flex">
            Exit
          </Button>
        </div>
      </div>
    </header>
  );
}
