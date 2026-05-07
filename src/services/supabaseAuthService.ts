import { supabase } from '../lib/supabase';
import { UserRole, SubscriptionPlan } from '../types';

export const supabaseAuthService = {
  async register(email: string, pass: string, professionalName: string, healthId: string, plan: SubscriptionPlan = SubscriptionPlan.BASIC) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          professional_name: professionalName,
          health_id: healthId,
          subscription: plan
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // Logic to sync with 'profiles' table in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user.id, 
            email: email,
            role: UserRole.THERAPIST,
            subscription: plan,
            professional_name: professionalName,
            health_id: healthId,
            transcription_count: 0
          }
        ]);
      
      if (profileError) console.error("Error creating profile", profileError);
    }

    return authData;
  },

  async login(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
