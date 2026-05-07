import { motion } from 'motion/react';
import { 
  Mic, 
  Clock, 
  FileCheck, 
  Shield, 
  ArrowRight, 
  Check, 
  Zap, 
  Star,
  BrainCircuit,
  MessageSquareQuote
} from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface LandingProps {
  onGetStarted: (plan?: string) => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  const plans = [
    {
      name: SubscriptionPlan.BASIC,
      price: "0",
      description: "Ideal para iniciar práctica clínica independiente.",
      features: [
        "3 Transcripciones / mes",
        "Informes Estándar por IA",
        "Acceso desde 1 dispositivo",
        "Soporte por comunidad"
      ],
      icon: <Zap className="w-5 h-5" />,
      color: "bg-slate-100 text-slate-600",
      highlight: false
    },
    {
      name: SubscriptionPlan.INTERMEDIATE,
      price: "29",
      description: "Para profesionales con flujo constante de pacientes.",
      features: [
        "20 Transcripciones / mes",
        "Informes Detallados Avanzados",
        "Gestión de hasta 50 pacientes",
        "Historial ilimitado",
        "Análisis de fluidez"
      ],
      icon: <Shield className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-600",
      highlight: true
    },
    {
      name: SubscriptionPlan.FULL,
      price: "69",
      description: "La herramienta definitiva para clínicas y expertos.",
      features: [
        "Transcripciones Ilimitadas",
        "Exportación PDF con logo propio",
        "Soporte prioritario 24/7",
        "Asistente de diagnóstico IA",
        "Gestión multi-paciente"
      ],
      icon: <Star className="w-5 h-5" />,
      color: "bg-indigo-600 text-white shadow-lg",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Mic className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-slate-900">FonoAudio<span className="text-blue-600">AI</span></span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#precios" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Precios</a>
            <button 
              onClick={() => onGetStarted()}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95"
            >
              Acceder
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/30 blur-[120px] rounded-full -z-10 translate-y-[-20%]"></div>
        
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-blue-100"
          >
            <BrainCircuit className="w-4 h-4" />
            Impulsado por Gemini 1.5 Pro
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 font-display tracking-tight leading-[1.1]"
          >
            Menos papeleo,<br />
            <span className="text-blue-600 italic">más tiempo clínico.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed"
          >
            La primera IA diseñada específicamente para fonoaudiólogos. Transcribe sesiones, genera informes clínicos automáticos y organiza tus expedientes en segundos.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => onGetStarted(SubscriptionPlan.BASIC)}
              className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-black tracking-tight hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 group"
            >
              Comenzar Gratis
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-white border-2 border-slate-100 text-slate-700 px-10 py-5 rounded-2xl text-lg font-black tracking-tight hover:border-slate-300 transition-all"
            >
              Ver Planes
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-12 flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale"
          >
            <span className="font-display font-bold text-xl">CLINIC_PLUS</span>
            <span className="font-display font-bold text-xl">NEURO_PATH</span>
            <span className="font-display font-bold text-xl">SALA_HABLA</span>
            <span className="font-display font-bold text-xl">LOGOS_CENTER</span>
          </motion.div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bento-card p-10 space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900">Ahorro de 4hs Semanales</h3>
              <p className="text-slate-500 font-medium">Automatiza la escritura de informes. Gemini analiza la sesión y redacta las conclusiones clínicas por ti.</p>
            </div>
            <div className="bento-card p-10 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900">Precisión Multimodal</h3>
              <p className="text-slate-500 font-medium">Detecta errores articulatorios, pausas y patrones de fluidez tanto en audio como en video.</p>
            </div>
            <div className="bento-card p-10 space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900">Privacidad HIPAA-Ready</h3>
              <p className="text-slate-500 font-medium">Tus datos médicos están encriptados en Supabase con políticas de acceso nivel militar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-32 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black font-display tracking-tight">Precios Transparentes</h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium">Sin contratos ocultos. Elige la potencia que tu clínica necesita para escalar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <motion.div 
                key={plan.name}
                whileHover={{ y: -10 }}
                className={`p-10 rounded-[2.5rem] flex flex-col relative overflow-hidden backdrop-blur-xl border border-white/5 ${
                  plan.highlight ? 'bg-white/10 ring-2 ring-blue-500/50' : 'bg-white/5'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-10 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-b-xl shadow-xl">
                    Más Popular
                  </div>
                )}

                <div className="mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.color}`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold font-display">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-2 h-10">{plan.description}</p>
                </div>

                <div className="mb-10">
                  <span className="text-5xl font-black tracking-tight">${plan.price}</span>
                  <span className="text-slate-500 font-bold ml-2">/ mes</span>
                </div>

                <div className="flex-1 space-y-5 mb-12">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => onGetStarted(plan.name)}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                    plan.highlight 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-900/50' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  Mejorar Plan
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left space-y-4">
             <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                <Mic className="w-3 h-3" />
              </div>
              <span className="font-display font-black text-lg tracking-tight text-slate-900">FonoAudio AI</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Automatizando el análisis clínico para los expertos del habla.</p>
          </div>
          <div className="flex gap-12 text-sm font-black text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600">Privacidad</a>
            <a href="#" className="hover:text-blue-600">Términos</a>
            <a href="#" className="hover:text-blue-600">Contacto</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">© 2024 FonoAudio Labs. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
