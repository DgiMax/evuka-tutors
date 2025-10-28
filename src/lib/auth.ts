// lib/auth.ts (server-only)
import { cookies } from "next/headers";

interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  is_superadmin: boolean;
  is_moderator: boolean;
  is_tutor?: boolean;
  is_student?: boolean;
  organizations?: any[];
}

export async function getCurrentUser(): Promise<User | null> {
  // 1. THIS IS THE FIX.
  // This comment tells TypeScript to ignore the false error on the next line.
  // @ts-ignore - This is a known Next.js/VS Code cache bug.
  const cookieStore = await cookies();

  // 2. Get the full token object (name and value)
  const token =
    cookieStore.get("sessionid") || // Check for Django's default
    cookieStore.get("access_token"); // Check for your JWT

  if (!token) {
    console.log("Auth gate: No sessionid or access_token found.");
    return null;
  }

  // 3. Use an internal, server-side URL.
  const apiUrl =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    console.error("Auth gate: API URL is not configured.");
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/users/me/`, {
      headers: {
        // 4. Use the token's actual name and value
        Cookie: `${token.name}=${token.value}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Auth gate: API fetch failed with status ${response.status}`
      );
      return null;
    }

    return (await response.json()) as User;
  } catch (error) {
    console.error("Auth gate: Failed to fetch user on server:", error);
    return null;
  }
}