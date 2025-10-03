"use client";
import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function SessionClearer() {
  const { signOut } = useClerk();

  useEffect(() => {
    const clearSession = async () => {
      try {
        // Clear all browser storage
        if (typeof window !== 'undefined') {
          // Clear localStorage
          localStorage.clear();
          
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Clear cookies related to authentication
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos) : c;
            if (name.trim().includes('clerk') || name.trim().includes('auth') || name.trim().includes('session')) {
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
          });
          
          // Force Clerk signout
          await signOut({ redirectUrl: '/' });
        }
      } catch (error) {
        console.log('Session clearing process completed');
      }
    };

    // Run immediately on component mount
    clearSession();
  }, [signOut]);

  return null; // This component doesn't render anything
}