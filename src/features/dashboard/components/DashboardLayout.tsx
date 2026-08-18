import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "../../../shared/components/Footer";
import { tw, zIndex } from "../../../shared/utils/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  return (
    <div className={`w-full flex flex-col min-h-screen`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMinimized={sidebarMinimized}
        onMinimizeChange={setSidebarMinimized}
      />

      <div
        className={`transition-all duration-300 flex flex-col flex-1 ${sidebarMinimized ? "md:ml-24 xl:ml-24" : "md:ml-32 xl:ml-80"}`}
      >
        <div style={{ height: "64px" }} />
        <Header onMenuClick={() => setSidebarOpen(true)} sidebarMinimized={sidebarMinimized} />

        <main
          className={`flex-1 px-5 lg:px-8 py-6 ${tw.primaryBackground} pb-24`}
        >
          {children}
        </main>
        <div
          className={`fixed bottom-0 left-0 right-0 transition-all duration-300 ${sidebarMinimized ? "md:left-24 xl:left-24" : "md:left-32 xl:left-80"}`}
          style={{ zIndex: zIndex.fixed }}
        >
          <Footer />
        </div>
      </div>
    </div>
  );
}
