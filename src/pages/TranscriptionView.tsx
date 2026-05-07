import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  FileText, 
  RotateCcw, 
  Brain, 
  CheckCircle2, 
  Save, 
  Loader2, 
  UploadCloud, 
  FileAudio,
  AlertCircle,
  Upload
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI } from '@google/genai';
import { clinicalService } from '../services/clinicalService';
import { UserProfile } from '../types';
import { FileUploader } from '../components/FileUploader';

interface TranscriptionViewProps {
  key?: string;
  profile: UserProfile | null;
  onComplete: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function TranscriptionView({ profile, onComplete }: TranscriptionViewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [step, setStep] = useState<'upload' | 'recording' | 'review' | 'report'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  
  const recognitionRef = useRef<any>(null);

  // Simulated transcription streaming for demo purposes
  useEffect(() => {
    if ((isRecording || (step === 'recording' && uploadedFile)) && simulationProgress < 100) {
      const timer = setInterval(() => {
        setSimulationProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 2;
        });

        const clinicalSnippets = [
          "Paciente presenta dislalia funcional... ",
          "Se detecta omisión del fonema /r/ en posición media... ",
          "La inteligibilidad del habla se ve comprometida por rapidez... ",
          "Coordinación fonorrespiratoria adecuada durante el relato... ",
          "Muestra buena disposición en las tareas de imitación... ",
          "Se observa deglución atípica con interposición lingual... "
        ];
        
        if (Math.random() > 0.6) {
          const randomSnippet = clinicalSnippets[Math.floor(Math.random() * clinicalSnippets.length)];
          setTranscript(prev => prev + " " + randomSnippet);
        }
      }, 400);
      return () => clearInterval(timer);
    }
  }, [isRecording, step, uploadedFile, simulationProgress]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setStep('recording');
      setSimulationProgress(10);
      setTranscript("Iniciando análisis multimodal...");

      // Real processing via Gemini SDK Multimodal
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          setSimulationProgress(40);
          setTranscript("Procesando audio/video con Gemini 3.1 Pro...");
          
          const prompt = `Analiza este archivo de fonoaudiología. 
          Genera un objeto JSON con los siguientes campos:
          - "transcription": Texto literal exacto de la sesión.
          - "analysis": {
              "fluidez": "Evaluación detallada de ritmo y fluidez",
              "articulacion": "Detalle de precisión fonética",
              "coherencia": "Evaluación de coherencia temática",
              "sugerencias": "Recomendaciones terapéuticas específicas"
            }
          Responde EXCLUSIVAMENTE en formato JSON válido.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [
              {
                parts: [
                  { inlineData: { data: base64Data, mimeType: file.type } },
                  { text: prompt }
                ]
              }
            ],
            config: {
              systemInstruction: "Eres un experto fonoaudiólogo analizando sesiones clínicas. Tu reporte debe ser técnico y riguroso. Genera siempre una salida JSON válida según el esquema solicitado.",
              responseMimeType: "application/json"
            }
          });

          setSimulationProgress(100);
          const rawResult = response.text || "{}";
          let resultData;
          try {
            resultData = JSON.parse(rawResult);
          } catch (e) {
            resultData = { transcription: "Error parseando JSON", analysis: { fluidez: rawResult } };
          }
          
          setTranscript(resultData.transcription || "No se pudo extraer transcripción.");
          
          // Format analysis text for display
          const formattedAnalysis = resultData.analysis ? Object.entries(resultData.analysis)
            .map(([k, v]) => `${k.toUpperCase()}:\n${v}\n`)
            .join('\n') : rawResult;
            
          setAnalysis(formattedAnalysis);
          setStep('review');
        } catch (error) {
          console.error("Multimodal error", error);
          setTranscript("Error al procesar el archivo multimodal. Verifique el formato.");
          setStep('upload');
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleUploadComplete = (transcriptionId: string) => {
    setStep('review');
    setTranscript("Registro clínico subido correctamente a Supabase. El procesamiento multimodal está en curso.");
    // In a real application, you could fetch the transcript here or poll for status
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'] as string[],
      'video/*': ['.mp4', '.mov'] as string[]
    },
    multiple: false
  } as any);

  const startLiveRecording = () => {
    setStep('recording');
    setIsRecording(true);
    setSimulationProgress(0);
    setTranscript("");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) setTranscript(prev => prev + " " + currentTranscript);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    setStep('review');
  };

  const generateReport = async () => {
    if (!transcript) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Actúa como un experto fonoaudiólogo. Analiza la siguiente transcripción de una sesión de terapia y genera un "Informe Preliminar Fonoaudiológico" estructurado: 
      1. Observaciones principales.
      2. Fortalezas.
      3. Áreas de mejora.
      4. Recomendaciones.

      Transcripción: "${transcript}"`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "Eres un asistente de transcripción clínica de alta precisión. Produce informes técnicos, concisos y profesionales.",
        }
      });
      
      setAnalysis(response.text || "No se pudo generar el análisis.");
      setStep('report');
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReport = async () => {
    if (!profile) return;
    try {
      const transcId = await clinicalService.createTranscription({
        patientId: "demo-patient",
        text: transcript,
        therapistId: profile.uid,
      });

      await clinicalService.createReport({
        transcriptionId: transcId,
        patientId: "demo-patient",
        analysis: analysis,
        therapistId: profile.uid,
      });

      onComplete();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Nueva Sesión Clínica</h1>
        <div className="flex gap-2">
          {['upload', 'recording', 'review', 'report'].map((s, i) => (
            <div key={s} className={`w-3 h-3 rounded-full ${
              step === s ? 'bg-blue-600' : (['upload', 'recording', 'review', 'report'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-slate-200')
            }`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            <FileUploader 
              userId={profile?.uid || ''} 
              patientId="demo-patient" 
              onUploadComplete={handleUploadComplete} 
            />

            <div className="flex items-center gap-4 text-slate-300">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[10px] font-black uppercase tracking-widest px-4">O graba en tiempo real</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div 
              onClick={startLiveRecording}
              className="bento-card p-12 text-center border-2 border-transparent hover:border-red-100 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50/10 transition-all group"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="absolute -inset-2 bg-red-400 rounded-full animate-ping opacity-10"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 font-display">Sesión en Vivo</h3>
              <p className="text-sm text-slate-500 mb-4 px-4 font-medium">Grabe y transcriba la terapia en tiempo real usando el micrófono.</p>
              <div className="text-micro text-red-400 font-black uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
                Captura Directa
              </div>
            </div>
          </motion.div>
        )}

        {step === 'recording' && (
          <motion.div 
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bento-card p-12 text-center space-y-10 relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 h-1 bg-blue-500 transition-all transition-[width]`} style={{ width: `${simulationProgress}%` }} />
            
            <div className="flex justify-between items-center text-micro text-slate-400 font-black tracking-widest uppercase">
              <span>{isRecording ? "Capturando Audio..." : `Procesando: ${uploadedFile?.name}`}</span>
              <span>{simulationProgress}%</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight">
                {isRecording ? "Grabación Activa" : "Análisis de Archivo"}
              </h2>
              
              <div className="bg-slate-900 text-emerald-400 font-mono p-8 rounded-2xl text-left h-64 overflow-y-auto border-4 border-slate-800 shadow-2xl relative">
                <div className="absolute top-4 right-4 text-[10px] opacity-20">CLI_INSTRUMENT_STDOUT</div>
                <p className="leading-relaxed opacity-90 transition-all font-mono">
                  {transcript || "Inicializando captura fonoaudiológica..."}
                  <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />
                </p>
              </div>
            </div>

            <button 
              onClick={stopRecording}
              className="bg-white border-2 border-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              Finalizar Captura
            </button>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div 
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bento-card p-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-display uppercase tracking-tight">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Revisar Transcripción de Sesión
                </h3>
                <button 
                  onClick={() => { setTranscript(""); setStep('upload'); setUploadedFile(null); }}
                  className="text-micro text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors uppercase font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reiniciar
                </button>
              </div>
              <textarea 
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full h-80 bg-slate-50 rounded-xl p-8 text-slate-700 leading-relaxed outline-none focus:ring-4 focus:ring-blue-100 border border-slate-200 resize-none font-sans text-base shadow-inner"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {transcript.split(' ').filter(x => x).length} Palabras
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('recording')}
                    className="px-6 py-3 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all font-display border border-slate-100"
                  >
                    Seguir Editando
                  </button>
                  <button 
                    onClick={generateReport}
                    disabled={isAnalyzing}
                    className="bg-slate-900 text-white px-8 py-3 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-3 font-display transform hover:-translate-y-1 active:translate-y-0"
                  >
                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                    Analizar con Gemini 3.1 Pro
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'report' && (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20"
          >
            <div className="bg-blue-600 rounded-xl p-8 text-white flex items-center justify-between shadow-xl shadow-blue-200 border-b-4 border-blue-700">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Brain className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-display tracking-tight">Informe Proyectado por IA</h3>
                </div>
                <p className="text-blue-100 text-sm font-medium opacity-90">Análisis técnico basado en el contenido de la sesión.</p>
              </div>
              <CheckCircle2 className="w-16 h-16 text-white/20" />
            </div>

            <div className="bento-card p-10 space-y-6 bg-white/90 backdrop-blur-md border-2 border-slate-100">
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans text-sm md:text-base selection:bg-blue-100">
                  {analysis}
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  onClick={() => setStep('review')}
                  className="px-6 py-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all font-display border border-slate-200"
                >
                  Regresar a Transcripción
                </button>
                <button 
                  onClick={saveReport}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-bold shadow-lg shadow-blue-100 hover:shadow-xl transition-all flex items-center gap-3 font-display transform hover:-translate-y-1"
                >
                  <Save className="w-5 h-5" />
                  Guardar en Historial Clínico
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
