import type { ReactNode } from "react";
import { MemberAppLayout } from "@/components/MemberSiteLayout";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return <MemberAppLayout>{children}</MemberAppLayout>;
}
