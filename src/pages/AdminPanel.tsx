import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, UserRole, SubscriptionPlan } from '../types';
import { 
  UserCog, 
  Save, 
  Shield, 
  CreditCard, 
  Loader2, 
  Users, 
  TrendingUp, 
  Activity, 
  Mic, 
  Search, 
  RotateCcw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  totalTranscriptions: number;
  monthlyRevenue: number;
  activeToday: number;
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, mRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/metrics')
      ]);
      const uData = await uRes.json();
      const mData = await mRes.json();
      setUsers(uData);
      setMetrics(mData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, data: any) => {
    setUpdating(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to update user", error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.professionalName && u.professionalName.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading && !metrics) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Panel de Super Admin</h1>
          <p className="text-slate-500 font-medium mt-1">Control global de la infraestructura y usuarios.</p>
        </div>
        <div className="bg-amber-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-amber-200">
          <Shield className="w-4 h-4" />
          Seguridad Nivel 4
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Usuarios Totales" 
          value={metrics?.totalUsers || 0} 
          icon={<Users className="w-5 h-5" />} 
          color="bg-blue-600" 
        />
        <MetricCard 
          title="Activos hoy" 
          value={metrics?.activeToday || 0} 
          icon={<Activity className="w-5 h-5" />} 
          color="bg-emerald-600" 
        />
        <MetricCard 
          title="Trascripciones" 
          value={metrics?.totalTranscriptions || 0} 
          icon={<Mic className="w-5 h-5" />} 
          color="bg-indigo-600" 
        />
        <MetricCard 
          title="Ingresos Est. (MRR)" 
          value={`$${metrics?.monthlyRevenue || 0}`} 
          icon={<TrendingUp className="w-5 h-5" />} 
          color="bg-slate-900" 
        />
      </div>

      {/* User Management Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-display">
            <UserCog className="w-5 h-5 text-blue-600" />
            Gestión de Cuentas Profesionales
          </h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por email o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-2xl py-2.5 pl-12 pr-6 text-sm w-full md:w-80 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-micro text-slate-400 uppercase tracking-widest font-black">Profesional</th>
                  <th className="px-6 py-5 text-micro text-slate-400 uppercase tracking-widest font-black">Plan & Status</th>
                  <th className="px-6 py-5 text-micro text-slate-400 uppercase tracking-widest font-black">Consumo</th>
                  <th className="px-6 py-5 text-micro text-slate-400 uppercase tracking-widest font-black text-right">Acciones Directas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(user => (
                  <UserAdminRow 
                    key={user.uid} 
                    user={user} 
                    onUpdate={updateUser} 
                    isUpdating={updating === user.uid}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string, value: any, icon: any, color: string }) {
  return (
    <div className="bento-card p-6 group hover:scale-[1.02] transition-all">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200/20`}>
        {icon}
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-2xl font-black text-slate-900 font-display">{value}</div>
    </div>
  );
}

function UserAdminRow({ user, onUpdate, isUpdating }: { key?: string, user: UserProfile, onUpdate: any, isUpdating: boolean }) {
  const [role, setRole] = useState(user.role);
  const [plan, setPlan] = useState(user.subscription);

  return (
    <tr className="hover:bg-slate-100/50 transition-colors group">
      <td className="px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-blue-600 text-xs shadow-sm group-hover:scale-110 transition-transform">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate font-display">{user.professionalName || 'Sin Nombre'}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="space-y-2">
          <select 
            value={plan}
            onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
            className="w-full bg-white border-2 border-slate-100 rounded-xl py-1.5 px-3 text-[10px] font-black text-slate-700 outline-none focus:border-blue-500 transition-all uppercase tracking-tighter"
          >
            <option value={SubscriptionPlan.BASIC}>Plan Básico</option>
            <option value={SubscriptionPlan.INTERMEDIATE}>Plan Intermedio</option>
            <option value={SubscriptionPlan.FULL}>Plan Full</option>
          </select>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${user.role === UserRole.ADMIN ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{user.role}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-black text-slate-800 tabular-nums">
            <span>{user.transcriptionCount}</span>
            <span className="text-slate-300">/ {plan === SubscriptionPlan.BASIC ? '3' : plan === SubscriptionPlan.INTERMEDIATE ? '20' : '∞'}</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${user.transcriptionCount > 0 ? 'bg-blue-600' : 'bg-slate-300'}`} 
              style={{ width: `${Math.min(user.transcriptionCount / (plan === 'Básico' ? 3 : plan === 'Intermedio' ? 20 : 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-6 py-6 border-l border-slate-50">
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={() => onUpdate(user.uid, { transcriptionCount: 0 })}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Resetear Límites"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onUpdate(user.uid, { role, subscription: plan })}
            disabled={isUpdating || (role === user.role && plan === user.subscription)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 disabled:opacity-30 transition-all shadow-md active:scale-95"
          >
            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : (
              <>
                <Save className="w-3 h-3" />
                Guardar
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
