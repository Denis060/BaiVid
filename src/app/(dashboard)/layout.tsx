"use client";

import { useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { CreditsProvider } from "@/components/shared/credits-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CreditsProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile sidebar */}
        <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </CreditsProvider>
  );
}
