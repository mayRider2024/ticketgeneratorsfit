"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EventActions({ event }) {
  const router = useRouter();
  const [featureToggles, setFeatureToggles] = useState({
    designTicketButton: true,
    generateTicketButton: true,
    scanTicketsButton: true,
    ticketsButton: true
  });

  useEffect(() => {
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

    fetchFeatureToggles();
  }, []);

  const handleDesign = () => {
    router.push(`/dashboard/event/${event.id}/design`);
  };

  const handleGenerate = () => {
    router.push(`/dashboard/event/${event.id}/generate`);
  };
  const handleScan = () => {
    router.push(`/dashboard/event/${event.id}/scan`);
  };
  const handleTickets = () => {
    router.push(`/dashboard/event/${event.id}/tickets`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 flex-wrap">
        {featureToggles.designTicketButton && (
          <button onClick={handleDesign} className="px-5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500">Design Ticket</button>
        )}
        {featureToggles.generateTicketButton && (
          <button onClick={handleGenerate} className="px-5 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">Generate Ticket</button>
        )}
        {featureToggles.scanTicketsButton && (
          <button onClick={handleScan} className="px-5 py-2 rounded-md bg-pink-600 text-white text-sm font-medium hover:bg-pink-500">Scan Tickets</button>
        )}
        {featureToggles.ticketsButton && (
          <button onClick={handleTickets} className="px-5 py-2 rounded-md bg-gray-700 text-white text-sm font-medium hover:bg-gray-600">Tickets</button>
        )}
      </div>
      <button onClick={() => router.push('/dashboard')} className="text-xs text-gray-400 hover:text-gray-200 self-start">← Back to events</button>
    </div>
  );
}
