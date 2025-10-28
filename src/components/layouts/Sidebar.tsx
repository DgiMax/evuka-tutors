"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ElementType, useState } from "react";
import { useActiveOrg } from "@/lib/hooks/useActiveOrg";
import { useAuth } from "@/context/AuthContext";

import {
  LayoutGrid,
  GraduationCap,
  Users,
  Backpack,
  Calendar,
  Wallet,
  Megaphone,
  BarChart,
  Building,
  UserCircle,
  HelpCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const topNavLinks = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/tutors", label: "Tutors", icon: Users },
  { href: "/student", label: "Student", icon: Backpack },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/revenue", label: "Revenue & Payouts", icon: Wallet },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart },
  { href: "/org-info", label: "Org Info", icon: Building },
];

const bottomNavLinks = [
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/help", label: "Help", icon: HelpCircle },
];

type NavLinkProps = {
  href: string;
  label: string;
  icon: ElementType;
  onClick?: () => void;
};

const NavLink = ({ href, label, icon: Icon, onClick }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const { activeSlug } = useActiveOrg();

  // --- ✅ only prefix organizationSlug for org-specific routes ---
  const isGlobalLink = href === "/profile" || href === "/help";
  const computedHref = !isGlobalLink && activeSlug ? `/${activeSlug}${href}` : href;

  return (
    <Link
      href={computedHref}
      onClick={onClick}
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-blue-500 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
};

type SidebarNavProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function SidebarNav({ isSidebarOpen, setIsSidebarOpen }: SidebarNavProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [signOutLoading, setSignOutLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setSignOutLoading(false);
      setIsSidebarOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 25 }}
          className="fixed top-12 left-0 z-40 w-52 h-[calc(100vh-3rem)] bg-white border-r flex flex-col"
        >
          {/* Top Section */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {topNavLinks.map((link) => (
              <NavLink
                key={link.label}
                {...link}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="border-t p-3 space-y-1">
            {bottomNavLinks.map((link) => (
              <NavLink
                key={link.label}
                {...link}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm w-full text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signOutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>{signOutLoading ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
