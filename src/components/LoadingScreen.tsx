import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WolfLogo } from './WolfLogo';
import { Database, Sparkles, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  statusText: string;
  productCount: number;
  categoryCount: number;
  isReady: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  statusText,
  productCount,
  categoryCount,
  isReady,
}) => {
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white font-['Tajawal',sans-serif] px-4 select-none overflow-hidden"
        dir="rtl"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
          {/* Logo with pulsing aura */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mb-6"
          >
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 rounded-3xl blur-xl animate-pulse" />
            <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-3 border border-amber-500/30 shadow-2xl flex items-center justify-center">
              <WolfLogo className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]" />
            </div>
          </motion.div>

          {/* Title & Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 tracking-wide">
              WOLF CAR
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              كتالوج أكسسوارات السيارات وقاعدة البيانات السحابية
            </p>
          </motion.div>

          {/* Counter & Progress Section */}
          <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Database className="w-4 h-4 animate-spin" />
                <span>{statusText || 'جاري استدعاء البيانات...'}</span>
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {roundedProgress}%
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                style={{ width: `${roundedProgress}%` }}
                initial={{ width: '0%' }}
                animate={{ width: `${roundedProgress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>

            {/* Live Stats Badges */}
            <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-slate-800/60">
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50 flex flex-col items-center">
                <span className="text-[11px] text-slate-400 font-medium">المنتجات المستدعاة</span>
                <span className="text-base font-bold text-amber-300 font-mono mt-0.5">
                  {productCount > 0 ? `${productCount} منتج` : 'جاري التحميل...'}
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50 flex flex-col items-center">
                <span className="text-[11px] text-slate-400 font-medium">أقسام السيارات</span>
                <span className="text-base font-bold text-amber-300 font-mono mt-0.5">
                  {categoryCount > 0 ? `${categoryCount} موديل` : 'جاري التحميل...'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer security info */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>اتصال فوري ومباشر مع قاعدة بيانات Supabase</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
