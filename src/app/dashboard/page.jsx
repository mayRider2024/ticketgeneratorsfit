"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [dates, setDates] = useState([]); // list of date strings
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (res.ok) setEvents(data.events || []); else setError(data.error || 'Failed to load events');
    } catch (e) {
      setError('Network error loading events');
    }
  };

  useEffect(() => { fetchEvents(); }, []);

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
      <h1 className="text-3xl font-semibold tracking-tight">Events Dashboard</h1>

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
                <th className="p-2 font-medium">Remove</th>
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
                    <td className="p-2">
                      <button disabled={deleting === ev.id} onClick={()=>handleRemove(ev.id)} className="px-3 py-1 text-xs rounded-md border bg-red-700 border-red-600 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        {deleting === ev.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No events yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {selectedId && (
          <div className="mt-4 text-xs text-gray-400">Active Event ID: {selectedId}</div>
        )}
      </section>
    </div>
  );
}