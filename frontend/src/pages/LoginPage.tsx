import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPass });
      login(res.data.token, {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      });
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#03050a]">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-[#0c101b]/80 backdrop-blur-2xl border border-white/10 shadow-2xl z-10">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <ShieldCheck size={28} className="text-indigo-400" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-slate-400 text-center text-sm mb-8">Sign in to manage your enterprise contracts</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                placeholder="lalith@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setEmail('admin@contractwatch.com');
              setPassword('password');
              doLogin('admin@contractwatch.com', 'password');
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all disabled:opacity-50"
          >
            Use Demo Account
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
