"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function TicketsPage({ params }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'entered', 'not_entered'
  const [isDownloading, setIsDownloading] = useState(false);
  const [featureToggles, setFeatureToggles] = useState({
    removeTicketButton: true
  });
  const [removingTicket, setRemovingTicket] = useState(null);

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (eventId) {
      fetchTickets();
      fetchFeatureToggles();
    }
  }, [eventId]);

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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/list?eventId=${eventId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }
      
      setTickets(data.tickets || []);
      setError('');
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTicket = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    setRemovingTicket(ticketId);
    try {
      const response = await fetch(`/api/tickets/delete?eventId=${eventId}&ticketId=${ticketId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove ticket from local state
        setTickets(prevTickets => prevTickets.filter(ticket => ticket.ticketId !== ticketId));
        setError('');
      } else {
        setError(data.error || 'Failed to delete ticket');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError('Network error while deleting ticket');
    } finally {
      setRemovingTicket(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'entered' && ticket.hasEntered) ||
                         (filterStatus === 'not_entered' && !ticket.hasEntered);
    
    return matchesSearch && matchesFilter;
  });

  const enteredCount = tickets.filter(t => t.hasEntered).length;
  const totalCount = tickets.length;

  // Download Excel sheet
  const downloadExcelSheet = async () => {
    try {
      setIsDownloading(true);
      setError('');
      
      console.log('Starting Excel download...');
      console.log('Tickets data:', tickets);
      
      // Check if we have tickets
      if (!tickets || tickets.length === 0) {
        throw new Error('No tickets available to download');
      }
      
      // Prepare data for Excel
      const excelData = tickets.map((ticket, index) => ({
        'Sr. No.': index + 1,
        'Name': ticket.name || 'N/A',
        'Email': ticket.email || 'N/A',
        'Ticket ID': ticket.ticketId || 'N/A',
        'Date': ticket.date || 'N/A',
        'Status': ticket.hasEntered ? 'Entered' : 'Pending',
        'Issued At': ticket.issuedAt ? new Date(ticket.issuedAt).toLocaleString() : 'N/A',
        'Entered At': ticket.enteredAt ? new Date(ticket.enteredAt).toLocaleString() : 'N/A'
      }));

      console.log('Excel data prepared:', excelData);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 20 },  // Name
        { wch: 25 },  // Email
        { wch: 15 },  // Ticket ID
        { wch: 12 },  // Date
        { wch: 10 },  // Status
        { wch: 20 },  // Issued At
        { wch: 20 }   // Entered At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Event Tickets');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `event-tickets-${eventId}-${currentDate}.xlsx`;

      console.log('Downloading file:', filename);

      // Download the file
      XLSX.writeFile(workbook, filename);
      
      console.log('Excel download completed successfully');
      
    } catch (err) {
      console.error('Error downloading Excel sheet:', err);
      setError(`Failed to download Excel sheet: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Event Tickets</h1>
          <p className="text-sm text-gray-400 mt-1">
            {totalCount} total tickets • {enteredCount} entered • {totalCount - enteredCount} pending
          </p>
        </div>
        <button 
          onClick={() => router.back()} 
          className="px-4 py-2 rounded-md bg-gray-700 text-white text-sm hover:bg-gray-600"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-900/20 border border-red-800 text-red-400">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or ticket ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          <option value="all">All Tickets</option>
          <option value="entered">Entered</option>
          <option value="not_entered">Not Entered</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={fetchTickets}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-500"
          >
            Refresh
          </button>
          <button
            onClick={downloadExcelSheet}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDownloading || totalCount === 0}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Downloading...
              </>
            ) : (
              <>
                📊 Download Excel Sheet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {tickets.length === 0 ? 'No tickets issued yet.' : 'No tickets match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sr. No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Issued At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Entered At
                  </th>
                  {featureToggles.removeTicketButton && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTickets.map((ticket, index) => (
                  <tr key={ticket.ticketId} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {ticket.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {ticket.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                      {ticket.ticketId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {ticket.date || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.hasEntered ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/20 text-green-400 border border-green-800">
                          ✅ Entered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(ticket.issuedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {ticket.enteredAt ? new Date(ticket.enteredAt).toLocaleString() : 'N/A'}
                    </td>
                    {featureToggles.removeTicketButton && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveTicket(ticket.ticketId)}
                          disabled={removingTicket === ticket.ticketId}
                          className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
                        >
                          {removingTicket === ticket.ticketId ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Removing...
                            </>
                          ) : (
                            <>
                              🗑️ Remove
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Total Tickets</h3>
          <p className="text-3xl font-bold text-indigo-400">{totalCount}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Entered</h3>
          <p className="text-3xl font-bold text-green-400">{enteredCount}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-400">{totalCount - enteredCount}</p>
        </div>
      </div>
    </div>
  );
}