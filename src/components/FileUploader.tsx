import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileAudio, FileVideo, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  userId: string;
  patientId: string;
  onUploadComplete: (transcriptionId: string) => void;
}

export function FileUploader({ userId, patientId, onUploadComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    disabled: uploading
  } as any);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    setProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('patientId', patientId);

    try {
      // Usamos XMLHttpRequest para rastrear el progreso de subida real
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90); // Dejamos 10% para el procesamiento en server
          setProgress(percent);
        }
      });

      const responsePromise = new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error('Error en el servidor'));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Error de red'));
      });

      xhr.open('POST', '/api/clinical/upload');
      xhr.send(formData);

      const result: any = await responsePromise;
      
      setProgress(100);
      setStatus('success');
      setTimeout(() => {
        onUploadComplete(result.transcriptionId);
      }, 1000);

    } catch (err: any) {
      console.error("Upload Error:", err);
      setError("No se pudo subir el archivo. Intente nuevamente.");
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`
            relative bento-card p-12 border-2 border-dashed transition-all cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-100">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 font-display">Sube la sesión clínica</p>
              <p className="text-sm text-slate-500 font-medium">Arrastra el audio o video aquí (.mp3, .mp4, .wav)</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-500 rounded-full">Max 100MB</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-500 rounded-full">Audio/Video</span>
            </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-8 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                {file.type.startsWith('video') ? <FileVideo className="w-6 h-6" /> : <FileAudio className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            {!uploading && (
              <button 
                onClick={() => setFile(null)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.button
                key="btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleUpload}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98]"
              >
                Iniciar Subida Segura
              </motion.button>
            )}

            {status === 'uploading' && (
              <motion.div key="progress" className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-600">
                  <span>Subiendo al servidor...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  />
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-sm font-bold">¡Subida completada! Iniciando procesamiento...</span>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                key="error"
                className="space-y-4"
              >
                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                  <AlertCircle className="w-6 h-6" />
                  <span className="text-sm font-bold">{error}</span>
                </div>
                <button 
                  onClick={handleUpload}
                  className="w-full text-xs font-black uppercase text-blue-600 hover:underline"
                >
                  Reintentar subida
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
