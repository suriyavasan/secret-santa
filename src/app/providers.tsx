'use client';

import dynamic from 'next/dynamic';

const ProvidersWrapper = dynamic(
    () => import('./providers-wrapper').then((mod) => mod.Providers),
    { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
    return <ProvidersWrapper>{children}</ProvidersWrapper>;
}
