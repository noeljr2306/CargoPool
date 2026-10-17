'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Wrap a page with this to require login, and optionally a specific role.
// Usage: <RequireAuth role="FORWARDER"><Dashboard /></RequireAuth>
export default function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (role && user.role !== role) {
      router.replace('/login');
    }
  }, [user, loading, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return <p className="p-8 text-gray-500">Loading...</p>;
  }

  return children;
}