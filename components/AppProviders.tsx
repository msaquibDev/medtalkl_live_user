"use client";

import type { ReactNode } from "react";
import { CatalogProvider } from "@/components/CatalogProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <CatalogProvider>{children}</CatalogProvider>;
}

