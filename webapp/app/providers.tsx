'use client';

/**
 * Providers – wrapper cho NextAuth SessionProvider
 * Bao bọc toàn bộ ứng dụng để các component con có thể dùng useSession()
 */

import { SessionProvider } from 'next-auth/react';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
