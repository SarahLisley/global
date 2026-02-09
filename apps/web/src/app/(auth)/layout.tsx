import type { ReactNode } from 'react';
import Image from 'next/image';
import '../globals.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center relative py-8 px-4 bg-slate-50 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[30%] -left-[15%] w-[60vw] h-[60vw] rounded-full bg-blue-100 opacity-50 blur-[80px]" />
        <div className="absolute -bottom-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-blue-50 opacity-60 blur-[60px]" />
      </div>

      <div className="relative w-[min(1000px,94vw)] shadow-2xl shadow-slate-300/50 border border-slate-100 rounded-3xl overflow-hidden bg-white z-10 flex animate-in fade-in zoom-in-95 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 w-full">
          {/* Form Section */}
          <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white min-h-[520px]">
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