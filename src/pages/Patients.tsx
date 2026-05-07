import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Download, 
  User as UserIcon,
  ArrowLeft,
  Clock,
  ExternalLink,
  Plus,
  Loader2
} from 'lucide-react';
import { clinicalService } from '../services/clinicalService';
import { Patient, UserProfile, Transcription, ClinicalReport } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PatientsPageProps {
  profile: UserProfile | null;
  key?: string;
}

export function PatientsPage({ profile }: PatientsPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<{ transcriptions: Transcription[], reports: ClinicalReport[] }>({ transcriptions: [], reports: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (profile) {
      fetchPatients();
    }
  }, [profile]);

  const fetchPatients = async () => {
    if (!profile) return;
    try {
      const data = await clinicalService.getPatients(profile.uid);
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    try {
      const history = await clinicalService.getPatientHistory(patient.id);
      setPatientHistory(history);
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const exportToPDF = (report: ClinicalReport, transcript: string) => {
    if (!selectedPatient || !profile) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME FONOAUDIOLÓGICO", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Generado por Transcriptor Clínico AI", pageWidth - 20, 25, { align: 'right' });

    // Patient Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL PACIENTE", 20, 55);
    
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(20, 58, pageWidth - 20, 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${selectedPatient.name}`, 20, 65);
    doc.text(`Edad: ${selectedPatient.age} años`, 20, 72);
    doc.text(`Fecha del Informe: ${new Date(report.createdAt).toLocaleDateString()}`, pageWidth - 20, 65, { align: 'right' });

    // Therapist Info
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL PROFESIONAL", 20, 85);
    doc.line(20, 88, pageWidth - 20, 88);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Fonoaudiólogo: ${profile.professionalName || profile.email}`, 20, 95);
    doc.text(`Registro Salud: ${profile.healthId || 'Pendiente'}`, 20, 102);

    // Analysis Sections
    doc.setFont("helvetica", "bold");
    doc.text("ANÁLISIS CLÍNICO", 20, 115);
    doc.line(20, 118, pageWidth - 20, 118);

    let yPos = 125;
    const analysis = report.analysis;
    const sections = typeof analysis === 'string' ? { "Informe": analysis } : analysis;

    Object.entries(sections).forEach(([title, content]) => {
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), 20, yPos);
      yPos += 7;
      
      doc.setFont("helvetica", "normal");
      const splitContent = doc.splitTextToSize(content as string, pageWidth - 40);
      doc.text(splitContent, 20, yPos);
      yPos += (splitContent.length * 5) + 10;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Signature Placeholder
    const bottom = doc.internal.pageSize.getHeight() - 40;
    doc.setDrawColor(30, 41, 59);
    doc.line(pageWidth - 80, bottom, pageWidth - 20, bottom);
    doc.setFontSize(8);
    doc.text("Firma del Profesional", pageWidth - 50, bottom + 5, { align: 'center' });
    doc.text(profile.professionalName || profile.email, pageWidth - 50, bottom + 10, { align: 'center' });

    doc.save(`Informe_${selectedPatient.name}_${new Date().getTime()}.pdf`);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.age.toString().includes(search)
  );

  if (selectedPatient) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <button 
          onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm tracking-tight transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al listado
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-100 border-4 border-white">
              <UserIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight">{selectedPatient.name}</h1>
              <p className="text-slate-500 font-medium">{selectedPatient.age} años • Paciente desde {new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200">
            <Plus className="w-4 h-4" />
            Nueva Nota Clínica
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-display">
              <Clock className="w-5 h-5 text-blue-600" />
              Línea de Tiempo de Sesiones
            </h2>
            
            {loadingHistory ? (
              <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
            ) : patientHistory.transcriptions.length === 0 ? (
              <div className="bento-card p-12 text-center text-slate-400 space-y-4">
                <Calendar className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No hay sesiones registradas</p>
              </div>
            ) : (
              <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
                {patientHistory.transcriptions.map((t, idx) => {
                  const report = patientHistory.reports.find(r => r.transcriptionId === t.id);
                  return (
                    <motion.div 
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative pl-14"
                    >
                      <div className="absolute left-4 top-2 w-4 h-4 bg-white border-4 border-blue-600 rounded-full z-10" />
                      <div className="bento-card p-6 hover:shadow-xl transition-all border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              {new Date(t.createdAt).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <h3 className="font-bold text-slate-800 font-display">Sesión de Análisis Multimodal</h3>
                          </div>
                          {report && (
                            <button 
                              onClick={() => exportToPDF(report, t.text)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-xs font-bold"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </button>
                          )}
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 line-clamp-2 italic mb-4">
                          "{t.text}"
                        </div>

                        {report && (
                          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-3 h-3 text-indigo-500" />
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">Análisis IA</span>
                            </div>
                            <div className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-3">
                              {typeof report.analysis === 'string' ? report.analysis : JSON.stringify(report.analysis, null, 2)}
                            </div>
                            <button className="mt-3 text-indigo-600 text-[10px] font-bold flex items-center gap-1 hover:underline">
                              Ver informe completo <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bento-card p-6 bg-slate-900 text-white">
              <h3 className="font-bold mb-4 font-display">Información de Contacto</h3>
              <div className="space-y-3">
                <div className="text-xs">
                  <span className="text-slate-500 block mb-1">Teléfono</span>
                  <span className="font-medium">{selectedPatient.phone || 'No registrado'}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-500 block mb-1">Email</span>
                  <span className="font-medium underline">contacto@paciente.com</span>
                </div>
              </div>
            </div>

            <div className="bento-card p-6">
              <h3 className="font-bold text-slate-800 mb-4 font-display">Estadísticas Clínicas</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Sesiones Totales</span>
                  <span className="font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{patientHistory.transcriptions.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Informes IA</span>
                  <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{patientHistory.reports.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight">Expediente Clínico</h1>
          <p className="text-slate-500 font-medium">Gestiona y consulta el historial de tus {patients.length} pacientes.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o edad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-sm w-full md:w-80 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bento-card h-40 bg-slate-100/50 animate-pulse" />
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bento-card p-20 text-center space-y-4">
          <Users className="w-16 h-16 mx-auto text-slate-200" />
          <p className="text-slate-400 font-bold uppercase tracking-widest uppercase">No se encontraron pacientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <motion.div 
              key={patient.id}
              whileHover={{ y: -5 }}
              onClick={() => handleSelectPatient(patient)}
              className="bento-card p-6 cursor-pointer group hover:bg-blue-50/20 transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 font-display group-hover:text-blue-700 transition-colors">{patient.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{patient.age} años • {patient.phone || 'S/N'}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Actualizado hoy
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}

          <button className="bento-card p-6 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/10 flex flex-col items-center justify-center gap-3 group transition-all">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-500 font-display">Añadir Paciente</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
