"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [name, setName] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [dates, setDates] = useState([]); // list of date strings
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [accessAllowed, setAccessAllowed] = useState(null);
  const [dashboardEnabled, setDashboardEnabled] = useState(true);
  
  // Feature toggles state
  const [featureToggles, setFeatureToggles] = useState({
    addEventSection: true,
    removeEventButton: true,
    designTicketButton: true,
    generateTicketButton: true,
    scanTicketsButton: true,
    ticketsButton: true
  });

  // Check dashboard access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-status');
        const data = await response.json();
        
        if (data.success) {
          setDashboardEnabled(data.enabled);
          setAccessAllowed(true);
        } else {
          setAccessAllowed(true); // Default to allow on error
          setDashboardEnabled(true);
        }
      } catch (error) {
        console.error('Error checking dashboard access:', error);
        setAccessAllowed(true); // Default to allow on error
        setDashboardEnabled(true);
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

    checkAccess();
    fetchFeatureToggles();
  }, [router]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (res.ok) setEvents(data.events || []); else setError(data.error || 'Failed to load events');
    } catch (e) {
      setError('Network error loading events');
    }
  };

  useEffect(() => { 
    if (accessAllowed) {
      fetchEvents(); 
    }
  }, [accessAllowed]);

  // Show loading while checking access or Clerk is loading
  if (accessAllowed === null || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated (but don't auto-redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-4">Please sign in to access the dashboard.</p>
          <button 
            onClick={() => router.push('/')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const addDate = () => {
    if (!dateInput) return;
    if (!dates.includes(dateInput)) setDates([...dates, dateInput]);
    setDateInput('');
  };

  const removeDate = (d) => setDates(dates.filter(x => x !== d));

  const resetForm = () => {
    setName('');
    setDates([]);
    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Event name required');
    if (dates.length === 0) return setError('At least one date required');
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dates, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      resetForm();
      await fetchEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    router.push(`/dashboard/event/${id}`);
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this event?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      if (selectedId === id) setSelectedId(null);
      await fetchEvents();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-12">
      {/* Dashboard header */}
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
        <h1 className="text-3xl font-semibold tracking-tight">Events Dashboard</h1>
      </div>

      {/* Conditionally show content based on dashboard status */}
      {dashboardEnabled ? (
        <>
          {/* Add Event Section - only shown when enabled */}
          {featureToggles.addEventSection && (
            <section className="border border-gray-700 rounded-lg p-6 bg-gray-900/40">
              <h2 className="text-lg font-medium mb-4">Add Event</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-gray-300">Event Name *</span>
                    <input value={name} onChange={e=>setName(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Conference 2025" />
                  </label>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-gray-300">Add Date(s) *</span>
                    <div className="flex gap-2">
                      <input type="date" value={dateInput} onChange={e=>setDateInput(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600 w-full" />
                      <button type="button" onClick={addDate} className="px-3 py-2 bg-gray-700 rounded text-white text-xs hover:bg-gray-600">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dates.map(d => (
                        <span key={d} className="px-2 py-1 text-xs bg-indigo-600/70 rounded flex items-center gap-1">
                          {d}
                          <button type="button" onClick={()=>removeDate(d)} className="text-white/80 hover:text-white">×</button>
                        </span>
                      ))}
                      {dates.length === 0 && <span className="text-xs text-gray-500">No dates added</span>}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="text-gray-300">Description (optional)</span>
                    <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Short description" />
                  </label>
                </div>
                {error && <div className="text-sm text-red-400">{error}</div>}
                <div className="flex gap-3">
                  <button disabled={loading} type="submit" className="px-5 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Adding...' : 'Add Event'}
                  </button>
                  <button type="button" onClick={resetForm} className="px-4 py-2 rounded-md bg-gray-700 text-white text-sm hover:bg-gray-600">Reset</button>
                </div>
              </form>
            </section>
          )}

          <section className="border border-gray-700 rounded-lg p-6 bg-gray-900/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Events ({events.length})</h2>
              <button onClick={fetchEvents} className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left bg-gray-800/70">
                    <th className="p-2 font-medium">Name</th>
                    <th className="p-2 font-medium">Dates</th>
                    <th className="p-2 font-medium">Created</th>
                    <th className="p-2 font-medium">Select</th>
                    {featureToggles.removeEventButton && (
                      <th className="p-2 font-medium">Remove</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => {
                    const selected = ev.id === selectedId;
                    return (
                      <tr key={ev.id} className={selected ? 'bg-indigo-950/60' : 'odd:bg-gray-800/30'}>
                        <td className="p-2 whitespace-nowrap">{ev.name}</td>
                        <td className="p-2">{ev.dates.join(', ')}</td>
                        <td className="p-2 whitespace-nowrap text-xs text-gray-400">{new Date(ev.createdAt).toLocaleString()}</td>
                        <td className="p-2">
                          <button onClick={()=>handleSelect(ev.id)} className={`px-3 py-1 text-xs rounded-md border ${selected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'}`}>
                            {selected ? 'Selected' : 'Select'}
                          </button>
                        </td>
                        {featureToggles.removeEventButton && (
                          <td className="p-2">
                            <button disabled={deleting === ev.id} onClick={()=>handleRemove(ev.id)} className="px-3 py-1 text-xs rounded-md border bg-red-700 border-red-600 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                              {deleting === ev.id ? 'Removing...' : 'Remove'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={featureToggles.removeEventButton ? 5 : 4} className="p-4 text-center text-gray-500">No events yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {selectedId && (
              <div className="mt-4 text-xs text-gray-400">Active Event ID: {selectedId}</div>
            )}
          </section>
        </>
      ) : (
        /* When content is hidden, show empty space or a subtle message */
        <div className="flex flex-col items-center justify-center min-h-[400px] opacity-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m0 0l6.121 6.121" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Dashboard content is currently unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
}