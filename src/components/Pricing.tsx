import { motion } from 'motion/react';
import { Check, Zap, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { UserProfile, SubscriptionPlan } from '../types';

interface PricingProps {
  profile: UserProfile | null;
  onClose: () => void;
}

export function Pricing({ profile, onClose }: PricingProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      name: SubscriptionPlan.BASIC,
      price: "0",
      description: "Ideal para iniciar práctica clínica independiente.",
      features: [
        "3 Transcripciones / mes",
        "Informes Estándar por IA",
        "Historial básico (30 días)",
        "Soporte por comunidad"
      ],
      icon: <Zap className="w-5 h-5" />,
      color: "bg-slate-100 text-slate-600",
      buttonText: "Plan Actual",
      stripePriceId: "",
      disabled: profile?.subscription === SubscriptionPlan.BASIC
    },
    {
      name: SubscriptionPlan.INTERMEDIATE,
      price: "29",
      description: "Para profesionales con flujo constante de pacientes.",
      features: [
        "20 Transcripciones / mes",
        "Informes Detallados Avanzados",
        "Historial Ilimitado",
        "Soporte prioritario por email",
        "Análisis de Fluidez y Articulación"
      ],
      icon: <Shield className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-600",
      buttonText: "Mejorar ahora",
      stripePriceId: "price_intermediate_id", // Mock or replace with real ID
      disabled: profile?.subscription === SubscriptionPlan.INTERMEDIATE
    },
    {
      name: SubscriptionPlan.FULL,
      price: "69",
      description: "La herramienta definitiva para clínicas y expertos.",
      features: [
        "Transcripciones Ilimitadas",
        "Exportación PDF Personalizada",
        "Análisis Multimodal Completo",
        "Asistente de Diagnóstico IA 24/7",
        "Gestión de Multi-pacientes"
      ],
      icon: <Crown className="w-5 h-5" />,
      color: "bg-indigo-600 text-white shadow-lg shadow-indigo-100",
      buttonText: "Plan Ultimate",
      stripePriceId: "price_full_id", // Mock or replace with real ID
      featured: true,
      disabled: profile?.subscription === SubscriptionPlan.FULL
    }
  ];

  const handleSubscribe = async (plan: string, priceId: string) => {
    if (!profile) return;
    if (!priceId) return; // Basic plan has no priceId

    setLoading(plan);
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.uid,
          plan: plan,
          priceId: priceId
        })
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-6xl w-full bg-slate-50 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 font-bold text-sm tracking-widest uppercase bg-white px-4 py-2 rounded-full shadow-sm"
        >
          Cerrar
        </button>

        <div className="p-12 md:p-16">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 font-display tracking-tight">Elige tu potencia clínica</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Mejora tu plan para desbloquear más transcripciones y análisis fonoaudiológicos avanzados con Gemini 1.5 Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`bento-card relative p-8 md:p-10 flex flex-col ${
                  plan.featured ? 'ring-4 ring-indigo-500/20 border-indigo-200' : ''
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    Recomendado
                  </div>
                )}

                <div className="flex items-center justify-between mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.color}`}>
                    {plan.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-900 font-display tabular-nums">${plan.price}</span>
                    <span className="text-xs font-bold text-slate-400 block uppercase">/ mes</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 font-display">{plan.name}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{plan.description}</p>

                <div className="flex-1 space-y-4 mb-10">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-4 h-4 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={plan.disabled || loading === plan.name}
                  onClick={() => handleSubscribe(plan.name, plan.stripePriceId)}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 ${
                    plan.featured 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:shadow-indigo-200'
                      : 'bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  } disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent`}
                >
                  {loading === plan.name ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {plan.buttonText}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
