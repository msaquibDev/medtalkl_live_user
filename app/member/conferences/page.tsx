import { ConferenceListing } from "@/components/MemberPortal";
import { Suspense } from "react";

export default function ConferencesPage() { return <Suspense fallback={<div className="member-loading"/>}><ConferenceListing/></Suspense>; }
