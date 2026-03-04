"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function UnauthorizedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("unauthorized") === "true") {
      toast.error("Unauthorized", {
        description: "You must be logged in to access that page.",
      });

      // Remove the query param from the URL without a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("unauthorized");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
