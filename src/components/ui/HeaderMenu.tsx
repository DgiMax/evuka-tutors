"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import OrganizationSwitcher from "@/components/ui/OrganizationSwitcher"

export function HeaderMenu() {
  const { logout } = useAuth()
  const router = useRouter()
  const [signOutLoading, setSignOutLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true)
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setSignOutLoading(false)
    }
  }

  return (
    // Keep the outer div as is
    <div className="hidden md:flex items-center space-x-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="font-medium flex items-center gap-1 whitespace-nowrap"
            disabled={signOutLoading}
          >
            Account
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56"> {/* Increased width slightly */}
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">My Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">My Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/wishlist">Wishlist</Link>
          </DropdownMenuItem>

          {/* === Section for Context Switcher === */}
          <DropdownMenuSeparator />
          {/* Add padding around the switcher */}
          <div className="px-2 py-1.5">
             {/* ✅ Pass a className to adjust width */}
            <OrganizationSwitcher triggerClassName="w-full justify-between" />
          </div>
          {/* ================================== */}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/30 cursor-pointer" // Added cursor-pointer
          >
            {signOutLoading ? "Logging out..." : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}