'use client';

import { useUser, SignOutButton, useClerk } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminControlPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [dashboardStatus, setDashboardStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Feature toggles state
  const [featureToggles, setFeatureToggles] = useState({
    addEventSection: true,
    removeEventButton: true,
    designTicketButton: true,
    generateTicketButton: true,
    scanTicketsButton: true,
    ticketsButton: true
  });
  const [togglesLoading, setTogglesLoading] = useState(false);

  // Check if user is admin
  const isAdmin = user?.emailAddresses[0]?.emailAddress === 'lokemayuresh6dz@student.sfit.ac.in';

  useEffect(() => {
    if (isLoaded && !user) {
      // Don't redirect immediately, let user see the unauthorized message
      console.log('No user found');
    }
    if (isLoaded && user && !isAdmin) {
      // Don't redirect immediately, let user see the unauthorized message
      console.log('User not admin:', user.emailAddresses[0]?.emailAddress);
    }
  }, [user, isLoaded, isAdmin]);

  useEffect(() => {
    // Fetch current dashboard status
    fetchDashboardStatus();
    // Fetch current feature toggles
    fetchFeatureToggles();
  }, []);

  const fetchDashboardStatus = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-status');
      const data = await response.json();
      if (data.success) {
        setDashboardStatus(data.enabled);
      }
    } catch (error) {
      console.error('Error fetching dashboard status:', error);
    }
  };

  const toggleDashboardStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !dashboardStatus }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setDashboardStatus(!dashboardStatus);
        setMessage(`Dashboard content ${!dashboardStatus ? 'made visible' : 'hidden'} successfully!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to update dashboard status');
      }
    } catch (error) {
      console.error('Error toggling dashboard:', error);
      setMessage('Network error updating dashboard status');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureToggles = async () => {
    try {
      const response = await fetch('/api/admin/feature-toggles');
      const data = await response.json();
      if (data.success) {
        setFeatureToggles(data.toggles);
      }
    } catch (error) {
      console.error('Error fetching feature toggles:', error);
    }
  };

  const updateFeatureToggle = async (toggleName, value) => {
    setTogglesLoading(true);
    try {
      const updatedToggles = {
        ...featureToggles,
        [toggleName]: value
      };

      const response = await fetch('/api/admin/feature-toggles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toggles: updatedToggles }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setFeatureToggles(updatedToggles);
        setMessage(`${toggleName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${value ? 'enabled' : 'disabled'} successfully!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to update feature toggle');
      }
    } catch (error) {
      console.error('Error updating feature toggle:', error);
      setMessage('Network error updating feature toggle');
    } finally {
      setTogglesLoading(false);
    }
  };

  const handleLoginWithDifferentAccount = async () => {
    try {
      // Sign out the current user and redirect to admin login
      await signOut();
      router.push('/admin-login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback: just redirect to admin login
      router.push('/admin-login');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Ticket Generator Admin</h1>
            <p className="text-red-400 mb-6">
              {!user 
                ? "Authentication required. Please login to access admin controls."
                : "Your account is not authorized. Only the configured admin email may access."
              }
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                if (!user) {
                  router.push('/admin-login');
                } else {
                  handleLoginWithDifferentAccount();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              {!user ? "Login as Admin" : "Login with Different Account"}
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Only <span className="text-blue-400">lokemayuresh6dz@student.sfit.ac.in</span> can access this area.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </button>
              <div className="border-l border-gray-600 h-6"></div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
                <p className="text-gray-400">Welcome, {user.firstName || 'Mayuresh'}</p>
              </div>
            </div>
            <SignOutButton>
              <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Control Card */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Dashboard Content Control</h2>
              <p className="text-gray-400">Control the visibility of dashboard content for users</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Content Visibility</span>
              <button
                onClick={toggleDashboardStatus}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  dashboardStatus ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    dashboardStatus ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${dashboardStatus ? 'text-green-400' : 'text-red-400'}`}>
                {dashboardStatus ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Status Display */}
          <div className={`p-4 rounded-lg border ${
            dashboardStatus 
              ? 'bg-green-900/20 border-green-700 text-green-300' 
              : 'bg-red-900/20 border-red-700 text-red-300'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                dashboardStatus ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <p className="font-medium">
                Dashboard content is currently {dashboardStatus ? 'VISIBLE' : 'HIDDEN'}
              </p>
            </div>
            <p className="text-sm mt-2 opacity-75">
              {dashboardStatus 
                ? 'Users can see and use all dashboard features' 
                : 'Dashboard content is hidden from users'}
            </p>
          </div>
        </div>

        {/* Feature Toggles Card */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Feature Controls</h2>
            <p className="text-gray-400">Control the visibility of specific features and buttons</p>
          </div>

          {/* Feature Toggle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Add Event Section Toggle */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Add Event Section</h3>
                <button
                  onClick={() => updateFeatureToggle('addEventSection', !featureToggles.addEventSection)}
                  disabled={togglesLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    featureToggles.addEventSection ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      featureToggles.addEventSection ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-400 text-sm">Show/hide the entire add event form section</p>
              <div className={`mt-2 text-xs font-medium ${
                featureToggles.addEventSection ? 'text-green-400' : 'text-red-400'
              }`}>
                {featureToggles.addEventSection ? 'VISIBLE' : 'HIDDEN'}
              </div>
            </div>

            {/* Remove Event Button Toggle */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Remove Button</h3>
                <button
                  onClick={() => updateFeatureToggle('removeEventButton', !featureToggles.removeEventButton)}
                  disabled={togglesLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    featureToggles.removeEventButton ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      featureToggles.removeEventButton ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-400 text-sm">Show/hide event remove/delete buttons</p>
              <div className={`mt-2 text-xs font-medium ${
                featureToggles.removeEventButton ? 'text-green-400' : 'text-red-400'
              }`}>
                {featureToggles.removeEventButton ? 'VISIBLE' : 'HIDDEN'}
              </div>
            </div>

            {/* Design Ticket Button Toggle */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Design Ticket</h3>
                <button
                  onClick={() => updateFeatureToggle('designTicketButton', !featureToggles.designTicketButton)}
                  disabled={togglesLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    featureToggles.designTicketButton ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      featureToggles.designTicketButton ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-400 text-sm">Show/hide the Design Ticket button</p>
              <div className={`mt-2 text-xs font-medium ${
                featureToggles.designTicketButton ? 'text-green-400' : 'text-red-400'
              }`}>
                {featureToggles.designTicketButton ? 'VISIBLE' : 'HIDDEN'}
              </div>
            </div>

            {/* Generate Ticket Button Toggle */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Generate Ticket</h3>
                <button
                  onClick={() => updateFeatureToggle('generateTicketButton', !featureToggles.generateTicketButton)}
                  disabled={togglesLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    featureToggles.generateTicketButton ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      featureToggles.generateTicketButton ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-400 text-sm">Show/hide the Generate Ticket button</p>
              <div className={`mt-2 text-xs font-medium ${
                featureToggles.generateTicketButton ? 'text-green-400' : 'text-red-400'
              }`}>
                {featureToggles.generateTicketButton ? 'VISIBLE' : 'HIDDEN'}
              </div>
            </div>

            {/* Scan Tickets Button Toggle */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Scan Tickets</h3>
                <button
                  onClick={() => updateFeatureToggle('scanTicketsButton', !featureToggles.scanTicketsButton)}
                  disabled={togglesLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    featureToggles.scanTicketsButton ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      featureToggles.scanTicketsButton ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-400 text-sm">Show/hide the Scan Tickets button</p>
              <div className={`mt-2 text-xs font-medium ${
                featureToggles.scanTicketsButton ? 'text-green-400' : 'text-red-400'
              }`}>
                {featureToggles.scanTicketsButton ? 'VISIBLE' : 'HIDDEN'}
              </div>
            </div>

            {/* Tickets Button Toggle */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Tickets List</h3>
                <button
                  onClick={() => updateFeatureToggle('ticketsButton', !featureToggles.ticketsButton)}
                  disabled={togglesLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    featureToggles.ticketsButton ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      featureToggles.ticketsButton ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-400 text-sm">Show/hide the Tickets button</p>
              <div className={`mt-2 text-xs font-medium ${
                featureToggles.ticketsButton ? 'text-green-400' : 'text-red-400'
              }`}>
                {featureToggles.ticketsButton ? 'VISIBLE' : 'HIDDEN'}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {(loading || togglesLoading) && (
            <div className="mt-6 flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-gray-400">
                {loading ? 'Updating dashboard status...' : 'Updating feature toggles...'}
              </span>
            </div>
          )}

          {/* Success/Error Message */}
          {message && (
            <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-700">
              <p className="text-blue-300">{message}</p>
            </div>
          )}
        </div>

        {/* Additional Admin Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">System Status</h3>
            <p className="text-gray-400 mb-4">Monitor system health and performance</p>
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm">All systems operational</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
            <p className="text-gray-400 mb-4">Manage user access and permissions</p>
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              View Users →
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Event Analytics</h3>
            <p className="text-gray-400 mb-4">View event statistics and reports</p>
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              View Analytics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}