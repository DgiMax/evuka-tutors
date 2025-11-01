'use client';

// 1. Import your main RevenuePage component
import RevenuePage from "@/components/revenue/RevenuePage";

export default function MyRevenuePage() {
  // 2. Render it.
  // It fetches its own data, so you don't need to pass any props.
  return <RevenuePage />;
}