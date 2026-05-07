import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Mail, 
  Lock, 
  User, 
  IdCard, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  ChevronLeft,
  Zap
} from 'lucide-react';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { SubscriptionPlan } from '../types';

export function Auth() {
  const [isLogin, setIsLogin] = useState(() => {
    return !window.location.search.includes('plan');
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get('plan') as SubscriptionPlan | null;

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [professionalName, setProfessionalName] = useState("");
  const [healthId, setHealthId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await supabaseAuthService.login(email, password);
      } else {
        await supabaseAuthService.register(
          email, 
          password, 
          professionalName, 
          healthId, 
          selectedPlan || SubscriptionPlan.BASIC
        );
        setIsLogin(true);
        setError("Registro exitoso. Por favor verifica tu correo si es necesario.");
      }
    } catch (err: any) {
       setError(err.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 p-8 md:p-10 border border-slate-100 relative overflow-hidden"
      >
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full -ml-16 -mb-16 blur-3xl opacity-50"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Mic className="w-6 h-6 text-white" />
            </div>
            {!isLogin && (
              <button 
                onClick={() => setIsLogin(true)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Volver al Login
              </button>
            )}
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-2 font-display tracking-tight">
            {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </h2>
          {selectedPlan && !isLogin && (
            <div className="mb-6 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 animate-pulse">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Plan Seleccionado: {selectedPlan}</span>
            </div>
          )}
          <p className="text-slate-500 text-sm mb-8 font-medium">
            {isLogin 
              ? "Ingresa tus credenciales para acceder al panel profesional." 
              : "Regístrate para empezar a transcribir tus sesiones con IA."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required
                      type="text"
                      placeholder="Nombre Profesional" 
                      value={professionalName}
                      onChange={(e) => setProfessionalName(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="relative">
                    <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required
                      type="text"
                      placeholder="Nº Registro de Salud (RNP)" 
                      value={healthId}
                      onChange={(e) => setHealthId(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                required
                type="email"
                placeholder="Correo Electrónico" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                required
                type="password"
                placeholder="Contraseña" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? "Iniciar Sesión" : "Crear Perfil Clínico"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-slate-400">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya eres miembro?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 font-bold hover:underline"
            >
              {isLogin ? "Regístrate ahora" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
