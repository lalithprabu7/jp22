import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, User, Mail, LogOut, ShieldCheck, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, logout, login } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = () => {
    if (!user) return;
    
    // In a real app, we would call the backend API here: api.put('/auth/profile', { name, email })
    // For now, we update local context to simulate it.
    login(localStorage.getItem('cw_token') || '', { ...user, name, email });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings className="text-indigo-400" /> Platform Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar / Navigation */}
        <div className="col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium flex items-center gap-3">
            <User size={18} /> Profile Details
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800/50 text-slate-400 transition-colors flex items-center gap-3">
            <ShieldCheck size={18} /> Security & RBAC
          </button>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="card p-6 bg-slate-900/50 backdrop-blur-xl border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Your Profile</h2>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-slate-300"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white shadow-lg shadow-indigo-500/20"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-xl">
                  <span className="text-3xl font-bold text-white">
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{name}</h3>
                  <p className="text-slate-400">{user?.role} Account</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-rose-500/5 border-rose-500/10">
            <h2 className="text-lg font-bold text-rose-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-slate-400 mb-4">Logging out will end your current session and require you to sign in again.</p>
            <button 
              onClick={logout}
              className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border border-rose-500/20"
            >
              <LogOut size={16} /> Logout from Platform
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
