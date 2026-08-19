import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logoutUser } from '../lib/authSession';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let email = loginId.trim();

    try {
      // 1. Mandatory logout of previous session before authenticating new credentials
      await logoutUser();

      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        throw new Error("Supabase is not configured.");
      }

      // Check admin credentials
      if (email === 'admin@unixx.com' && password === 'admin@3bsk') {
        localStorage.setItem('unixx_admin_session', 'true');
        localStorage.setItem('unixx_role', 'admin');
        navigate('/dashboard', { replace: true });
        return;
      }

      // Check moderators table
      const { data: moderator } = await supabase
        .from('moderators')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();
              
      if (moderator) {
        localStorage.setItem('unixx_moderator_session', JSON.stringify(moderator));
        localStorage.setItem('unixx_role', 'moderator');
        navigate('/moderator-dashboard', { replace: true });
        return;
      }

      // Check faculties table
      const { data: faculty } = await supabase
        .from('faculties')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (faculty) {
        localStorage.setItem('unixx_faculty_session', JSON.stringify(faculty));
        localStorage.setItem('unixx_role', 'faculty');
        navigate('/faculty-dashboard', { replace: true });
        return;
      }

      if (!email.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('academic_id', email)
          .maybeSingle();
        
        if (profileError || !profileData || !profileData.email) {
          throw new Error("Student ID not found.");
        }
        email = profileData.email;
      }

      // Authenticate strictly with newly entered credentials
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        await logoutUser();
        throw authErr;
      }
      
      if (data.user) {
        localStorage.setItem('unixx_student_session', JSON.stringify(data.user));
        localStorage.setItem('unixx_role', 'student');
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Authentication failed. User session not created.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-[100dvh] flex flex-col justify-center py-12 sm:px-4 sm:px-6 lg:px-8 font-sans relative"
      style={{
        backgroundImage: `url('https://i.postimg.cc/13RzVKq2/Chat-GPT-Image-Aug-3-2026-11-22-42-AM.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 sm:mt-8 sm:mx-auto w-full max-w-sm sm:max-w-md px-3 sm:px-0 relative z-10"
      >
        <div className="bg-white/40 backdrop-blur-xl py-8 sm:py-10 px-4 sm:px-12 shadow-2xl rounded-2xl sm:rounded-[2rem] border border-white/20 flex flex-col items-center">
          
          <Link to="/" className="flex justify-center items-center mb-2 relative group p-2">
            <div className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/95 blur-md opacity-0 dark:opacity-100 transition-all duration-300 pointer-events-none scale-105 shadow-[0_0_20px_rgba(255,255,255,0.85)]" />
            <img src="https://i.postimg.cc/Qd32FsgX/Uni-X-Logo.png" alt="Uni-X" className="h-16 w-auto object-contain drop-shadow-md relative z-10 dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
          </Link>
          
          <h2 className="mt-2 mb-8 text-center text-3xl font-bold italic font-serif" style={{ color: '#00cccc', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
            Sign in to your account
          </h2>

          <form className="space-y-6 w-full" onSubmit={handleLogin}>
            
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-1">
                Email or Student ID
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#f5ebe6] border-none rounded-2xl text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-shadow font-medium"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-black mb-1">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 pr-12 bg-[#f5ebe6] border-none rounded-2xl text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-shadow font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-black hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-slate-300 rounded bg-transparent"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm italic text-black">
                Remember me
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-lg font-bold italic font-serif text-black bg-gradient-to-b from-[#ffdb19] to-[#e6a800] hover:from-[#ffe34d] hover:to-[#ffbb00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Sign in'}
              </button>
            </div>
            
            <div className="pt-4 border-t border-white/50 text-center">
              <Link to="/forgot-password" className="font-bold italic font-serif text-[#cc0000] hover:text-[#ff0000] underline decoration-1 underline-offset-4 text-base" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.3)' }}>
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

