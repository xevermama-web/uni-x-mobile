import { Link } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div 
      className="min-h-[100dvh] text-slate-900 font-sans bg-slate-50"
      style={{
        backgroundImage: `url('https://i.postimg.cc/zGW6Fm1Y/image.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center relative group p-1">
              <div className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/95 blur-md opacity-0 dark:opacity-100 transition-all duration-300 pointer-events-none scale-105 shadow-[0_0_20px_rgba(255,255,255,0.85)]" />
              <img src="https://i.postimg.cc/Qd32FsgX/Uni-X-Logo.png" alt="Uni-X" className="h-8 w-auto object-contain relative z-10 dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-6">
              <a href="#features" className="hidden sm:inline-block text-slate-600 hover:text-indigo-600 font-medium transition-colors text-sm">Features</a>
              <a href="#benefits" className="hidden sm:inline-block text-slate-600 hover:text-indigo-600 font-medium transition-colors text-sm">Benefits</a>
              <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors text-xs sm:text-sm px-2">Sign In</Link>
              <Link to="/login" className="bg-indigo-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm hover:bg-indigo-700 transition-colors shadow-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight"
          >
            Smart University,<br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              Better Future.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-xl text-white leading-relaxed max-w-2xl mx-auto"
          >
            A modern, unified platform designed to simplify communication and academic activities between Students, Faculty, and Administrators.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link to="/login" className="bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2">
              Enter Platform <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#features" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-semibold text-lg hover:bg-slate-50 transition-colors shadow-sm text-center">
              Explore Features
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Everything you need to manage your campus</h2>
            <p className="mt-4 text-lg text-slate-600">Powerful tools built for modern education.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
                title: "Academic Management",
                description: "Track attendance, assignments, grades, and course materials all in one centralized hub."
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-indigo-600" />,
                title: "Real-time Collaboration",
                description: "Connect instantly with study groups, private messaging, and real-time notice boards."
              },
              {
                icon: <Users className="h-6 w-6 text-indigo-600" />,
                title: "Role-based Access",
                description: "Secure, tailored dashboards for Students, Faculty, and Administrators."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <div className="flex justify-center items-center gap-2 mb-4 text-white">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">Uni-X</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Uni-X. All rights reserved.</p>
      </footer>
    </div>
  );
}
