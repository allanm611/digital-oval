import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "/img/sentra.webp";
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
    <div className={`min-h-screen bg-white relative overflow-hidden`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Desktop Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-700 max-md:hidden backdrop-blur-md bg-gray-800/95">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8 py-4">
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
                  <button className="text-gray-100 hover:text-emerald-400 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
                    Products
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-72 bg-white border border-gray-100  rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3 divide-y divide-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Core Platform</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Sentra CM - Campaigns</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Sentra 360 - Customer Profiles</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Sentra Target - Segmentation</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Analytics - Reports</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Management</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Offers - Promotions</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Products - Catalog</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">KPIs - Metrics</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Advanced</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Sentra Connect - Activation</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Control Groups - Testing</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Sentra Config - Admin</Link>
                    </div>
                  </div>
                </div>

                {/* Solutions Dropdown */}
                <div className="relative group">
                  <button className="text-gray-100 hover:text-emerald-400 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
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
                  <button className="text-gray-100 hover:text-emerald-400 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
                    Resources
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-72 bg-white border border-gray-100  rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3 divide-y divide-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Learning</p>
                      <Link to="/documentation" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Documentation</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Tutorials</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Help Center</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">API Reference</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Community</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Blog</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Webinars</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Case Studies</Link>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Support</p>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Contact Support</Link>
                      <Link to="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors font-medium">Status Page</Link>
                    </div>
                  </div>
                </div>

                {/* Company Dropdown */}
                <div className="relative group">
                  <button className="text-gray-100 hover:text-emerald-400 text-base font-medium transition-colors duration-200 flex items-center gap-2 px-3 py-2">
                    Company
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-0 w-64 bg-white border border-gray-100  rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-3">
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">About Us</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Customers</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Careers</Link>
                    <Link to="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded mx-2 transition-colors font-medium">Press</Link>
                  </div>
                </div>
              </div>

              {/* Right - CTAs */}
              <div className="flex items-center gap-4">
                {/* Sign In */}
                <Link to="/login" className="text-gray-100 hover:text-emerald-400 text-sm font-medium transition-colors duration-200">
                  Sign In
                </Link>

                {/* Demo Button */}
                <button
                  onClick={() => (window.location.href = "/request-account")}
                  className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-all duration-300  hover: hover:scale-105 whitespace-nowrap"
                >
                  Book a Demo
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
                <button className="text-gray-100 hover:text-emerald-400 p-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-24 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Text */}
              <div>
                <div className={`inline-flex items-center px-6 py-3 bg-emerald-50 backdrop-blur-sm rounded-full text-sm font-semibold mb-8 border border-emerald-200`}>
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-600 animate-pulse" />
                  <span className="text-emerald-700">{t.landing.nextGenPlatform}</span>
                </div>
                <h1 className={`${tw.mainHeading} text-gray-900 mb-6 leading-tight`}>
                  Manage Customer Campaigns with Precision
                </h1>
                <p className={`text-lg text-gray-600 mb-12 leading-relaxed`}>
                  Segment your customers, create targeted campaigns, and deliver personalized messages across all channels. All in one platform.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Link
                    to="/request-account"
                    className={`inline-flex items-center px-8 py-4 bg-emerald-400 hover:bg-emerald-500 text-white font-semibold ${tw.rounded} transition-all duration-300 transform hover:scale-105  hover:`}
                  >
                    Book a Demo
                  </Link>
                  <button className={`inline-flex items-center px-6 py-4 border-2 border-gray-300 text-gray-800 font-semibold ${tw.rounded} hover:bg-gray-50 hover:border-emerald-400 transition-all duration-200`}>
                    <Play className="mr-2 h-5 w-5" />
                    Learn More
                  </button>
                </div>
              </div>

              {/* Right Side - Workflow Diagram */}
              <div className="flex justify-center">
                <svg width="100%" height="400" viewBox="0 0 500 400" className="max-w-md">
                  {/* Step 1: Customers */}
                  <circle cx="50" cy="200" r="35" fill="#e8f5e9" stroke="#10b981" strokeWidth="2"/>
                  <text x="50" y="200" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-emerald-700">👥</text>
                  <text x="50" y="250" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Customers</text>

                  {/* Arrow 1 */}
                  <path d="M 85 200 L 130 200" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>

                  {/* Step 2: Segments */}
                  <circle cx="165" cy="200" r="35" fill="#e8f5e9" stroke="#10b981" strokeWidth="2"/>
                  <text x="165" y="200" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-emerald-700">🎯</text>
                  <text x="165" y="250" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Segments</text>

                  {/* Arrow 2 */}
                  <path d="M 200 200 L 245 200" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>

                  {/* Step 3: Campaigns */}
                  <circle cx="280" cy="200" r="35" fill="#e8f5e9" stroke="#10b981" strokeWidth="2"/>
                  <text x="280" y="200" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-emerald-700">🚀</text>
                  <text x="280" y="250" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Campaigns</text>

                  {/* Arrow 3 */}
                  <path d="M 315 200 L 360 200" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>

                  {/* Step 4: Send */}
                  <circle cx="395" cy="200" r="35" fill="#e8f5e9" stroke="#10b981" strokeWidth="2"/>
                  <text x="395" y="200" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-emerald-700">📧</text>
                  <text x="395" y="250" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Multi-Channel</text>

                  {/* Step 5: Results - Below */}
                  <circle cx="280" cy="320" r="35" fill="#e8f5e9" stroke="#10b981" strokeWidth="2"/>
                  <text x="280" y="320" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-emerald-700">📊</text>
                  <text x="280" y="365" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Measure Results</text>

                  {/* Arrow from Send to Results */}
                  <path d="M 395 235 Q 340 270 280 285" stroke="#10b981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>

                  {/* Arrow marker definition */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </section>



        {/* Features Section */}
        <section className="py-20 border-t border-gray-200 border-b border-b-gray-200">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`${tw.mainHeading} text-gray-900 mb-4`}>
                {t.landing.everythingYouNeed}{" "}
                <span className="text-emerald-600">customer value</span>
              </h2>
              <p className={`text-lg text-gray-600 max-w-2xl mx-auto`}>
                {t.landing.ourComprehensive}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-1 group-hover:bg-emerald-200 transition-colors duration-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className={`text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-300`}>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="py-20 border-b border-b-gray-200">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`${tw.mainHeading} text-gray-900 mb-4`}>
                {t.landing.powerfulModules} <span className="text-emerald-600">Modules</span>
              </h2>
              <p className={`text-lg text-gray-600 max-w-2xl mx-auto`}>
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
                    className={`bg-white border border-gray-200  hover: ${tw.rounded} p-6 hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1 group cursor-pointer ${
                      isLast ? 'md:col-start-2' : ''
                    }`}
                    style={{
                      animation: `float 3s ease-in-out ${animationDelay} infinite`,
                    }}
                  >
                    <div className="flex flex-col items-center text-center h-full">
                      <div className={`flex items-center justify-center w-12 h-12 bg-emerald-100 ${tw.rounded} mb-4 group-hover:bg-emerald-200 transition-all duration-300 group-hover:scale-110`}>
                        <Icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className={`text-base font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300 mb-1`}>
                        {module.title}
                      </h3>
                      <p className={`text-sm text-gray-500 mb-3`}>{module.subtitle}</p>
                      <p className={`text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300`}>
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
        <section className="py-20 border-t border-gray-200 bg-gradient-to-br from-white via-emerald-50/30 to-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Benefits */}
              <div>
                <h2 className={`text-3xl sm:text-4xl font-bold text-gray-900 mb-8`}>
                  Transform your customer value strategy
                </h2>

                <div className="space-y-6">
                  <div className="flex gap-4 group">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors duration-300">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-gray-900 font-semibold mb-1`}>Deploy in days, not months</h3>
                      <p className={`text-gray-600 text-sm`}>
                        Get up and running quickly with our streamlined implementation process
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors duration-300">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-gray-900 font-semibold mb-1`}>Dedicated support team</h3>
                      <p className={`text-gray-600 text-sm`}>
                        Expert guidance every step of your customer value journey
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors duration-300">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-gray-900 font-semibold mb-1`}>AI-powered insights</h3>
                      <p className={`text-gray-600 text-sm`}>
                        Unified customer profiles across all channels in real-time
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors duration-300">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-gray-900 font-semibold mb-1`}>Proven ROI results</h3>
                      <p className={`text-gray-600 text-sm`}>
                        Average 45% increase in ROI within the first 6 months
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - CTA */}
              <div className="lg:pl-12 border border-gray-200 bg-white  p-8 lg:p-10 rounded-xl">
                <h3 className={`text-2xl font-bold text-gray-900 mb-3`}>
                  Ready to get started?
                </h3>
                <p className={`text-gray-600 mb-6`}>
                  Start transforming your customer relationships today.
                </p>

                <div className="flex gap-3 flex-wrap">
                  <Link
                    to="/request-account"
                    className={`inline-flex items-center px-6 py-3 bg-emerald-400 hover:bg-emerald-500 text-white font-semibold ${tw.rounded} transition-all duration-200  hover:`}
                  >
                    Request Access
                  </Link>

                  <Link
                    to="/login"
                    className={`inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-800 font-semibold ${tw.rounded} hover:bg-gray-50 hover:border-emerald-400 transition-all duration-200`}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`border-t border-gray-200 bg-gray-50 py-16`}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8">
            {/* Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <h3 className={`text-gray-900 font-semibold mb-4`}>Sentra</h3>
                <p className={`text-gray-600 text-sm leading-relaxed`}>
                  Enterprise customer value management platform for modern businesses.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className={`text-gray-900 font-semibold mb-4`}>Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/documentation" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      API Reference
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className={`text-gray-900 font-semibold mb-4`}>Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className={`text-gray-900 font-semibold mb-4`}>Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Tutorials
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Case Studies
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                      Webinars
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className={`text-gray-600 text-sm`}>
                  <p dangerouslySetInnerHTML={{ __html: t.landing.copyrightNotice }}></p>
                </div>
                <div className="flex gap-6 text-sm">
                  <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                    Privacy Policy
                  </a>
                  <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
                    Terms of Service
                  </a>
                  <a href="#" className={`text-gray-600 hover:text-emerald-600 transition-colors`}>
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
