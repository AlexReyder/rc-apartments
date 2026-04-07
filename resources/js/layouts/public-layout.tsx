import type { PropsWithChildren } from 'react';

export default function PublicLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-[#f4f1eb] text-[#1A2431]">
            <div className="mx-auto w-full max-w-[1720px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</div>
        </div>
    );
}
