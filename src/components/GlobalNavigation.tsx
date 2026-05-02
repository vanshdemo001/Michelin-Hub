"use client";

import { Search, Menu, LogOut, User, ChefHat } from "lucide-react";
import Link from "next/link";
import { CartSidebar } from "./CartSidebar";
import { Button } from "./ui/button";
import { AuthModal } from "./AuthModal";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function GlobalNavigation() {
  const [user, loading] = useAuthState(auth);

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/" className="font-extrabold text-2xl tracking-tighter text-primary cursor-pointer hover:opacity-90 transition-opacity">
            Michelin<span className="text-foreground"> Hub</span>
          </Link>
        </div>

        {/* Location Search Bar - Hidden on small mobile, visible on sm+ */}
        <div className="hidden sm:flex flex-1 max-w-md mx-auto items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search location for delivery..." 
            className="w-full h-10 pl-9 pr-4 rounded-full border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-10 w-10 animate-pulse bg-muted rounded-full"></div>
          ) : user ? (
            <DropdownMenu>
              {/* @ts-expect-error - external lib type issue */}
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.displayName && <p className="font-medium">{user.displayName}</p>}
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                {user?.email?.trim().toLowerCase() === "1234sample@sample.com" && (
                  <>
                    <DropdownMenuSeparator />
                    {/* @ts-expect-error - external lib type issue */}
                    <DropdownMenuItem asChild className="cursor-pointer font-bold text-primary focus:text-primary">
                      <Link href="/admin/kitchen">
                        <ChefHat className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthModal />
          )}
          <CartSidebar />
        </div>
      </div>
    </header>
  );
}
