import React, { useState } from 'react';
import { CarCategory, UserSession } from '../types';
import { WolfLogo } from './WolfLogo';
import {
  PlusCircle,
  Printer,
  Barcode,
  HelpCircle,
  Search,
  Car,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Lock,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Database,
  History,
  FileDown,
  ChevronDown,
  Calculator,
  Laptop,
  Trash2,
  ArrowUpDown
} from 'lucide-react';

interface NavbarProps {
  categories: CarCategory[];
  activeCategoryId: string;
  searchQuery: string;
  onSelectCategory: (id: string) => void;
  onSearchChange: (query: string) => void;
  onOpenEmployeePanel: () => void;
  onOpenBarcodeScanner: () => void;
  onOpenGuideModal: () => void;
  onOpenPdfExtractor: () => void;
  onTogglePrintView: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  isDbSynced?: boolean;
  totalProductsCount: number;
  isEmployeeUnlocked: boolean;
  onRequireAuth: () => void;
  onLockEmployee: () => void;
  onOpenActivityLogs?: () => void;
  activityLogsCount?: number;
  onOpenRecycleBin?: () => void;
  deletedProductsCount?: number;
  userSession?: UserSession | null;
  onExportCategoryPdf?: (categoryId: string) => void;
  onExportAllPdf?: () => void;
  onOpenCategoryOrderModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  activeCategoryId,
  searchQuery,
  onSelectCategory,
  onSearchChange,
  onOpenEmployeePanel,
  onOpenBarcodeScanner,
  onOpenGuideModal,
  onOpenPdfExtractor,
  onTogglePrintView,
  onExportData,
  onImportData,
  onResetData,
  isDbSynced = true,
  totalProductsCount,
  isEmployeeUnlocked,
  onRequireAuth,
  onLockEmployee,
  onOpenActivityLogs,
  activityLogsCount = 0,
  onOpenRecycleBin,
  deletedProductsCount = 0,
  userSession,
  onExportCategoryPdf,
  onExportAllPdf,
  onOpenCategoryOrderModal,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  const getRoleDisplay = () => {
    if (!userSession) return null;
    switch (userSession.role) {
      case 'accounting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Calculator className="w-3 h-3 text-emerald-700" />
            <span>المحاسبة</span>
          </span>
        );
      case 'showroom':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <Car className="w-3 h-3 text-amber-700" />
            <span>المعرض</span>
          </span>
        );
      case 'it':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Laptop className="w-3 h-3 text-indigo-700" />
            <span>تقنية المعلومات IT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
            <ShieldCheck className="w-3 h-3 text-slate-700" />
            <span>الإدارة</span>
          </span>
        );
    }
  };

  return (
    <header className="no-print bg-white text-slate-800 sticky top-0 z-40 shadow-xs border-b border-slate-200 font-sans">
      
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand Logo & DB Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <WolfLogo size="md" />
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Supabase Cloud</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            {/* Show Activity Logs only when unlocked */}
            {isEmployeeUnlocked && onOpenActivityLogs && (
              <button
                onClick={onOpenActivityLogs}
                className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-900 text-white rounded-lg relative"
                title="سجل الحركات"
              >
                <History className="w-4 h-4 text-orange-400" />
                {activityLogsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                    {activityLogsCount > 99 ? '99+' : activityLogsCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onOpenBarcodeScanner}
              className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg border border-slate-200"
              title="فحص الباركود"
            >
              <Barcode className="w-4 h-4 text-orange-600" />
            </button>
            <button
              onClick={isEmployeeUnlocked ? onOpenEmployeePanel : onRequireAuth}
              className="p-1.5 text-slate-700 hover:text-slate-900 bg-orange-50 rounded-lg border border-orange-200"
              title="لوحة الإدارة"
            >
              <Lock className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </div>

        {/* Action Controls for Customers & Employees */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          
          {/* Barcode Scanner Button */}
          <button
            onClick={onOpenBarcodeScanner}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
          >
            <Barcode className="w-3.5 h-3.5 text-orange-600" />
            <span>فحص الباركود</span>
          </button>

          {/* PDF Export Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-orange-600" />
              <span>تصدير PDF</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div 
                className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-right font-sans text-xs animate-in fade-in"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    if (onExportAllPdf) onExportAllPdf();
                    else onTogglePrintView();
                  }}
                  className="w-full text-right px-3.5 py-2 hover:bg-orange-50 hover:text-orange-900 font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>تصدير كافة الأقسام ({categories.length} أقسام)</span>
                  <FileDown className="w-3.5 h-3.5 text-orange-600" />
                </button>

                {activeCategoryId !== 'all' && activeCategory && (
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      if (onExportCategoryPdf) onExportCategoryPdf(activeCategoryId);
                      else onTogglePrintView();
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-orange-50 hover:text-orange-900 font-bold text-slate-700 flex items-center justify-between border-t border-slate-100"
                  >
                    <span>تصدير قسم {activeCategory.name} فقط</span>
                    <Car className="w-3.5 h-3.5 text-orange-600" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onTogglePrintView();
                  }}
                  className="w-full text-right px-3.5 py-2 hover:bg-slate-100 text-slate-500 font-bold border-t border-slate-100 flex items-center justify-between"
                >
                  <span>فتح شاشة المعاينة والتحميل</span>
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onOpenGuideModal}
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>طريقة العمل</span>
          </button>

          {/* User Session Role Badge */}
          {isEmployeeUnlocked && userSession && (
            <div className="hidden sm:inline-flex">
              {getRoleDisplay()}
            </div>
          )}

          {/* Staff Login / Staff Panel Controls */}
          {!isEmployeeUnlocked ? (
            <button
              onClick={onRequireAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all"
              title="دخول الموظفين لإضافة وتعديل المنتجات"
            >
              <LockKeyhole className="w-3.5 h-3.5 text-white" />
              <span>دخول الموظفين</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              
              {/* Activity Log Button - ONLY shown when unlocked */}
              {onOpenActivityLogs && (
                <button
                  onClick={onOpenActivityLogs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-800 transition-all shadow-xs group"
                  title="عرض سجل الحركات والتعديلات والأسعار"
                >
                  <History className="w-3.5 h-3.5 text-orange-400 group-hover:rotate-45 transition-transform" />
                  <span>سجل الحركات</span>
                  {activityLogsCount > 0 && (
                    <span className="bg-orange-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                      {activityLogsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Recycle Bin (Trash) Button */}
              {onOpenRecycleBin && (
                <button
                  onClick={onOpenRecycleBin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 transition-all shadow-xs"
                  title="سلة المحذوفات (تحتفظ بالعناصر 30 يوماً)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>سلة المحذوفات</span>
                  {deletedProductsCount > 0 && (
                    <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                      {deletedProductsCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={onOpenPdfExtractor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-orange-400 rounded-xl text-xs font-bold shadow-xs transition-all border border-orange-500/30"
                title="استخراج وقص صور كتالوج LYK-900 من الـ PDF وربطها بالمنتجات"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>استخراج صور الـ PDF</span>
              </button>

              <button
                onClick={onOpenEmployeePanel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة / تعديل منتج</span>
              </button>

              <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={onExportData}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                  title="تصدير نسخة احتياطية من المنتجات (JSON)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <label
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="استيراد نسخة احتياطية (JSON)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                </label>

                <button
                  onClick={() => {
                    if (confirm('هل تريد إعادة تعيين الكتالوج للبيانات النموذجية الأصلية؟')) {
                      onResetData();
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors"
                  title="إعادة التعيين للعينات الأصلية"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onLockEmployee}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="قفل لوحة الموظفين والخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Category Navigation Bar & Search Input */}
      <div className="bg-slate-50 border-t border-slate-200 py-2 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          
          {/* Category Pill Tabs - Manual Category Navigation (No 'All' Button) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategoryId === cat.id;
              const isProtection = cat.layoutType === 'protection_tint' || cat.id === 'cat-protection-tint' || cat.name.includes('الحماية');
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                      : isProtection
                      ? 'bg-orange-50/70 text-orange-950 hover:bg-orange-100 hover:text-orange-900 border-orange-200'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200'
                  }`}
                >
                  {isProtection ? (
                    <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-600'}`} />
                  ) : (
                    <Car className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-600'}`} />
                  )}
                  <span>{cat.name}</span>
                </button>
              );
            })}

            {/* Quick Categories Reorder Button - ONLY for authenticated employees */}
            {onOpenCategoryOrderModal && isEmployeeUnlocked && (
              <button
                onClick={onOpenCategoryOrderModal}
                className="px-3.5 py-1.5 rounded-full font-black text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 hover:text-orange-950 shadow-2xs shrink-0 cursor-pointer"
                title="ترتيب أقسام السيارات في الهيدر الرئيسي وتحديد الأول والثاني والثالث"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
                <span>ترتيب الأقسام</span>
                <span className="text-[10px] bg-orange-600 text-white rounded-full px-1.5 py-0.2 font-black leading-none">
                  1-2-3
                </span>
              </button>
            )}
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث بالاسم أو الباركود..."
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
            />
            <Search className="absolute right-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-2 top-1.5 text-xs text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>

        </div>
      </div>

    </header>
  );
};
