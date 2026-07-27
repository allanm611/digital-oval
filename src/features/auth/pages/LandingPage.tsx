import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "/img/sentra.webp";
import logoLight from "/img/sentra1.webp";
import effortelLogo from "../../../assets/logo.svg";
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
import InteractivePatternBg from "../components/InteractivePatternBg";

export default function LandingPage() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Sentra brand typography - scoped to landing page only
  const landingStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
    .landing-page-container .landing-heading {
      font-family: 'Sora', sans-serif;
      font-weight: 700;
    }
  `;

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
    {
      text: t.landing.advancedCustomerSegmentation,
      icon: Target,
      outcome: "Target 40% more high-value customers",
    },
    {
      text: t.landing.multiChannelOrchestration,
      icon: Send,
      outcome: "Deploy campaigns 60% faster across channels",
    },
    {
      text: t.landing.realtimePerformance,
      icon: TrendingUp,
      outcome: "Real-time insights with <1 second latency",
    },
    {
      text: t.landing.automatedOfferPersonalization,
      icon: Sparkles,
      outcome: "Increase conversions by 45% with AI-powered offers",
    },
    {
      text: t.landing.comprehensiveAnalytics,
      icon: BarChart3,
      outcome: "See results in 24 hours, not weeks",
    },
    {
      text: t.landing.enterpriseGradeSecurity,
      icon: Shield,
      outcome: "100% compliance with GDPR, CCPA, and enterprise standards",
    },
  ];

  return (
    <div className={`landing-page-container min-h-screen bg-white relative overflow-hidden`}>
      <style>{landingStyles}</style>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Desktop Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 max-md:hidden backdrop-blur-md bg-transparent">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8 py-4 relative z-10">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0">
                <img
                  src={logo}
                  alt="Sentra Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>

              {/* Center Navigation Menu */}
              <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
                {/* Products Dropdown */}
                <div className="relative group">
                  <button className="text-black hover:text-emerald-600 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
                    Products
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-72 bg-white border border-gray-100  rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3 divide-y divide-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Core Platform</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">CM - Campaigns</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">360 - Customer Profiles</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Target - Segmentation</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Analytics - Reports</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Management</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Offers - Promotions</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Products - Catalog</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">KPIs - Metrics</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Data Connectors - Integration</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Advanced</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Connect - Activation</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Control Groups - Testing</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Config - Admin</Link>
                    </div>
                  </div>
                </div>

                {/* Solutions Dropdown */}
                <div className="relative group">
                  <button className="text-black hover:text-emerald-600 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
                    Solutions
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-72 bg-white border border-gray-100  rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3 divide-y divide-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Business Goals</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Revenue Optimization</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Customer Engagement</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Customer Retention</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Use Case</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Loyalty Programs</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Personalization</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Marketing Automation</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Capabilities</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Data Intelligence</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Multi-Channel Delivery</Link>
                    </div>
                  </div>
                </div>

                {/* Resources Dropdown */}
                <div className="relative group">
                  <button className="text-black hover:text-emerald-600 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
                    Resources
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-64 bg-white border border-gray-100 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3">
                    <Link to="/documentation" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Documentation</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Tutorials</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Help Center</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Contact Support</Link>
                  </div>
                </div>

                {/* Company Dropdown */}
                <div className="relative group">
                  <button className="text-black hover:text-emerald-600 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
                    Company
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-64 bg-white border border-gray-100  rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3">
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">About Us</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Customers</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Careers</Link>
                  </div>
                </div>
              </div>

              {/* Right - CTAs */}
              <div className="flex items-center gap-4">
                {/* Contact Sales */}
                <a href="#" className="text-black hover:text-emerald-600 text-sm font-medium transition-colors duration-200">
                  Contact Sales
                </a>

                {/* Demo Button */}
                <button
                  onClick={() => (window.location.href = "/request-account")}
                  className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-all duration-300  hover: hover:scale-105 whitespace-nowrap"
                >
                  Request Demo
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-700 md:hidden backdrop-blur-md bg-gray-800/95">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <img src={logo} alt="Sentra Logo" className="h-8 w-auto object-contain" />
              <div className="flex items-center gap-2">
                <button className="text-black hover:text-emerald-600 p-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-72 pb-64 overflow-hidden bg-gradient-to-b from-white via-emerald-50 to-emerald-50 relative">
          {/* Interactive Pattern Background */}
          <InteractivePatternBg type="lines" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div>
              <div className={`inline-flex items-center px-6 py-3 bg-emerald-50 backdrop-blur-sm rounded-full text-sm font-semibold mb-8 border border-emerald-200`}>
                <Sparkles className="w-4 h-4 mr-2 text-emerald-600 animate-bounce" />
                <span className="text-emerald-700">{t.landing.nextGenPlatform}</span>
              </div>
              <h1 className={`landing-heading text-5xl font-[700] text-gray-900 mb-6 leading-tight tracking-[-0.02em]`}>
                Build Intelligent Customer Campaigns Across Channels
              </h1>
              <p className={`font-['Inter'] text-base text-gray-600 mb-6 leading-relaxed max-w-2xl mx-auto`}>
                Segment your customers, create targeted campaigns, and deliver personalized messages across all channels. All in one platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/request-account"
                  className={`inline-flex items-center px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold font-['Inter'] ${tw.rounded} transition-all duration-300 transform hover:scale-105`}
                >
                  Request Demo
                </Link>
                <a href="#" className={`inline-flex items-center px-6 py-2.5 border border-black text-gray-800 font-semibold font-['Inter'] ${tw.rounded} hover:bg-gray-50 hover:border-emerald-400 transition-all duration-200`}>
                  Contact Sales
                </a>
              </div>

            </div>
          </div>
        </section>



        {/* Features Section */}
        <section className="py-20 bg-emerald-900">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`landing-heading text-4xl font-[700] text-white mb-4 leading-tight tracking-[-0.02em]`}>
                {t.landing.everythingYouNeed}{" "}
                <span className="text-emerald-300">customer value</span>
              </h2>
              <p className={`font-['Inter'] text-base text-emerald-100 max-w-2xl mx-auto`}>
                {t.landing.ourComprehensive}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-emerald-800/20 backdrop-blur rounded-lg p-6 border border-emerald-700 hover:border-emerald-500 transition-all duration-300 group cursor-pointer hover:bg-emerald-800/30"
                    style={{
                      animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.animation = 'bounce 0.6s ease-in-out infinite';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.animation = `slideUp 0.6s ease-out ${index * 0.1}s both`;
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-emerald-600/30 rounded-lg flex items-center justify-center transition-all duration-300">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-emerald-50 leading-relaxed group-hover:text-white transition-colors duration-300 font-medium`}>{feature.text}</p>
                        <p className={`text-emerald-200 text-sm mt-2 leading-relaxed`}>{feature.outcome}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes bounce {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-8px);
              }
            }
          `}</style>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50 border-b border-b-gray-200">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`landing-heading text-4xl font-[700] text-gray-900 mb-4 leading-tight tracking-[-0.02em]`}>
                Deploy in 4 Simple Steps
              </h2>
              <p className={`font-['Inter'] text-base text-gray-600 max-w-2xl mx-auto`}>
                From setup to execution in days, not months
              </p>
            </div>
            <div className="relative">
              {/* Timeline line background */}
              <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 -z-10"></div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
                {[
                  {
                    step: 1,
                    title: "Connect Data",
                    description: "Integrate customer data from databases, APIs, or files",
                    icon: Users,
                  },
                  {
                    step: 2,
                    title: "Build Segments",
                    description: "Create intelligent audiences based on behavior and attributes",
                    icon: Filter,
                  },
                  {
                    step: 3,
                    title: "Create Campaigns",
                    description: "Launch targeted campaigns with personalized offers",
                    icon: Send,
                  },
                  {
                    step: 4,
                    title: "Measure Impact",
                    description: "Track ROI and optimize with real-time analytics",
                    icon: TrendingUp,
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="relative group flex flex-col"
                      style={{
                        animation: `slideUp 0.6s ease-out ${idx * 0.15}s both`
                      }}
                    >
                      {/* Step indicator dot */}
                      <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 bg-white border-4 border-emerald-600 rounded-full flex items-center justify-center z-20 cursor-pointer">
                          <Icon className="w-7 h-7 text-emerald-600" />
                        </div>
                      </div>

                      {/* Card */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 flex-1 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Step {item.step}</span>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-1">{item.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-16 bg-emerald-900">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <p className="text-center text-sm font-semibold text-gray-300 mb-8 uppercase tracking-wide">Trusted by leading organizations</p>
            <div className="flex items-center justify-center">
              <img src={effortelLogo} alt="Effortel" className="h-12 object-contain filter brightness-110" />
            </div>
          </div>
        </section>


        {/* FAQ Section */}
        <section className="py-20 border-b border-b-gray-200">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`landing-heading text-4xl font-[700] text-gray-900 mb-4 leading-tight tracking-[-0.02em]`}>
                Frequently Asked Questions
              </h2>
              <p className={`font-['Inter'] text-base text-gray-600 max-w-2xl mx-auto`}>
                Find answers to common questions about Sentra
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "What is Sentra CVM?",
                  answer: "Sentra is an enterprise Customer Value Management platform that enables organizations to segment customers, create targeted campaigns, and measure ROI across all channels in real-time."
                },
                {
                  question: "What data sources can I connect?",
                  answer: "Sentra integrates with databases (PostgreSQL, MySQL, MSSQL, Oracle), CRM systems (Salesforce, HubSpot), data warehouses, APIs, and streaming platforms like Kafka. We also support SFTP file uploads and SMS inbox integration from major providers."
                },
                {
                  question: "What channels does Sentra support?",
                  answer: "Sentra supports SMS, Email, Push Notifications, WhatsApp, USSD, and custom API integrations for true omnichannel campaign execution."
                },
                {
                  question: "What's the onboarding process?",
                  answer: "We handle the setup end-to-end: connecting your data sources, configuring your communication channels, setting up initial segments and campaigns, and training your team. Our dedicated team provides support throughout the entire process."
                },
                {
                  question: "How is my customer data secured?",
                  answer: "Sentra is fully compliant with GDPR, CCPA, and enterprise data privacy standards. We provide SOC 2 Type II certification, end-to-end encryption, role-based access controls, and comprehensive audit logging."
                },
                {
                  question: "What kind of support does Sentra provide?",
                  answer: "We offer 24/7 technical support, dedicated account management, onboarding assistance, and access to our documentation and knowledge base."
                }
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-400 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                    className="w-full flex items-center justify-between font-medium text-gray-900 p-6 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span>{faq.question}</span>
                    <span className={`text-emerald-600 transform transition-transform ${openFaqIdx === idx ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {openFaqIdx === idx && (
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ready to Get Started Section */}
        <section className="py-20 bg-white border-b border-b-gray-200">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-8 text-center">
            <h3 className={`landing-heading text-3xl font-[700] text-gray-900 mb-3`}>
              Ready to get started?
            </h3>
            <p className={`text-lg text-gray-600 mb-8`}>
              Transform your customer value strategy today
            </p>

            <Link
              to="/request-account"
              className={`inline-flex items-center px-8 py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold ${tw.rounded} transition-all duration-200`}
            >
              Request Demo
            </Link>

            <p className="text-gray-600 text-sm mt-8">Still have questions? <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">Contact Support</a></p>
          </div>
        </section>

        {/* Footer */}
        <footer className={`bg-gray-900 py-16`}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            {/* Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <img src={logoLight} alt="Sentra Logo" className="h-8 w-auto mb-4" />
                <p className={`text-gray-300 text-sm leading-relaxed`}>
                  Enterprise customer value management platform for modern businesses.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className={`text-white font-semibold mb-4`}>Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/documentation" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      API Reference
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className={`text-white font-semibold mb-4`}>Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className={`text-white font-semibold mb-4`}>Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Tutorials
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Case Studies
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                      Webinars
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className={`text-gray-400 text-sm`}>
                  <p dangerouslySetInnerHTML={{ __html: t.landing.copyrightNotice }}></p>
                </div>
                <div className="flex gap-6 text-sm">
                  <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                    Privacy Policy
                  </a>
                  <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                    Terms of Service
                  </a>
                  <a href="#" className={`text-gray-300 hover:text-emerald-400 transition-colors`}>
                    Security
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
