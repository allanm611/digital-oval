import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { colors } from "../../../shared/utils/tokens";
import {
  Target,
  Brain,
  Users,
  Zap,
  Filter,
  MessageSquare,
  Settings,
  BarChart3,
  Heart,
  Send,
} from "lucide-react";
import FixedBackground from "../../../shared/components/FixedBackground";

import { GuestHeader } from "./Header";

export default function AuthenticatedLandingPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const coreModules = [
    {
      id: "cm",
      code: "CM",
      name: t.landing.sentraCM,
      subtitle: t.landing.sentraCMSubtitle,
      description: t.landing.sentraCMDescription,
      icon: "target",
      path: "/dashboard/campaigns",
      color: "from-teal-500 to-emerald-600",
      iconColor: "blue",
    },
    {
      id: "analytics",
      code: "Analytics",
      name: t.landing.analytics,
      subtitle: t.landing.analyticsSubtitle,
      description: t.landing.analyticsDescription,
      icon: "bar-chart",
      path: "/dashboard/reports/overview",
      color: "from-purple-500 to-blue-600",
      iconColor: "cyan",
    },
    {
      id: "360",
      code: "360",
      name: t.landing.sentra360,
      subtitle: t.landing.sentra360Subtitle,
      description: t.landing.sentra360Description,
      icon: "users",
      path: "/dashboard/customers",
      color: "from-purple-500 to-blue-600",
      iconColor: "teal",
    },
    {
      id: "xm",
      code: "XM",
      name: t.landing.sentraXM,
      subtitle: t.landing.sentraXMSubtitle,
      description: t.landing.sentraXMDescription,
      icon: "heart",
      path: "/dashboard/experiences",
      color: "from-orange-500 to-red-600",
      iconColor: "emerald",
    },
    {
      id: "target",
      code: "Target",
      name: t.landing.sentraTarget,
      subtitle: t.landing.sentraTargetSubtitle,
      description: t.landing.sentraTargetDescription,
      icon: "filter",
      path: "/dashboard/segments",
      color: "from-red-500 to-pink-600",
      iconColor: "green",
    },
    {
      id: "connect",
      code: "Connect",
      name: t.landing.sentraConnect,
      subtitle: t.landing.sentraConnectSubtitle,
      description: t.landing.sentraConnectDescription,
      icon: "send",
      path: "/dashboard/engagement",
      color: "from-blue-500 to-cyan-600",
      iconColor: "indigo",
    },
    {
      id: "config",
      code: "Config",
      name: t.landing.sentraConfig,
      subtitle: t.landing.sentraConfigSubtitle,
      description: t.landing.sentraConfigDescription,
      icon: "settings",
      path: "/dashboard/configuration",
      color: "from-gray-500 to-slate-600",
      iconColor: "slate",
    },
  ];

  const getModuleIcon = (iconName: string) => {
    const iconMap: {
      [key: string]: React.ComponentType<{ className?: string }>;
    } = {
      target: Target,
      brain: Brain,
      users: Users,
      zap: Zap,
      filter: Filter,
      "message-square": MessageSquare,
      settings: Settings,
      "bar-chart": BarChart3,
      heart: Heart,
      send: Send,
    };
    return iconMap[iconName] || Target;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <FixedBackground variant="landingpage" />

      <div className="min-h-screen relative overflow-hidden">
        <GuestHeader
          isLoaded={isLoaded}
          onLogout={handleLogout}
          variant="transparent"
        />

        {/* Main Content */}
        <main className="relative z-10 py-12">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            {/* Title Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                {t.landing.corePlatform}
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                {t.landing.corePlatformDescription}
              </p>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-6 xl:gap-8 max-w-7xl mx-auto [&>*:nth-child(7)]:lg:col-start-2">
              {coreModules.map((module, index) => {
                const IconComponent = getModuleIcon(module.icon);
                const navigableModules = [
                  "cm",
                  "analytics",
                  "360",
                  "target",
                  "config",
                ];
                const isClickable = navigableModules.includes(module.id);
                const cardContent = (
                  <>
                    {/* Module Card Container */}
                    <div className="bg-[#394247] border border-gray-600 rounded-md transition-all duration-200 ease-out p-8 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden shadow-lg hover:bg-[#4A5257] hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:border-gray-500 group">
                      {/* Icon */}
                      <div className="w-14 h-14 mb-4 rounded-md flex items-center justify-center transition-all duration-300 relative overflow-hidden bg-transparent border border-gray-500 hover:scale-110 hover:rotate-3 hover:border-gray-400">
                        <IconComponent
                          className={`${colors.iconSizes.lg} text-white`}
                        />
                      </div>

                      {/* Title and Subtitle */}
                      <h3 className="text-base font-bold text-white mb-1 text-center leading-tight">
                        {module.name}
                      </h3>
                      {module.subtitle && (
                        <p
                          className="font-semibold text-sm text-center leading-tight mb-3"
                          style={{ color: colors.primary.accent }}
                        >
                          {module.subtitle}
                        </p>
                      )}

                      {/* Description Inside Card */}
                      <p className="text-white/80 text-sm leading-relaxed text-center">
                        {module.description}
                      </p>
                    </div>
                  </>
                );

                if (isClickable) {
                  return (
                    <Link
                      key={module.id}
                      to={module.path}
                      className={`group transform transition-all duration-300 ease-out block ${
                        isLoaded
                          ? "translate-y-0 opacity-100"
                          : "translate-y-8 opacity-0"
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={module.id}
                    className={`group transform transition-all duration-300 ease-out ${
                      isLoaded
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
