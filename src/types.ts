export enum UserRole {
  ADMIN = "Admin",
  THERAPIST = "Fonoaudiólogo",
}

export enum SubscriptionPlan {
  BASIC = "Básico",
  INTERMEDIATE = "Intermedio",
  FULL = "Full",
}

export const PLAN_LIMITS = {
  [SubscriptionPlan.BASIC]: 3,
  [SubscriptionPlan.INTERMEDIATE]: 20,
  [SubscriptionPlan.FULL]: Infinity
};

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  subscription: SubscriptionPlan;
  transcriptionCount: number;
  lastReset: string;
  professionalName?: string;
  healthId?: string;
}

export interface Patient {
  id?: string;
  name: string;
  birthDate: string;
  clinicalHistory: string;
  therapistId: string;
  createdAt: string;
}

export interface Transcription {
  id?: string;
  patientId: string;
  text: string;
  audioUrl?: string;
  therapistId: string;
  createdAt: string;
  metadata?: any;
}

export interface ClinicalReport {
  id?: string;
  transcriptionId: string;
  patientId: string;
  analysis: string;
  therapistId: string;
  createdAt: string;
}
