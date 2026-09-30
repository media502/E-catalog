import React from 'react';
import { X, CheckCircle2, FileText, Printer, Sparkles, Database, Layers, Barcode, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { WolfLogo } from './WolfLogo';

interface ExplanationGuideModalProps {
  onClose: () => void;
  onOpenEmployeePanel?: () => void;
}

export const ExplanationGuideModal: React.FC<ExplanationGuideModalProps> = ({
  onClose,
  onOpenEmployeePanel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans">
        
        {/* Header - High Density */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <WolfLogo size="sm" lightMode />
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">دليل العمل والحل السحابي الذكي</h3>
              <p className="text-orange-400 text-xs font-semibold mt-0.5">
                قاعدة البيانات السحابية، استيراد كانفا، والطباعة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 text-xs leading-relaxed">
          
          {/* Answer to the user's question */}
          <div className="bg-orange-50/80 border border-orange-200 rounded p-3.5 space-y-1.5">
            <h4 className="font-bold text-orange-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>كيف تسحب الداتا من Canva وقاعدة البيانات؟</span>
            </h4>
            <p className="text-slate-700 text-xs">
              تم ربط النظام بالكامل بقاعدة بيانات <strong>Firebase Firestore</strong> السحابية لضمان حفظ كافة المنتجات فوراً بدون أي ضياع، مع توفير أداة استيراد ذكية من تصاميم وجداول Canva.
            </p>
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            
            <div className="flex gap-3 items-start p-3 bg-slate-50 rounded border border-slate-200">
              <div className="w-6 h-6 bg-orange-600 text-white rounded font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-900 text-xs">حفظ سحابي دائم (Firebase Firestore)</h5>
                <p className="text-slate-600 text-xs">
                  كل منتج أو قسم يضيفه الموظف يُحفظ مباشرة في السحابة ومتاح على أي جهاز أو شاشة بالمعرض فوراً بدون ضياع.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 bg-slate-50 rounded border border-slate-200">
              <div className="w-6 h-6 bg-slate-900 text-white rounded font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-orange-600" />
                  <span>السحب والاستيراد من Canva و Excel</span>
                </h5>
                <p className="text-slate-600 text-xs">
                  يمكن للموظف نسخ نصوص المنتجات والأسعار من كانفا أو جدول إكسل ولصقها في تبويب <strong>"سحب من Canva / Excel"</strong> ليتم استخراجها وتوليد الباركود وتخزينها دفعة واحدة.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 bg-slate-50 rounded border border-slate-200">
              <div className="w-6 h-6 bg-slate-900 text-white rounded font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-900 text-xs">حماية بكلمة سر للعملاء والعمليات</h5>
                <p className="text-slate-600 text-xs">
                  الصفحة الرئيسية مخصصة للعميل والموظف لعرض المنتجات والأسعار، ولا يمكن التعديل أو الحذف إلا بعد إدخال كلمة سر القسم المعتمدة (<strong className="font-mono text-orange-700">wolf@it / wolf@car / wolf@acc / wolf@admin</strong>).
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 bg-slate-50 rounded border border-slate-200">
              <div className="w-6 h-6 bg-emerald-600 text-white rounded font-bold text-xs flex items-center justify-center shrink-0">
                4
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-900 text-xs">توليد الباركود والطباعة الفورية (PDF)</h5>
                <p className="text-slate-600 text-xs">
                  توليد باركودات متجهة عالية الدقة للماسح الضوئي، مع خيار طباعة كتالوج A4 بنقرة زر واحدة.
                </p>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded border border-slate-200 transition-colors text-xs"
            >
              إغلاق الدليل
            </button>
            {onOpenEmployeePanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEmployeePanel();
                }}
                className="w-full sm:w-auto px-5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow-xs transition-all text-xs flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>فتح لوحة الموظفين</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
