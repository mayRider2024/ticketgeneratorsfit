'use client';

import { SignIn, useClerk } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLoginPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [secretCode, setSecretCode] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretError, setSecretError] = useState('');

  const isAdmin = user?.emailAddresses[0]?.emailAddress === 'lokemayuresh6dz@student.sfit.ac.in';
  const CORRECT_SECRET = 'ilovekrishna';

  useEffect(() => {
    if (isLoaded && user && isAdmin) {
      // Show secret code input instead of auto-redirecting
      setShowSecretInput(true);
    }
  }, [user, isLoaded, isAdmin, router]);

  const handleSecretSubmit = (e) => {
    e.preventDefault();
    if (secretCode === CORRECT_SECRET) {
      router.push('/admin-control');
    } else {
      setSecretError('Incorrect secret code. Please try again.');
      setSecretCode('');
    }
  };

  if (showSecretInput) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Verification</h1>
            <p className="text-gray-400">Enter the secret code to continue</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
            <form onSubmit={handleSecretSubmit} className="space-y-4">
              <div>
                <label htmlFor="secretCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Secret Code
                </label>
                <input
                  type="password"
                  id="secretCode"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter secret code"
                  required
                />
              </div>
              
              {secretError && (
                <div className="text-red-400 text-sm">{secretError}</div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Verify Access
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Main Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-gray-400">Server administrator login required</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <SignIn 
            redirectUrl="/admin-login"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-gray-800 border-gray-700 shadow-none",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                formFieldInput: "bg-gray-700 border-gray-600 text-white",
                formFieldLabel: "text-gray-300",
                identityPreviewText: "text-gray-300",
                identityPreviewEditButton: "text-blue-400",
              }
            }}
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
    </div>
  );
}