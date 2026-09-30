import React, { useState } from 'react';
import { ActivityLog, UserRole } from '../types';
import {
  History,
  X,
  Search,
  ArrowUpRight,
  TrendingUp,
  Tag,
  PlusCircle,
  Trash2,
  Edit,
  Sparkles,
  Calculator,
  Car,
  Laptop,
  Shield,
  Layers,
  Clock,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  FolderPlus,
  FolderEdit,
  FolderMinus,
  FileSpreadsheet
} from 'lucide-react';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  onNavigateToProduct: (productId: string, categoryId?: string) => void;
  currentUserRole?: UserRole;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onNavigateToProduct,
  currentUserRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesRole = selectedRoleFilter === 'all' || log.userRole === selectedRoleFilter;
    const matchesAction = selectedActionFilter === 'all' || log.actionType === selectedActionFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      log.userName?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.productName?.toLowerCase().includes(q) ||
      log.categoryName?.toLowerCase().includes(q);

    return matchesRole && matchesAction && matchesSearch;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'accounting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Calculator className="w-3 h-3 text-emerald-700" />
            <span>المحاسبة (wolf@acc)</span>
          </span>
        );
      case 'showroom':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <Car className="w-3 h-3 text-amber-700" />
            <span>المعرض (wolf@car)</span>
          </span>
        );
      case 'it':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Laptop className="w-3 h-3 text-indigo-700" />
            <span>تقنية المعلومات IT (wolf@it)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
            <Shield className="w-3 h-3 text-slate-700" />
            <span>الإدارة العامة</span>
          </span>
        );
    }
  };

  const getActionBadge = (actionType: ActivityLog['actionType']) => {
    switch (actionType) {
      case 'price_change':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>تعديل سعر</span>
          </span>
        );
      case 'product_add':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold">
            <PlusCircle className="w-3 h-3 text-blue-600" />
            <span>إضافة منتج جديد</span>
          </span>
        );
      case 'product_edit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
            <Edit className="w-3 h-3 text-amber-600" />
            <span>تعديل اسم / باركود</span>
          </span>
        );
      case 'image_transform':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-extrabold">
            <ImageIcon className="w-3 h-3 text-orange-600" />
            <span>تعديل/إضافة صورة</span>
          </span>
        );
      case 'product_delete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-extrabold">
            <Trash2 className="w-3 h-3 text-rose-600" />
            <span>حذف منتج</span>
          </span>
        );
      case 'category_add':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-extrabold">
            <FolderPlus className="w-3 h-3 text-cyan-600" />
            <span>إضافة قسم جديد</span>
          </span>
        );
      case 'category_edit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-extrabold">
            <FolderEdit className="w-3 h-3 text-teal-600" />
            <span>تعديل بيانات القسم</span>
          </span>
        );
      case 'category_delete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200 text-[10px] font-extrabold">
            <FolderMinus className="w-3 h-3 text-red-600" />
            <span>حذف قسم</span>
          </span>
        );
      case 'pdf_extract':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-extrabold">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>استخراج صور PDF</span>
          </span>
        );
      case 'product_restore':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>استعادة من المحذوفات</span>
          </span>
        );
      case 'hard_delete':
      case 'trash_empty':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-900 border border-red-300 text-[10px] font-extrabold">
            <Trash2 className="w-3 h-3 text-red-700" />
            <span>حذف نهائي</span>
          </span>
        );
      case 'bulk_import':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-extrabold">
            <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
            <span>استيراد جماعي (Excel)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold">
            <Layers className="w-3 h-3" />
            <span>حركة عامة</span>
          </span>
        );
    }
  };

  const formatExactDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const dateStr = d.toLocaleDateString('ar-QA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const timeStr = d.toLocaleTimeString('ar-QA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      return `${dateStr} • ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-600/30 text-orange-400 rounded-xl border border-orange-500/40 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">سجل حركات وتعديلات الكتالوج</h3>
                <span className="bg-slate-800 text-orange-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-slate-700">
                  {logs.length} حركة مسجلة
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                توثيق كامل لكافة التعديلات (الأسعار، العناوين، الباركود، الصور، والأقسام) مع الوقت والتاريخ وهوية الحساب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-slate-50 p-3 sm:p-4 border-b border-slate-200 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            
            {/* Search */}
            <div className="relative sm:col-span-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو التفاصيل أو الباركود..."
                className="w-full pl-3 pr-8 py-1.5 text-xs font-bold bg-white rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Role Filter */}
            <div className="sm:col-span-1">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="all">كافة الأقسام والحسابات</option>
                <option value="accounting">قسم المحاسبة (wolf@acc)</option>
                <option value="showroom">قسم المعرض (wolf@car)</option>
                <option value="it">تقنية المعلومات IT (wolf@it)</option>
                <option value="admin">الإدارة العامة</option>
              </select>
            </div>

            {/* Action Type Filter */}
            <div className="sm:col-span-1">
              <select
                value={selectedActionFilter}
                onChange={(e) => setSelectedActionFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-lg border border-slate-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="all">كافة أنواع العمليات</option>
                <option value="price_change">💰 تعديل الأسعار</option>
                <option value="product_add">➕ إضافة منتجات جديدة</option>
                <option value="product_edit">✏️ تعديل اسم / باركود</option>
                <option value="image_transform">🖼️ إضافة / تعديل صور</option>
                <option value="product_delete">🗑️ حذف منتجات</option>
                <option value="category_add">📁 إضافة قسم جديد</option>
                <option value="category_edit">🏷️ تعديل بيانات قسم</option>
                <option value="category_delete">❌ حذف قسم</option>
                <option value="pdf_extract">📄 استخراج من PDF</option>
                <option value="bulk_import">📥 استيراد جماعي (Excel)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Log Entries List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="pt-2.5 pb-3 px-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Action Icon & Main Info */}
                  <div className="space-y-1.5 flex-1 text-right">
                    
                    {/* Top Row: User Role + Action Type Badge + Exact Timestamp */}
                    <div className="flex flex-wrap items-center gap-2">
                      {getRoleBadge(log.userRole)}
                      {getActionBadge(log.actionType)}
                      
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatExactDateTime(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Product or Category Name header */}
                    {log.productName ? (
                      <div className="text-xs font-black text-slate-900 pt-0.5">
                        📦 {log.productName}
                        {log.categoryName && (
                          <span className="text-slate-500 text-[11px] font-normal mr-2">
                            (القسم: {log.categoryName})
                          </span>
                        )}
                      </div>
                    ) : log.categoryName ? (
                      <div className="text-xs font-black text-slate-900 pt-0.5">
                        📁 القسم: {log.categoryName}
                      </div>
                    ) : null}

                    {/* Details Description */}
                    <p className="text-xs font-bold text-slate-700 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-100">
                      {log.details}
                    </p>

                    {/* Old/New value pill if price changed */}
                    {log.actionType === 'price_change' && log.oldValue !== undefined && log.newValue !== undefined && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-extrabold text-emerald-900">
                        <span className="line-through text-slate-400">{log.oldValue} QAR</span>
                        <span className="text-emerald-600 font-black">←</span>
                        <span className="text-emerald-700 text-sm">{log.newValue} QAR</span>
                      </div>
                    )}

                  </div>

                  {/* Jump To Product Button */}
                  {log.productId && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToProduct(log.productId!, log.categoryId);
                      }}
                      className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-center shadow-xs"
                      title="الانتقال إلى كارد المنتج في المتجر"
                    >
                      <span>عرض المنتج</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">لا توجد حركات مسجلة مطابقة للبحث أو الفلتر.</p>
              <p className="text-xs text-slate-400">ستظهر هنا أي عمليات إضافة أو تعديل للأسعار أو المنتجات تلقائياً.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 px-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-1.5 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>يتم حفظ وتوثيق جميع الحركات تلقائياً في قاعدة البيانات السحابية</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
