"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DashboardPollingWrapperProps {
  children: React.ReactNode;
  intervalMs?: number;
}

export function DashboardPollingWrapper({
  children,
  intervalMs = 60000, // Default: 60 seconds
}: DashboardPollingWrapperProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return <>{children}</>;
}
