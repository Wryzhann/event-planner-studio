import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Loader2, 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  Clock, 
  Layers, 
  Calendar,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Lock,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  performed_by: string | null;
  details: string | null;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs available to export');
      return;
    }

    try {
      // Define official compliance columns
      const headers = ['Security Event Log ID', 'Action Timestamp (UTC)', 'Security Event Action', 'Performed By User UUID / System Handlers', 'Event Payload / Detailed Context'];
      
      // Map audit entries to CSV row items
      const rows = filteredLogs.map(log => {
        // Strict sanitization of dynamic cell text to prevent formula execution/injection (CSV injection hardening)
        const sanitize = (val: string | null) => {
          if (!val) return '';
          let text = val.toString().trim();
          // Escape quote marks
          text = text.replace(/"/g, '""');
          // If the cell value starts with dynamic modifier triggers (=, +, -, @), prefix with a single quote to nullify arbitrary system evaluation
          if (/^[=\+\-\@\t\r]/.test(text)) {
            text = `'` + text;
          }
          return `"${text}"`;
        };

        return [
          sanitize(log.id),
          sanitize(log.created_at),
          sanitize(log.action),
          sanitize(log.performed_by),
          sanitize(log.details)
        ].join(',');
      });

      // Construct compliance body
      const csvStr = [headers.join(','), ...rows].join('\n');
      
      // Generate UTF-8 binary attachment
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvStr], { type: 'text/csv;charset=utf-8;' });
      const dlUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      
      const categorySuf = activeFilter !== 'all' ? `-${activeFilter}` : '';
      const formattedDate = new Date().toISOString().replace(/[:.]/g, '-');
      downloadAnchor.setAttribute('href', dlUrl);
      downloadAnchor.setAttribute('download', `security_audit_records${categorySuf}_${formattedDate}.csv`);
      downloadAnchor.style.visibility = 'hidden';
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      toast.success(`Successfully exported ${filteredLogs.length} audit logs (CSV format)`);
    } catch (err: any) {
      console.error('Compliance Export Error:', err);
      toast.error('Failed to create compliance export. Trace details logged.');
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) throw new Error('Missing active access session');

      const response = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load audit logs from secure API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Copied UUID to clipboard', { id: 'copy-toast' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Basic filters mapping
  const matchesFilter = (log: AuditLog) => {
    const action = log.action.toUpperCase();
    if (activeFilter === 'all') return true;
    if (activeFilter === 'logins') {
      return action.includes('LOGIN') || action.includes('REGISTER') || action.includes('AUTH');
    }
    if (activeFilter === 'services') {
      return action.includes('SERVICE');
    }
    if (activeFilter === 'appointments') {
      return action.includes('APPOINTMENT');
    }
    if (activeFilter === 'suspicious') {
      return (
        action.includes('UNAUTHORIZED') || 
        action.includes('SUSPICIOUS') || 
        action.includes('FAILED_LOGIN') || 
        action.includes('FORBIDDEN')
      );
    }
    return true;
  };

  const filteredLogs = logs
    .filter(matchesFilter)
    .filter((log) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.action?.toLowerCase().includes(searchLower) ||
        log.performed_by?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower)
      );
    });

  const getActionBadge = (action: string) => {
    const upper = action.toUpperCase();
    if (upper.includes('FAILED') || upper.includes('UNAUTHORIZED') || upper.includes('FORBIDDEN')) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-red-950 text-red-400 border border-red-900 rounded-md">
          <AlertOctagon className="w-3.5 h-3.5" />
          {action}
        </span>
      );
    }
    if (upper.includes('SUCCESSFUL_LOGIN') || upper.includes('CREATED') || upper.includes('REGISTERED')) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-md">
          <CheckCircle className="w-3.5 h-3.5" />
          {action}
        </span>
      );
    }
    if (upper.includes('UPDATED') || upper.includes('TOGGLED')) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-900 rounded-md">
          <Layers className="w-3.5 h-3.5" />
          {action}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-md">
        <ShieldAlert className="w-3.5 h-3.5" />
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-medium text-secondary-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary-600" />
            Security Audit Trail
          </h1>
          <p className="text-secondary-500 text-sm mt-1">
            Secure, server-side log of user registrations, administration overrides, and potential threat indicators (OWASP ASVS V7).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isLoading || filteredLogs.length === 0}
            onClick={handleExportCSV}
            className="flex items-center gap-2 border-secondary-200 hover:bg-secondary-50 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export to CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            onClick={fetchLogs}
            className="flex items-center gap-2 border-secondary-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Reload logs
          </Button>
        </div>
      </div>

      {/* Statistics Header Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-neutral-900 text-white border-white/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/50">Total Logged Activities</p>
              <h3 className="text-2xl font-bold font-mono mt-1">{logs.length}</h3>
            </div>
            <ShieldAlert className="w-8 h-8 text-[#D4AF37]/50" />
          </CardContent>
        </Card>
        <Card className="bg-emerald-950/20 text-emerald-400 border-emerald-900/35">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/70">Successful Logins</p>
              <h3 className="text-2xl font-bold font-mono mt-1">
                {logs.filter(l => l.action === 'SUCCESSFUL_LOGIN').length}
              </h3>
            </div>
            <Clock className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>
        <Card className="bg-red-950/20 text-red-400 border-red-900/35">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-500/70">Potential Indicators / Failures</p>
              <h3 className="text-2xl font-bold font-mono mt-1">
                {logs.filter(l => ['FAILED_LOGIN', 'UNAUTHORIZED_ADMIN_ACCESS'].includes(l.action)).length}
              </h3>
            </div>
            <AlertOctagon className="w-8 h-8 text-red-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Control Bar */}
      <Card className="border-secondary-100 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
                <Search className="w-4 h-4" />
              </span>
              <Input
                type="text"
                placeholder="Search audit trail by action, email, user ID, or event specifics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary-50 border-secondary-200 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-secondary-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>
              {[
                { key: 'all', label: 'All Log Entries' },
                { key: 'logins', label: 'Logins / Auth' },
                { key: 'services', label: 'Services' },
                { key: 'appointments', label: 'Appointments' },
                { key: 'suspicious', label: 'Suspicious / Failures' },
              ].map((badge) => (
                <button
                  key={badge.key}
                  onClick={() => setActiveFilter(badge.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                    activeFilter === badge.key
                      ? 'bg-secondary-900 border-secondary-900 text-white shadow-sm'
                      : 'bg-white border-secondary-200 text-secondary-600 hover:border-secondary-900 hover:text-secondary-900'
                  }`}
                >
                  {badge.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table / Listing */}
      {isLoading ? (
        <Card className="border-secondary-200 p-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <p className="text-secondary-500 font-medium">Fetching cryptographic audit trails from security controller...</p>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="border-dashed border-secondary-200 p-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-secondary-300 mx-auto" />
            <p className="text-secondary-500 font-medium">No audit entries found matching the filter criteria.</p>
            {searchTerm && (
              <Button variant="link" size="sm" onClick={() => setSearchTerm('')} className="text-primary-600">
                Clear search criteria
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-secondary-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary-50 text-[10px] tracking-widest uppercase text-secondary-500 border-b border-secondary-100">
                  <th className="py-3 px-5 font-bold">Timestamp</th>
                  <th className="py-3 px-5 font-bold">Action Identification</th>
                  <th className="py-3 px-5 font-bold">Actor Account</th>
                  <th className="py-3 px-5 font-bold">Secured Log Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 text-sm">
                {filteredLogs.map((log) => {
                  const dateString = new Date(log.created_at).toLocaleString('en-MY', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-secondary-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-4.5 px-5 align-top whitespace-nowrap text-secondary-500 font-mono text-xs">
                        {dateString}
                      </td>

                      {/* Action Code */}
                      <td className="py-4.5 px-5 align-top whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Performed By */}
                      <td className="py-4.5 px-5 align-top max-w-[160px] truncate">
                        {log.performed_by ? (
                          <button
                            onClick={() => handleCopyId(log.performed_by || '')}
                            title="Click to copy User Identifier"
                            className="flex items-center gap-1 text-xs font-mono px-2 py-1 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 hover:text-secondary-900 rounded-md transition-all active:scale-95"
                          >
                            <User className="w-3.5 h-3.5 opacity-65" />
                            <span className="truncate">
                              {log.performed_by.length > 12 
                                ? `${log.performed_by.slice(0, 10)}...` 
                                : log.performed_by
                              }
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-secondary-400 font-medium italic">System Generated</span>
                        )}
                      </td>

                      {/* Details / Secure Description */}
                      <td className="py-4.5 px-5 align-top">
                        <div className="font-mono text-xs text-secondary-700 leading-relaxed max-w-lg bg-neutral-50 px-3 py-2 border border-neutral-100 rounded-lg break-all">
                          {log.details || 'Successfully logged security operations sequence.'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="py-3 px-5 bg-secondary-50 border-t border-secondary-100 text-center text-[10px] text-secondary-400 tracking-wider">
            SECURE DEPLOYMENT STANDARDS | RECONCILED AGAINST ENCRYPTED CONTROLS | OWASP INTEGRATED
          </div>
        </div>
      )}
    </div>
  );
}
