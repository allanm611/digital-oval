import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";
import {
  ArrowRight,
  Target,
  Users,
  MessageSquare,
  BarChart3,
  Shield,
  Sparkles,
  CheckCircle,
  Play,
  Star,
  Heart,
  Filter,
  Send,
  Settings,
  TrendingUp,
} from "lucide-react";
import AnimatedButton from "../../../shared/components/ui/AnimatedButton";
import { useLanguage } from "../../../contexts/LanguageContext";
import { tw } from '../../../shared/utils/utils';

export default function LandingPage() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const modules = [
    {
      icon: Target,
      title: "Sentra CM",
      subtitle: "Campaign Management",
      description: "Create, schedule, and manage multi-channel campaigns with ease. Execute personalized customer journeys across all touchpoints."
    },
    {
      icon: BarChart3,
      title: "Analytics",
      subtitle: "Data Insights",
      description: "Real-time analytics and comprehensive reporting. Measure campaign performance and track ROI across all channels."
    },
    {
      icon: Users,
      title: "Sentra 360",
      subtitle: "Customer 360",
      description: "Unified customer profiles with complete behavioral and transactional data. Get a 360-degree view of every customer."
    },
    {
      icon: Heart,
      title: "Sentra XM",
      subtitle: "Experience Management",
      description: "Deliver personalized customer experiences. Optimize every interaction across your customer journey."
    },
    {
      icon: Filter,
      title: "Sentra Target",
      subtitle: "Segmentation",
      description: "Build dynamic audience segments with AI-powered insights. Target the right customers at the right time."
    },
    {
      icon: Send,
      title: "Sentra Connect",
      subtitle: "Activation",
      description: "Activate campaigns across channels. Send personalized messages via email, SMS, push, and more."
    },
    {
      icon: Settings,
      title: "Sentra Config",
      subtitle: "Configuration",
      description: "Manage platform settings, integrations, and permissions. Control your entire Sentra environment."
    },
  ];

  const features = [
    t.landing.advancedCustomerSegmentation,
    t.landing.multiChannelOrchestration,
    t.landing.realtimePerformance,
    t.landing.automatedOfferPersonalization,
    t.landing.comprehensiveAnalytics,
    t.landing.enterpriseGradeSecurity,
  ];

  return (
    <div className={`min-h-screen bg-[#0a192f] relative overflow-hidden `}>
      {/* Background Pattern */}
      <div className="bg-gradients"></div>
      <div className="bg-hex"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Desktop Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 max-md:hidden backdrop-blur-sm bg-[#0a192f]/95">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div
                className={`flex items-center space-x-3 transition-all duration-800 ${
                  isVisible ? "slide-in-left" : "opacity-0"
                }`}
              >
                <div className="w-40 h-40 flex items-center justify-center">
                  <img
                    src={logo}
                    alt="Sentra Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div
                className={`flex items-center space-x-6 transition-all duration-800 delay-300 ${
                  isVisible ? "slide-in-right" : "opacity-0"
                }`}
              >
                <Link
                  to="/documentation"
                  className={`text-white/80 hover:text-white px-4 py-2 text-base font-semibold transition-all duration-300 ${tw.rounded} hover:bg-white/10`}
                >
                  Documentation
                </Link>
                <Link
                  to="/login"
                  className={`text-white/80 hover:text-white px-4 py-2 text-base font-semibold transition-all duration-300 ${tw.rounded} hover:bg-white/10`}
                >
                  {t.landing.signIn}
                </Link>
                <AnimatedButton
                  variant="primary"
                  size="md"
                  glowEffect
                  onClick={() => (window.location.href = "/request-account")}
                >
                  {t.landing.requestAccess}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 md:hidden backdrop-blur-sm bg-[#0a192f]/95">
          <div className="mx-auto px-5 py-2">
            <div className="flex items-center justify-between">
              {/* Logo on the left */}
              <div
                className={`flex items-center transition-all duration-800 ${
                  isVisible ? "slide-in-left" : "opacity-0"
                }`}
              >
                <div className="w-20 h-20 flex items-center justify-center">
                  <img
                    src={logo}
                    alt="Sentra Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              {/* Buttons on the right */}
              <div
                className={`flex items-center space-x-2 transition-all duration-800 delay-300 ${
                  isVisible ? "slide-in-right" : "opacity-0"
                }`}
              >
                <Link
                  to="/documentation"
                  className={`text-white/80 hover:text-white px-2 py-2 text-xs font-semibold transition-all duration-300 ${tw.rounded} hover:bg-white/10`}
                >
                  Docs
                </Link>
                <Link
                  to="/login"
                  className={`text-white/80 hover:text-white px-3 py-2 text-sm font-semibold transition-all duration-300 ${tw.rounded} hover:bg-white/10`}
                >
                  {t.landing.signIn}
                </Link>
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  glowEffect
                  onClick={() => (window.location.href = "/request-account")}
                >
                  {t.landing.requestAccess}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className={`inline-flex items-center px-6 py-3 ${tw.surfaceBackground}/10 backdrop-blur-sm  rounded-full text-sm font-semibold mb-8 border border-white/20`}>
                <Sparkles className="w-4 h-4 mr-2 text-emerald-400 animate-pulse" />
                {t.landing.nextGenPlatform}
              </div>
              <h1
                className={`${tw.mainHeading} text-white mb-6 leading-tight`}
              >
                {t.landing.transformCustomerValue} <br />
                <span className="text-emerald-400">{t.landing.customerValueManagement}</span>
              </h1>
              <p className={`text-lg /80 mb-12 max-w-3xl mx-auto leading-relaxed`}>
                {t.landing.heroDescription}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link
                  to="/request-account"
                  className={`inline-flex items-center px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold ${tw.rounded} transition-all duration-300 transform hover:scale-105`}
                >
                  {t.landing.getStartedToday}
                </Link>
                <button className={`inline-flex items-center px-6 py-4 border border-white/30 text-white font-semibold ${tw.rounded} hover:bg-white/10 transition-all duration-200`}>
                  <Play className="mr-2 h-5 w-5" />
                  {t.landing.watchDemo}
                </button>
              </div>
            </div>
          </div>
        </section>



        {/* Features Section */}
        <section className="py-20 border-t border-white/10 border-b border-b-white/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`${tw.mainHeading} text-white mb-4`}>
                {t.landing.everythingYouNeed}{" "}
                <span className="text-emerald-400">customer value</span>
              </h2>
              <p className={`text-lg /80 max-w-2xl mx-auto`}>
                {t.landing.ourComprehensive}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className={`/90 leading-relaxed`}>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="py-20 border-b border-b-white/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`${tw.mainHeading} text-white mb-4`}>
                {t.landing.powerfulModules} <span className="text-emerald-400">Modules</span>
              </h2>
              <p className={`text-lg /80 max-w-2xl mx-auto`}>
                {t.landing.exploreComprehensive}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {modules.map((module, index) => {
                const Icon = module.icon;
                const isLast = index === modules.length - 1;
                const animationDelay = `${index * 100}ms`;

                return (
                  <div
                    key={index}
                    className={`bg-white/5 backdrop-blur-sm ${tw.rounded} border border-white/10 p-6 hover:border-emerald-400/50 transition-all duration-300 hover:-translate-y-2 group cursor-pointer ${
                      isLast ? 'md:col-start-2' : ''
                    }`}
                    style={{
                      animation: `float 3s ease-in-out ${animationDelay} infinite`,
                    }}
                  >
                    <div className="flex flex-col items-center text-center h-full">
                      <div className={`flex items-center justify-center w-12 h-12 bg-emerald-500/20 ${tw.rounded} mb-4 group-hover:bg-emerald-500/30 transition-all duration-300 group-hover:scale-110`}>
                        <Icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className={`text-base font-semibold  group-hover:text-emerald-400 transition-colors duration-300 mb-1`}>
                        {module.title}
                      </h3>
                      <p className={`text-sm /50 mb-3`}>{module.subtitle}</p>
                      <p className={`text-sm /70 leading-relaxed`}>
                        {module.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <style>{`
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-8px);
              }
            }
          `}</style>
        </section>


        {/* Final CTA Section */}
        <section className="py-20 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Benefits */}
              <div>
                <h2 className={`text-3xl sm:text-4xl font-bold  mb-8`}>
                  Transform your customer value strategy
                </h2>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className={` font-semibold mb-1`}>Deploy in days, not months</h3>
                      <p className={`/70 text-sm`}>
                        Get up and running quickly with our streamlined implementation process
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className={` font-semibold mb-1`}>Dedicated support team</h3>
                      <p className={`/70 text-sm`}>
                        Expert guidance every step of your customer value journey
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className={` font-semibold mb-1`}>AI-powered insights</h3>
                      <p className={`/70 text-sm`}>
                        Unified customer profiles across all channels in real-time
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className={` font-semibold mb-1`}>Proven ROI results</h3>
                      <p className={`/70 text-sm`}>
                        Average 45% increase in ROI within the first 6 months
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - CTA */}
              <div className="lg:pl-12 border border-white/5 p-8 lg:p-10 rounded-lg">
                <h3 className={`text-2xl font-bold  mb-3`}>
                  Ready to get started?
                </h3>
                <p className={`/70 mb-6`}>
                  Start transforming your customer relationships today.
                </p>

                <div className="flex gap-3 flex-wrap">
                  <Link
                    to="/request-account"
                    className={`inline-flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold ${tw.rounded} transition-all duration-200`}
                  >
                    Request Access
                  </Link>

                  <Link
                    to="/login"
                    className={`inline-flex items-center px-6 py-3 border border-white/30 text-white font-semibold ${tw.rounded} hover:bg-white/10 transition-all duration-200`}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`border-t border-white/10  py-16`}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            {/* Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <h3 className={` font-semibold mb-4`}>Sentra</h3>
                <p className={`/60 text-sm leading-relaxed`}>
                  Enterprise customer value management platform for modern businesses.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className={` font-semibold mb-4`}>Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/documentation" className={`text-white/60 hover: transition-colors`}>
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      API Reference
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className={` font-semibold mb-4`}>Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className={` font-semibold mb-4`}>Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Tutorials
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Case Studies
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-white/60 hover: transition-colors`}>
                      Webinars
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className={`/60 text-sm`}>
                  <p dangerouslySetInnerHTML={{ __html: t.landing.copyrightNotice }}></p>
                </div>
                <div className="flex gap-6 text-sm">
                  <a href="#" className={`text-white/60 hover: transition-colors`}>
                    Privacy Policy
                  </a>
                  <a href="#" className={`text-white/60 hover: transition-colors`}>
                    Terms of Service
                  </a>
                  <a href="#" className={`text-white/60 hover: transition-colors`}>
                    Security
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
