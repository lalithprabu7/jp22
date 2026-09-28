import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, {
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#03050a]">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-[#0c101b]/80 backdrop-blur-2xl border border-white/10 shadow-2xl z-10">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <ShieldCheck size={28} className="text-cyan-400" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-2">Create Account</h2>
        <p className="text-slate-400 text-center text-sm mb-8">Join ContractWatch Enterprise</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                placeholder="Lalith"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
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
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
}
