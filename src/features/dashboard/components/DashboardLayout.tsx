import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "../../../shared/components/Footer";
import { tw } from "../../../shared/utils/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`w-full relative min-h-screen flex flex-col`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:ml-32 xl:ml-80 flex flex-col flex-1 min-h-screen relative">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          className={`flex-1 px-5 lg:px-8 py-6 ${tw.primaryBackground} pb-24`}
        >
          {children}
        </main>
        <div className="fixed bottom-0 left-0 md:left-32 xl:left-80 right-0 z-[100]">
          <Footer />
        </div>
      </div>
    </div>
  );
}
