/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Dashboard } from './pages/Dashboard';
import { TranscriptionView } from './pages/TranscriptionView';
import { AdminPanel } from './pages/AdminPanel';
import { PatientsPage } from './pages/Patients';
import { Landing } from './pages/Landing';
import { UserRole, SubscriptionPlan, UserProfile } from './types';
import { Mic, Users, ClipboardList, LogOut, Search, Plus, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Auth } from './pages/Auth';
import { Pricing } from './components/Pricing';
import { supabaseAuthService } from './services/supabaseAuthService';
import { supabase } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'patients' | 'transcription' | 'admin'>('dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setPaymentStatus('success');
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Use onSnapshot for real-time profile updates (like count)
        const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            // This case handles Google Login for new users
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              role: UserRole.THERAPIST,
              subscription: SubscriptionPlan.BASIC,
              transcriptionCount: 0,
              lastReset: new Date().toISOString(),
              professionalName: user.displayName || 'Profesional',
              healthId: 'Pendiente'
            };
            setDoc(doc(db, 'users', user.uid), newProfile);
          }
        });
        return () => profileUnsub();
      } else {
        setProfile(null);
        setView('dashboard');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => supabaseAuthService.logout();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    if (showAuth || window.location.search.includes('plan')) {
      return <Auth />;
    }
    return <Landing onGetStarted={(plan) => {
      if (plan) {
        window.history.pushState({}, '', `?plan=${plan}`);
      }
      setShowAuth(true);
    }} />;
  }

  return (
    <div className="flex h-screen w-full p-6 gap-6 bg-[#f1f5f9]">
      <AnimatePresence>
        {showPricing && <Pricing profile={profile} onClose={() => setShowPricing(false)} />}
        {paymentStatus === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-display font-bold border-b-4 border-emerald-700"
          >
            <ShieldCheck className="w-6 h-6" />
            ¡Suscripción actualizada con éxito!
            <button onClick={() => setPaymentStatus(null)} className="ml-4 text-xs opacity-50 hover:opacity-100 uppercase tracking-widest font-black">Cerrar</button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col gap-8 py-2">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">
            Transcriptor<span className="text-blue-600">Clínico</span>
          </span>
        </div>
        
        <nav className="flex flex-col gap-1">
          <div className="text-micro text-slate-400 px-2 mb-2 uppercase tracking-widest opacity-80">Gestión Clínica</div>
          <SidebarItem 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<ClipboardList className="w-4 h-4" />} 
            label="Panel Control" 
          />
          <SidebarItem 
            active={view === 'patients'} 
            onClick={() => setView('patients')} 
            icon={<Users className="w-4 h-4" />} 
            label="Pacientes" 
          />
          <SidebarItem 
            active={view === 'transcription'} 
            onClick={() => setView('transcription')} 
            icon={<Mic className="w-4 h-4" />} 
            label="Transcripciones" 
          />
          
          {profile?.role === UserRole.ADMIN && (
            <>
              <div className="text-micro text-slate-400 px-2 mb-2 mt-6 uppercase tracking-widest opacity-80">Sistema</div>
              <SidebarItem 
                active={view === 'admin'} 
                onClick={() => setView('admin')} 
                icon={<ShieldCheck className="w-4 h-4" />} 
                label="Administración" 
              />
            </>
          )}
        </nav>

        <div className="mt-auto p-4 bg-slate-800 rounded-xl text-white shadow-lg shadow-slate-200">
          <div className="text-micro text-slate-400 mb-2 uppercase">Plan Actual</div>
          <div className="font-bold mb-1 flex justify-between items-center text-sm">
            <span>{profile?.subscription}</span>
            <span className="text-xs font-normal text-slate-400">({profile?.transcriptionCount}/{profile?.subscription === 'Básico' ? '3' : profile?.subscription === 'Intermedio' ? '20' : '∞'})</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-1000"
              style={{ width: `${Math.min((profile?.transcriptionCount || 0) / (profile?.subscription === 'Básico' ? 3 : profile?.subscription === 'Intermedio' ? 20 : 100) * 100, 100)}%` }}
            />
          </div>
          <div className="text-[10px] mt-2 text-slate-400 font-medium">
            {profile?.subscription === 'Full' ? 'Acceso Ilimitado' : `${(profile?.subscription === 'Básico' ? 3 : 20) - (profile?.transcriptionCount || 0)} disponibles`}
          </div>
          {profile?.subscription !== SubscriptionPlan.FULL && (
             <button 
                onClick={() => setShowPricing(true)}
                className="w-full mt-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
              >
                Mejorar Plan
              </button>
          )}
        </div>

        <div className="flex items-center gap-3 px-2 pt-4 border-t border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-inner">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user.email}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{profile?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 font-display">
              {view === 'admin' ? 'Área de Administración' : `Bienvenido, Dr. ${user.email?.split('@')[0]}`}
            </h1>
            <p className="text-xs text-slate-500 font-medium opacity-80 uppercase tracking-wide">
              {profile?.role} • {profile?.subscription} Plan
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {view !== 'transcription' && view !== 'admin' && (
              <button 
                onClick={() => setView('transcription')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transform active:scale-95 transition-all"
              >
                Nueva Sesión
              </button>
            )}
            <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-inner">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && <Dashboard key="dashboard" profile={profile} setView={setView} />}
            {view === 'patients' && (
              <PatientsPage key="patients" profile={profile} />
            )}
            {view === 'transcription' && (
              <TranscriptionView key="transcription" profile={profile} onComplete={() => setView('dashboard')} />
            )}
            {view === 'admin' && <AdminPanel key="admin" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
        active 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className={active ? 'w-2 h-2 rounded-full bg-blue-600' : ''}>
        {!active && icon}
      </span>
      {label}
    </button>
  );
}

