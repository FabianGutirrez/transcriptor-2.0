import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Users, Mic, FileText, TrendingUp, Clock, Plus, ChevronRight, Activity, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

interface DashboardProps {
  key?: string;
  profile: UserProfile | null;
  setView: (view: 'dashboard' | 'patients' | 'transcription') => void;
}

export function Dashboard({ profile, setView }: DashboardProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchRecentSessions();
    }
  }, [profile]);

  const fetchRecentSessions = async () => {
    try {
      const q = query(
        collection(db, 'sessions'), 
        where('userId', '==', profile?.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(docs);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-6 grid-rows-4 gap-4 h-full"
    >
      {/* Activity Table Card */}
      <div className="col-span-4 row-span-3 bento-card p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-800 font-display uppercase tracking-tight">Historial de Sesiones</h2>
          <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">Gestionar Pacientes</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : sessions.length > 0 ? (
            <table className="w-full text-left">
              <thead className="text-micro text-slate-400 border-b border-slate-100 uppercase font-black tracking-widest">
                <tr className="h-10">
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {sessions.map(session => (
                  <SessionRow 
                    key={session.id}
                    name={session.patientName || "Sin Nombre"} 
                    date={session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString() : 'Procesando...'} 
                    type={session.type || 'Live'}
                    status="Completado" 
                    statusColor="bg-emerald-100 text-emerald-700" 
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center"><Activity className="w-6 h-6" /></div>
              <p className="text-xs font-medium">No hay actividad registrada aún.</p>
              <button 
                onClick={() => setView('transcription')}
                className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
              >
                Empezar Primera Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reports Stat Card */}
      <div className="col-span-2 row-span-2 bento-card p-6 flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/50">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <div className="text-3xl font-black text-slate-800 tabular-nums tracking-tight">{profile?.transcriptionCount || 0}</div>
          <div className="text-sm text-slate-500 font-medium font-display">Sesiones Realizadas</div>
          <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 w-fit px-2 py-1 rounded-lg uppercase tracking-tight">
            <TrendingUp className="w-3 h-3" /> Plan {profile?.subscription}
          </div>
        </div>
      </div>

      {/* Quick Access Card */}
      <button 
        onClick={() => setView('transcription')}
        className="col-span-2 row-span-1 bento-card p-4 flex items-center gap-4 border-l-4 border-l-blue-500 hover:bg-slate-50 transition-all text-left"
      >
        <div className="text-micro text-slate-400 font-black uppercase">Nueva</div>
        <div className="flex-1 font-bold text-slate-700 text-sm font-display">Iniciar Transcripción</div>
        <div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:text-blue-600">
          <Plus className="w-4 h-4" />
        </div>
      </button>

      {/* Next Appointment Card */}
      <div className="col-span-2 row-span-1 bento-card p-5 bg-slate-900 text-white flex items-center justify-between shadow-lg shadow-slate-200">
        <div className="flex flex-col">
          <span className="text-micro opacity-50 uppercase font-black tracking-widest">Próxima Cita</span>
          <span className="font-bold text-lg font-display">14:30 - Clara Lutz</span>
        </div>
        <div className="text-[10px] uppercase font-black bg-white/10 px-2 py-1 rounded tracking-widest backdrop-blur-sm border border-white/10">
          En 15 min
        </div>
      </div>

      {/* Collaborators Card */}
      <div className="col-span-4 row-span-1 bento-card p-5 flex items-center gap-8 border-b-4 border-b-slate-100">
        <div className="flex -space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">JS</div>
          <div className="w-9 h-9 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm">AM</div>
          <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-600">KV</div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-800 font-display">Red de Colaboración</div>
          <div className="text-micro text-slate-400 font-medium uppercase tracking-tight">3 profesionales en línea</div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-micro text-slate-400 font-bold uppercase tracking-widest">Cloud DB Live</span>
        </div>
      </div>
    </motion.div>
  );
}

function SessionRow({ name, date, type, status, statusColor }: { key?: string, name: string, date: string, type: string, status: string, statusColor: string }) {
  return (
    <tr className="h-14 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer group">
      <td><span className="font-bold text-slate-700 tracking-tight font-display">{name}</span></td>
      <td><span className="text-slate-500 text-xs font-medium">{date}</span></td>
      <td>
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-tighter bg-slate-100 px-2 py-0.5 rounded italic">
          {type}
        </span>
      </td>
      <td><span className={`px-3 py-1 ${statusColor} text-[10px] font-black uppercase rounded-lg tracking-wider`}>{status}</span></td>
    </tr>
  );
}
