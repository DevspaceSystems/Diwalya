'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { requestForToken } from '@/lib/firebase';
import { updateFcmToken } from '@/app/actions/user';

export default function FCMHandler() {
  useEffect(() => {
    const setupFCM = async (userId: string) => {
      try {
        // Request Permission and Get Token
        const token = await requestForToken();
        if (token) {
          console.log('[FCMHandler] Registering token for user:', userId);
          await updateFcmToken(userId, token);
        }
      } catch (error) {
        console.error('[FCMHandler] Error during setup:', error);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        if (session?.user?.id) {
          setupFCM(session.user.id);
        }
      }
    });

    // Initial check if session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setupFCM(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
