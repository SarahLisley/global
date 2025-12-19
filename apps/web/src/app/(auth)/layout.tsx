import type { ReactNode } from 'react';
import Image from 'next/image';
import '../globals.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center relative py-8 px-4">
      <div className="relative w-[min(1200px,92vw)]">
        <div className="pointer-events-none select-none">
          <div className="hidden md:block absolute -left-12 -top-12 w-24 h-24 rounded-full bg-[color:var(--brand-blue)] z-0" />
          <div className="hidden md:block absolute -right-12 -bottom-12 w-24 h-24 rounded-full bg-[color:var(--brand-orange)] z-0" />
        </div>

        <div className="relative bg-white rounded-2.5xl shadow-card overflow-hidden z-10">
          <div className="col-divider" />
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="px-8 sm:px-12 py-10">
              {children}
            </div>

            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--brand-blue-light)] to-[color:var(--brand-blue)]" />
              <div className="relative h-full w-full grid place-items-center p-8">
                <Image
                  src="/images/Componente-medico.png"
                  alt="Ilustração médica"
                  width={550}
                  height={550}
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}