import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    let email = loginId;

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        throw new Error("Supabase is not configured. Password reset is not available in local preview.");
      }

      // If it's not an email, assume it's a student ID and lookup the email
      if (!email.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('academic_id', email)
          .maybeSingle();
        
        if (profileError || !profileData || !profileData.email) {
          throw new Error("Student ID not found or no associated email.");
        }
        email = profileData.email;
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col justify-center py-12 sm:px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex justify-center items-center mb-6 relative group p-2">
          <div className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/95 blur-md opacity-0 dark:opacity-100 transition-all duration-300 pointer-events-none scale-105 shadow-[0_0_20px_rgba(255,255,255,0.85)]" />
          <img src="https://i.postimg.cc/Qd32FsgX/Uni-X-Logo.png" alt="Uni-X" className="h-12 w-auto object-contain relative z-10 dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your email or student ID to receive a reset link.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-xl py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-white">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Check your email</h3>
              <p className="text-sm text-slate-500 mb-6">
                We've sent a password reset link to your email address.
              </p>
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email or Student ID
                </label>
                <div className="mt-2 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="block w-full pl-10 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder="you@university.edu or Student ID"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !loginId}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center mt-4">
                <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
