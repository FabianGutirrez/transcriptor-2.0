import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { Patient, Transcription, ClinicalReport, UserProfile } from '../types';

export const clinicalService = {
  // Patients
  async createPatient(patient: Omit<Patient, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patient,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getPatients(therapistId: string) {
    const q = query(collection(db, 'patients'), where('therapistId', '==', therapistId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  },

  // Transcriptions
  async createTranscription(transcription: Omit<Transcription, 'id' | 'createdAt'>) {
    // Check limit first (Server side call recommended, but client side check for now)
    const therapistRef = doc(db, 'users', transcription.therapistId);
    const therapistDoc = await getDoc(therapistRef);
    const profile = therapistDoc.data() as UserProfile;

    // Hard limit for "Básico"
    if (profile.subscription === 'Básico' && profile.transcriptionCount >= 10) {
      throw new Error("Has alcanzado el límite del plan Básico.");
    }

    const docRef = await addDoc(collection(db, 'transcriptions'), {
      ...transcription,
      createdAt: new Date().toISOString(),
    });

    // Increment count
    await updateDoc(therapistRef, {
      transcriptionCount: increment(1)
    });

    return docRef.id;
  },

  // Reports
  async createReport(report: Omit<ClinicalReport, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...report,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getPatientHistory(patientId: string) {
    const transcriptionsQ = query(
      collection(db, 'transcriptions'), 
      where('patientId', '==', patientId)
    );
    const reportsQ = query(
      collection(db, 'reports'), 
      where('patientId', '==', patientId)
    );

    const [transcriptsSnapshot, reportsSnapshot] = await Promise.all([
      getDocs(transcriptionsQ),
      getDocs(reportsQ)
    ]);

    const transcriptions = transcriptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transcription));
    const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClinicalReport));

    return { transcriptions, reports };
  }
};
