import type { ReactNode } from 'react';
import Image from 'next/image';
import '../globals.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center relative py-4 sm:py-8 px-4 bg-slate-50 dark:bg-zinc-950 overflow-x-hidden">
      {/* Background Ambient Glow with Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-100 dark:bg-blue-900/20 opacity-40 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-50 dark:bg-blue-900/10 opacity-50 blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-[440px] md:max-w-[900px] shadow-2xl shadow-slate-300/50 dark:shadow-zinc-900/50 ring-1 ring-slate-900/5 dark:ring-white/5 rounded-2xl sm:rounded-3xl overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10 flex animate-in fade-in zoom-in-95 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 w-full">
          {/* Form Section */}
          <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-transparent min-h-[auto] sm:min-h-[480px]">
            {children}
          </div>

          {/* Side Panel - Clean & Minimal */}
          <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden p-10">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center h-full w-full">
              <Image
                src="/images/Componente-medico.png"
                alt="Ilustração médica"
                width={300}
                height={300}
                className="object-contain drop-shadow-xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}