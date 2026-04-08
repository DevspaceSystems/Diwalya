'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { requestForToken } from '@/lib/firebase';
import { updateFcmToken } from '@/app/actions/user';

export default function FCMHandler() {
  useEffect(() => {
    const setupFCM = async (userId: string) => {
      console.log('[FCMHandler] Starting setup for user:', userId);
      try {
        // Check for Notification API support
        if (!('Notification' in window)) {
          console.warn('[FCMHandler] Notifications not supported in this browser.');
          return;
        }

        console.log('[FCMHandler] Current permission status:', Notification.permission);
        
        if (Notification.permission === 'denied') {
          console.warn('[FCMHandler] Notifications are blocked by the user.');
          return;
        }

        // Request Permission and Get Token
        const token = await requestForToken();
        if (token) {
          console.log('[FCMHandler] Token retrieved. Syncing with database...');
          const result = await updateFcmToken(userId, token);
          if (result.success) {
            console.log('[FCMHandler] ✅ Token successfully registered in database.');
          } else {
            console.error('[FCMHandler] ❌ Failed to register token in database:', result.error);
          }
        } else {
          console.warn('[FCMHandler] No token was generated. Please check VAPID key and network.');
        }
      } catch (error) {
        console.error('[FCMHandler] ❌ Error during setup:', error);
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
