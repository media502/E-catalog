import React, { useState } from 'react';
import { Product, CarCategory } from '../types';
import { ProductCard } from './ProductCard';
import { CategoryHeader } from './CategoryHeader';
import { Printer, ArrowRight, FileDown, Car, Loader2, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintCatalogViewProps {
  categories: CarCategory[];
  products: Product[];
  activeCategoryId: string;
  onExitPrint: () => void;
}

const ITEMS_PER_PAGE = 6; // 6 products per A4 sheet (2 columns x 3 rows)

export const PrintCatalogView: React.FC<PrintCatalogViewProps> = ({
  categories,
  products,
  activeCategoryId,
  onExitPrint,
}) => {
  const [selectedExportScope, setSelectedExportScope] = useState<string>(activeCategoryId || 'all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filter categories by selected scope
  const displayedCategories = selectedExportScope === 'all' 
    ? categories 
    : categories.filter((c) => c.id === selectedExportScope);

  // Group products into paginated sheets for clean A4 printing
  const paginatedSheets = React.useMemo(() => {
    const sheets: { category: CarCategory; products: Product[]; pageNumber: number; totalPagesInCat: number }[] = [];

    displayedCategories.forEach((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      if (catProducts.length === 0) return;

      const totalPages = Math.ceil(catProducts.length / ITEMS_PER_PAGE);
      for (let p = 0; p < totalPages; p++) {
        const slice = catProducts.slice(p * ITEMS_PER_PAGE, (p + 1) * ITEMS_PER_PAGE);
        sheets.push({
          category: cat,
          products: slice,
          pageNumber: p + 1,
          totalPagesInCat: totalPages,
        });
      }
    });

    return sheets;
  }, [displayedCategories, products]);

  const totalExportProducts = displayedCategories.reduce((acc, cat) => {
    return acc + products.filter(p => p.categoryId === cat.id).length;
  }, 0);

  // Direct High-Performance PDF Generation with Yielding to prevent UI freeze
  const handleDownloadPdf = async () => {
    if (paginatedSheets.length === 0) {
      setErrorMessage('لا توجد منتجات متاحة في هذا القسم للتصدير');
      return;
    }

    setIsGeneratingPdf(true);
    setExportSuccessMessage('');
    setErrorMessage('');
    setPdfProgress({ current: 0, total: paginatedSheets.length, percent: 0 });

    try {
      // Create PDF in A4 portrait (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 6;
      const printableWidth = pdfWidth - (margin * 2);

      for (let i = 0; i < paginatedSheets.length; i++) {
        const pageEl = document.getElementById(`print-sheet-${i}`);
        if (!pageEl) continue;

        // Yield execution so UI progress bar updates and browser does not lock
        await new Promise((resolve) => setTimeout(resolve, 40));

        setPdfProgress({
          current: i + 1,
          total: paginatedSheets.length,
          percent: Math.round(((i + 1) / paginatedSheets.length) * 100),
        });

        // Render page with optimized scale
        const canvas = await html2canvas(pageEl, {
          scale: 1.3, // Crystal-clear A4 output with low memory usage
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          windowWidth: 1024,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.90);
        const imgProps = pdf.getImageProperties(imgData);
        const calculatedHeight = (imgProps.height * printableWidth) / imgProps.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, Math.min(calculatedHeight, pdfHeight - (margin * 2)));

        // Clean up canvas
        canvas.width = 0;
        canvas.height = 0;
      }

      const scopeName = selectedExportScope === 'all' 
        ? 'all_cars' 
        : displayedCategories[0]?.name?.replace(/\s+/g, '_') || 'category';
      
      const fileName = `wolf_car_catalog_${scopeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      setExportSuccessMessage(`تم إنشاء وتحميل ملف PDF بنجاح (${paginatedSheets.length} صفحة A4)`);
      setTimeout(() => setExportSuccessMessage(''), 6000);

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      setErrorMessage('تعذر إنشاء ملف PDF التلقائي، جاري فتح نافذة الطباعة المباشرة...');
      setTimeout(() => {
        window.print();
      }, 500);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 md:p-8 font-sans">
      
      {/* Top Floating Controls (Hidden during print) */}
      <div className="no-print max-w-6xl mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onExitPrint}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للكتالوج</span>
          </button>
          <div>
            <h2 className="font-extrabold text-sm md:text-base text-white">تصدير وطباعة كتالوج المنتجات</h2>
            <p className="text-slate-400 text-xs">
              تنسيق A4 قياسي (6 منتجات في كل صفحة) لتفادي التعليق وضمان أعلى دقة
            </p>
          </div>
        </div>

        {/* Scope Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-300 pr-2">القسم:</span>
            <select
              value={selectedExportScope}
              onChange={(e) => setSelectedExportScope(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
            >
              <option value="all">📁 كافة الأقسام ({categories.length} أقسام)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  🚗 {cat.name} ({products.filter(p => p.categoryId === cat.id).length} منتج)
                </option>
              ))}
            </select>
          </div>

          {/* Primary Action: Direct PDF Download */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || totalExportProducts === 0}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 shrink-0 text-xs sm:text-sm disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري المعالجة ({pdfProgress?.percent || 0}%)...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>تنزيل ملف PDF ({paginatedSheets.length} صفحة)</span>
              </>
            )}
          </button>

          {/* Secondary Action: Browser Instant Print / Save as PDF */}
          <button
            onClick={handlePrintTrigger}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs transition-colors shrink-0"
            title="فتح نافذة الطباعة المباشرة للمتصفح لحفظها كـ PDF فوراً"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>طباعة سريعة / PDF</span>
          </button>

        </div>

      </div>

      {/* Generating PDF Progress Bar */}
      {isGeneratingPdf && pdfProgress && (
        <div className="no-print max-w-6xl mx-auto mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              جاري تجهيز الصفحات وتحويلها إلى PDF عالي الجودة...
            </span>
            <span className="text-orange-400 font-mono">
              الصفحة {pdfProgress.current} من {pdfProgress.total} ({pdfProgress.percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${pdfProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Success Notification Banner */}
      {exportSuccessMessage && (
        <div className="no-print max-w-6xl mx-auto mb-6 p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 font-bold text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* Export Error Notification Banner */}
      {errorMessage && (
        <div className="no-print max-w-6xl mx-auto mb-6 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center gap-2.5 text-rose-900 font-bold text-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Printable Document Container with Standard A4 Paginated Sheets */}
      <div id="print-catalog-content" className="max-w-4xl mx-auto space-y-8">
        {paginatedSheets.map((sheet, index) => (
          <div 
            key={`sheet-${sheet.category.id}-${sheet.pageNumber}`}
            id={`print-sheet-${index}`}
            className="print-page bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 break-after-page"
            style={{ minHeight: '840px' }}
          >
            {/* Sheet Top Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-7 bg-orange-500 rounded-full" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {sheet.category.name}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    كتالوج منتجات واكسسوارات السيارات المعتمد
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Layers className="w-3.5 h-3.5" />
                <span>صفحة {sheet.pageNumber} من {sheet.totalPagesInCat}</span>
              </div>
            </div>

            {/* Products Grid: 2 Columns x 3 Rows (6 items per A4 sheet) */}
            <div className="print-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sheet.products.map((product) => (
                <div key={product.id} className="print-product-card">
                  <ProductCard 
                    product={product} 
                    showEmployeeActions={false} 
                  />
                </div>
              ))}
            </div>

            {/* Sheet Footer */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>WOLF STORE - نظام الكتالوج وقارئ الباركود</span>
              <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-QA')}</span>
            </div>

          </div>
        ))}

        {paginatedSheets.length === 0 && (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200">
            <Car className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-600 text-sm">لا توجد منتجات في هذا القسم للتصدير.</p>
          </div>
        )}
      </div>

    </div>
  );
};
