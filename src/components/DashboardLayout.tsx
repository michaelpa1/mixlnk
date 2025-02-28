import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  AudioWaveform as Waveform,
  Radio,
  Users,
  Settings,
  LogOut,
  User2,
  Loader2,
  FileAudio
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ to, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        isActive 
          ? 'bg-indigo-500/10 text-indigo-500' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function DashboardLayout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ name: string; avatar_url: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('broadcaster_profiles')
          .select('name, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Waveform className="h-8 w-8 text-indigo-500" />
          <span className="text-xl font-semibold">Mixlnk</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <NavItem
            to="/dashboard/broadcast"
            icon={<Radio className="h-5 w-5" />}
            label="Broadcast"
            isActive={isActivePath('/dashboard/broadcast')}
          />
          <NavItem
            to="/dashboard/files"
            icon={<FileAudio className="h-5 w-5" />}
            label="Files"
            isActive={isActivePath('/dashboard/files')}
          />
          <NavItem
            to="/dashboard/listeners"
            icon={<Users className="h-5 w-5" />}
            label="Listeners"
            isActive={isActivePath('/dashboard/listeners')}
          />
          <NavItem
            to="/dashboard/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            isActive={isActivePath('/dashboard/settings')}
          />
        </nav>

        {/* User Section */}
        <div className="pt-6 border-t border-white/10">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User2 className="h-5 w-5 text-indigo-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-white/60 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut()}
            className="mt-4 flex items-center gap-2 text-white/60 hover:text-white w-full px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="h-16 border-b border-white/10 px-8 flex items-center justify-between sticky top-0 bg-[#0A0C10]/80 backdrop-blur-sm z-10">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* Add any header actions/notifications here */}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-white/60">
            <p>© 2025 MixLink. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}