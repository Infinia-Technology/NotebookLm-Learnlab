import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Zap, Users,
  Globe, Lock, Command, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { ThemeToggle } from '../components/common';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';

export function LandingPage() {
  const { config, loading } = useSystemConfig();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-4 border-[var(--btn-primary-bg)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { app } = config;

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 relative font-sans selection:bg-[var(--btn-primary-bg)] selection:text-white">
      <AnimatedBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-100 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20"></div>
              <img
                src="/logo-icon.svg"
                alt={app.name}
                className="w-8 h-8 relative z-10"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.outerHTML = `<div class="w-8 h-8 bg-gradient-to-br from-[var(--btn-primary-bg)] to-blue-600 rounded-lg flex items-center justify-center shadow-lg"><span class="text-white font-bold text-sm">${app.name.charAt(0).toUpperCase()}</span></div>`;
                }}
              />
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">{app.name}</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#testimonials" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
            <Link
              to="/auth/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <Link to="/auth/signup">
              <Button variant="primary" size="sm" className="rounded-full px-6 shadow-lg shadow-blue-500/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">

            {/* Announcement Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-medium mb-8 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">NEW</span>
              <span>AI-Powered Learning Paths Available</span>
              <ChevronRight className="w-3 h-3" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-text-primary mb-8 tracking-tight leading-[1.1]"
            >
              Transform your workforce <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 animate-gradient">
                with enterprise learning
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The enterprise-grade learning management platform for modern organizations.
              Empower your teams with courses, certifications, and skill development at scale.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            >
              <Link to="/auth/signup">
                <Button size="xl" className="rounded-full px-8 text-lg bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl shadow-gray-200 dark:shadow-none transition-all hover:scale-105">
                  Start Learning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="xl" className="rounded-full px-8 text-lg border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 backdrop-blur-sm">
                  Explore Courses
                </Button>
              </Link>
            </motion.div>

            {/* Visual Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative max-w-5xl mx-auto perspective-1000"
            >
              <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shadow-2xl overflow-hidden aspect-[16/9] group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-transparent opacity-50"></div>

                {/* Mock UI Header */}
                <div className="h-10 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 inline-block font-mono">
                      app.{app.name.toLowerCase()}.com
                    </div>
                  </div>
                </div>

                {/* Mock UI Content */}
                <div className="p-6 grid grid-cols-4 gap-6 h-full bg-gray-50/50 dark:bg-black/20">
                  {/* Sidebar */}
                  <div className="col-span-1 border-r border-gray-200/50 dark:border-gray-800/50 pr-6 space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                      <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded" />
                      </div>
                      <span>My Courses</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800/50">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                      <span>Progress</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800/50">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                      <span>Certificates</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800/50">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                      <span>Leaderboard</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800/50">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                      <span>Settings</span>
                    </div>
                  </div>
                  {/* Main Content */}
                  <div className="col-span-3 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-3 rounded bg-gray-800 dark:bg-gray-200 w-32 font-bold" />
                        <div className="h-2 rounded bg-gray-400 dark:bg-gray-600 w-24" />
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-medium shadow-sm">+ New Course</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Active Learners', value: '8,543', change: '+18.5%', color: 'blue' },
                        { label: 'Courses', value: '156', change: '+12.3%', color: 'green' },
                        { label: 'Certificates', value: '2,847', change: '+24.1%', color: 'purple' }
                      ].map((stat, i) => (
                        <div key={i} className="aspect-video rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 p-4 space-y-2">
                          <div className="text-[8px] text-gray-500 dark:text-gray-400 font-medium uppercase">{stat.label}</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                          <div className={`text-[8px] font-medium ${stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                              'text-purple-600 dark:text-purple-400'
                            }`}>
                            ↗ {stat.change}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="h-32 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 p-4">
                      <div className="text-[8px] text-gray-500 dark:text-gray-400 font-medium uppercase mb-3">Learning Activity</div>
                      <div className="flex items-end justify-between h-16 gap-1">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 70].map((height, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </motion.div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="py-12 border-y border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-8">
              Trusted by engineering teams at
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholders for logos */}
              {['Acme Corp', 'GlobalBank', 'TechStart', 'Nebula', 'Velocity'].map((company, i) => (
                <div key={i} className="flex items-center gap-2 font-bold text-xl text-gray-500 dark:text-gray-500">
                  <div className="w-6 h-6 rounded bg-current opacity-60" />
                  {company}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition - Bento Grid */}
        <section id="features" className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Everything you need to ship
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Stop reinventing the wheel. We've built the foundation so you can focus on what makes your product unique.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              {/* Card 1 - Large Span */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-2 row-span-1 rounded-3xl bg-blue-50/50 dark:bg-gray-900/50 border-2 border-blue-400/80 dark:border-gray-800 p-8 relative overflow-hidden group shadow-[0_4px_20px_-2px_rgba(59,130,246,0.3)] dark:shadow-none hover:shadow-[0_8px_30px_-4px_rgba(59,130,246,0.5)] hover:border-blue-500 transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-sm">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Enterprise-Grade Security</h3>
                  <p className="text-gray-700 dark:text-gray-400 max-w-md">
                    SOC2-ready authentication, role-based access control, and audit logs built-in. Sleep soundly knowing your data is secure.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-[0.07] dark:opacity-20 translate-x-12 translate-y-12 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-500">
                  <Lock className="w-full h-full text-blue-600" />
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-1 row-span-1 rounded-3xl bg-purple-50/50 dark:bg-gray-900/50 border-2 border-purple-400/80 dark:border-gray-800 p-8 relative overflow-hidden group shadow-[0_4px_20px_-2px_rgba(168,85,247,0.3)] dark:shadow-none hover:shadow-[0_8px_30px_-4px_rgba(168,85,247,0.5)] hover:border-purple-500 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Blazing Fast</h3>
                <p className="text-gray-700 dark:text-gray-400">
                  Built on React 19 and Vite. Zero-latency transitions and optimized assets.
                </p>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/20 dark:group-hover:bg-purple-500/30 transition-colors" />
              </motion.div>

              {/* Card 3 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-1 row-span-1 rounded-3xl bg-green-50/50 dark:bg-gray-900/50 border-2 border-green-400/80 dark:border-gray-800 p-8 relative overflow-hidden group shadow-[0_4px_20px_-2px_rgba(34,197,94,0.3)] dark:shadow-none hover:shadow-[0_8px_30px_-4px_rgba(34,197,94,0.5)] hover:border-green-500 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/20 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Team Ready</h3>
                <p className="text-gray-700 dark:text-gray-400">
                  Multi-tenancy support with team invites, roles, and permissions out of the box.
                </p>
              </motion.div>

              {/* Card 4 - Large Span */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-2 row-span-1 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-800 text-white p-8 relative overflow-hidden group border-2 border-gray-700/50 dark:border-gray-800 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3)] dark:shadow-none hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)] hover:border-gray-600 transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center text-white mb-6 shadow-sm">
                    <Command className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Developer Experience First</h3>
                  <p className="text-gray-100 dark:text-gray-300 max-w-md">
                    Fully typed, documented, and tested. We've handled the boilerplate so you can write the code that matters.
                  </p>
                  <div className="mt-8 flex gap-3">
                    <div className="px-3 py-1 rounded bg-white/20 dark:bg-white/10 text-xs font-mono shadow-sm">TypeScript</div>
                    <div className="px-3 py-1 rounded bg-white/20 dark:bg-white/10 text-xs font-mono shadow-sm">Python</div>
                    <div className="px-3 py-1 rounded bg-white/20 dark:bg-white/10 text-xs font-mono shadow-sm">Docker</div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-blue-500/30 dark:from-blue-600/20 to-transparent" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-white dark:bg-black border-y border-gray-100 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: "Active Users", value: "10k+" },
                { label: "Uptime", value: "99.9%" },
                { label: "Countries", value: "150+" },
                { label: "Deployment", value: "< 2min" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20 dark:opacity-40"></div>
            <Card className="relative bg-white dark:bg-black/80 border border-gray-100 dark:border-white/10 p-12 md:p-20 text-center rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to transform your development?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
                Join thousands of developers building the future with {app.name}.
                Get started for free, no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/auth/signup">
                  <Button size="xl" variant="primary" className="w-full sm:w-auto px-10 rounded-full shadow-lg shadow-blue-500/25">
                    Get Started Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto px-10 rounded-full">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-white/10 pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/logo-icon.svg"
                  alt={app.name}
                  className="w-8 h-8"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.outerHTML = `<div class="w-8 h-8 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center"><span class="text-white font-bold text-sm">${app.name.charAt(0).toUpperCase()}</span></div>`;
                  }}
                />
                <span className="text-xl font-bold text-gray-900 dark:text-white">{app.name}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                The enterprise-grade starter kit for modern engineering teams. Build better, faster, together.
              </p>
              <div className="flex gap-4">
                {/* Social Icons Placeholder */}
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer">
                    <Globe className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4 text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Resources</h4>
              <ul className="space-y-4 text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-500 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Legal</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} {app.name} Inc. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
