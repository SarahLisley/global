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

      <div className="relative w-full max-w-[440px] md:max-w-[920px] shadow-2xl shadow-slate-300/50 dark:shadow-zinc-900/50 ring-1 ring-slate-900/5 dark:ring-white/5 rounded-2xl sm:rounded-3xl overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10 flex animate-in fade-in zoom-in-95 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 w-full">
          {/* Form Section */}
          <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-transparent min-h-[auto] sm:min-h-[480px]">
            {children}
          </div>

          {/* Side Panel - Premium Design */}
          <div className="hidden md:flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2847 40%, #0a1f3d 100%)' }}>
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 opacity-30" style={{
              background: 'radial-gradient(ellipse at 20% 80%, rgba(255, 107, 53, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)'
            }} />

            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.06]">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />
            </div>

            {/* Decorative floating elements */}
            <div className="absolute top-8 right-8 w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center animate-pulse" style={{ animationDuration: '3s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div className="absolute bottom-12 left-8 w-12 h-12 rounded-xl bg-orange-500/10 backdrop-blur-sm border border-orange-400/20 flex items-center justify-center animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 107, 53, 0.6)" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>

            {/* Glow ring behind image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[280px] h-[280px] rounded-full bg-gradient-to-br from-blue-400/10 to-orange-400/10 blur-3xl" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-8 py-10">
              {/* Image with enhanced styling */}
              <div className="relative mb-8">
                <Image
                  src="/images/auth-illustration.png"
                  alt="Portal Global Hospitalar - Sistema de gestão hospitalar"
                  width={320}
                  height={320}
                  className="object-contain drop-shadow-2xl relative z-10"
                  priority
                  style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
                />
              </div>

              {/* Text content */}
              <div className="text-center space-y-3 max-w-[260px]">
                <h2 className="text-xl font-bold text-white/95 tracking-tight leading-tight">
                  Portal Global Hospitalar
                </h2>
                <p className="text-sm text-blue-200/70 leading-relaxed">
                  Gestão inteligente para o seu negócio. Pedidos, entregas e financeiro em um só lugar.
                </p>
              </div>

              {/* Bottom decorative line */}
              <div className="mt-8 flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-transparent to-orange-400/50" />
                <div className="w-2 h-2 rounded-full bg-orange-400/40" />
                <div className="w-12 h-0.5 rounded-full bg-gradient-to-r from-orange-400/50 to-blue-400/50" />
                <div className="w-2 h-2 rounded-full bg-blue-400/40" />
                <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-blue-400/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}