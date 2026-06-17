/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';

import PublicLayout from '@/layouts/PublicLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ClientLayout from '@/layouts/ClientLayout';

import Home from '@/pages/public/Home';
import Booking from '@/pages/public/Booking';
import ClientLogin from '@/pages/public/ClientLogin';

import ClientDashboard from '@/pages/client/Dashboard';
import ClientProfile from '@/pages/client/Profile';

import Login from '@/pages/admin/Login';
import Overview from '@/pages/admin/Overview';
import Appointments from '@/pages/admin/Appointments';
import Services from '@/pages/admin/Services';
import BusinessHours from '@/pages/admin/BusinessHours';
import BlockedDates from '@/pages/admin/BlockedDates';
import Settings from '@/pages/admin/Settings';
import AuditLogs from '@/pages/admin/AuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Booking />} />
          </Route>

          {/* Client Routes */}
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="services" element={<Services />} />
            <Route path="business-hours" element={<BusinessHours />} />
            <Route path="blocked-dates" element={<BlockedDates />} />
            <Route path="settings" element={<Settings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Routes>
        <Toaster position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#FDFCFB',
              border: '1px solid rgba(255,255,255,0.1)'
            },
            success: {
              iconTheme: {
                primary: '#D4AF37',
                secondary: '#1A1A1A',
              }
            }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

