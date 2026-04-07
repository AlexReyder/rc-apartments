import type { PropsWithChildren } from 'react';

export default function PublicLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#2e4b6e_0%,_#223b58_38%,_#1b3048_100%)] text-white">
            <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </div>
    );
}
