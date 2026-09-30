import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sun, Palette, Sparkles, Gem, Flame, Car, Edit2, Check, Copy, RotateCcw, Plus, Save, Info, Tag, AlertCircle } from 'lucide-react';

export type ProtectionTab = 'black_edition' | 'paint' | 'ppf' | 'tint' | 'nano' | 'polish';
export type VehicleType = 'sedan' | 'suv';

export interface ProtectionTintCatalogProps {
  isEmployeeUnlocked?: boolean;
  onLogActivity?: (action: string, details: string) => void;
}

// Initial Default Data Definition
export const INITIAL_PROTECTION_DATA = {
  blackEdition: {
    title: 'Black Edition — Leopard',
    description: 'عازل حراري فاخر بتشطيب أسود أنيق. اختر الدرجة المناسبة لك:',
    items: [
      { id: 'be-1', name: 'LEOPARD 5', price: 499, description: 'درجة داكنة بتظليل أسود ملكي فائق الحماية' },
      { id: 'be-2', name: 'LEOPARD 7', price: 499, description: 'درجة متوازنة لعزل أعلى ورؤية واضحة' },
      { id: 'be-3', name: 'LEOPARD 8', price: 1299, description: 'الفئة الأعلى أداءً بعزل حراري استثنائي بنسبة 99%' }
    ]
  },
  paint: {
    note: 'الأسعار تنطبق على جميع أنواع السيارات',
    items: [
      { id: 'paint-1', name: 'صبغ مطاطي — صدامين ورفارف', price: 3400 },
      { id: 'paint-2', name: 'صبغ عادي — صدامين ورفارف', price: 2200 },
      { id: 'paint-3', name: 'صبغ مطاطي — صدام', price: 900 },
      { id: 'paint-4', name: 'صبغ مطاطي — رفرف', price: 400 },
      { id: 'paint-5', name: 'صبغ عادي — صدام', price: 600 },
      { id: 'paint-6', name: 'صبغ عادي — رفرف (قطعة)', price: 250 },
      { id: 'paint-7', name: 'صبغ عادي — الرينجات (طقم)', price: 1800 },
      { id: 'paint-8', name: 'صبغ مطاطي — الرينجات (طقم)', price: 2200 },
      { id: 'paint-9', name: 'صبغ مطاطي — رنج واحد', price: 450 },
      { id: 'paint-10', name: 'صبغ عادي — رنج واحد', price: 380 }
    ]
  },
  ppf: {
    brands: ['UltraGuard', 'Onyx', 'Xpel'],
    note: 'عند اختيار Full Protection يُضاف العازل الحراري CARONIC مجاناً ضمن نفس الطلب.',
    individualParts: [
      {
        id: 'ppf-p1',
        name: 'مرايا (زوج)',
        prices: {
          UltraGuard: { sedan: 150, suv: 200 },
          Onyx: { sedan: 250, suv: 300 },
          Xpel: { sedan: 350, suv: 400 }
        }
      },
      {
        id: 'ppf-p2',
        name: 'مقابض الأبواب',
        prices: {
          UltraGuard: { sedan: 100, suv: 150 },
          Onyx: { sedan: 200, suv: 250 },
          Xpel: { sedan: 300, suv: 350 }
        }
      },
      {
        id: 'ppf-p3',
        name: 'الصدام الأمامي',
        prices: {
          UltraGuard: { sedan: 800, suv: 1000 },
          Onyx: { sedan: 1500, suv: 1700 },
          Xpel: { sedan: 1800, suv: 2000 }
        }
      },
      {
        id: 'ppf-p4',
        name: 'الصدام الخلفي',
        prices: {
          UltraGuard: { sedan: 800, suv: 1000 },
          Onyx: { sedan: 1500, suv: 1700 },
          Xpel: { sedan: 1800, suv: 2000 }
        }
      },
      {
        id: 'ppf-p5',
        name: 'الرفرف الأمامي',
        prices: {
          UltraGuard: { sedan: 300, suv: 400 },
          Onyx: { sedan: 500, suv: 700 },
          Xpel: { sedan: 1000, suv: 1200 }
        }
      },
      {
        id: 'ppf-p6',
        name: 'الرفرف الخلفي',
        prices: {
          UltraGuard: { sedan: 800, suv: 1000 },
          Onyx: { sedan: 1500, suv: 1700 },
          Xpel: { sedan: 1800, suv: 2000 }
        }
      },
      {
        id: 'ppf-p7',
        name: 'غطاء المحرك (الكبوت)',
        prices: {
          UltraGuard: { sedan: 800, suv: 900 },
          Onyx: { sedan: 1100, suv: 1200 },
          Xpel: { sedan: 1400, suv: 1500 }
        }
      },
      {
        id: 'ppf-p8',
        name: 'حماية باب واحد',
        prices: {
          UltraGuard: { sedan: 300, suv: 400 },
          Onyx: { sedan: 500, suv: 700 },
          Xpel: { sedan: 1000, suv: 1200 }
        }
      },
      {
        id: 'ppf-p9',
        name: 'حماية باب الشنطة',
        prices: {
          UltraGuard: { sedan: 350, suv: 400 },
          Onyx: { sedan: 550, suv: 600 },
          Xpel: { sedan: 900, suv: 1000 }
        }
      },
      {
        id: 'ppf-p10',
        name: 'حماية الأنوار الأمامية',
        prices: {
          UltraGuard: { sedan: 200, suv: 250 },
          Onyx: { sedan: 300, suv: 350 },
          Xpel: { sedan: 400, suv: 450 }
        }
      },
      {
        id: 'ppf-p11',
        name: 'حماية الأنوار الخلفية',
        prices: {
          UltraGuard: { sedan: 200, suv: 250 },
          Onyx: { sedan: 300, suv: 350 },
          Xpel: { sedan: 400, suv: 450 }
        }
      },
      {
        id: 'ppf-p12',
        name: 'حماية السقف',
        prices: {
          UltraGuard: { sedan: 1000, suv: 1200 },
          Onyx: { sedan: 1500, suv: 1700 },
          Xpel: { sedan: 2300, suv: 2500 }
        }
      },
      {
        id: 'ppf-p13',
        name: 'حماية الزجاج الأمامي',
        prices: {
          UltraGuard: { sedan: 700, suv: 700 },
          Onyx: { sedan: 700, suv: 700 },
          Xpel: { sedan: 700, suv: 700 }
        }
      }
    ],
    packages: [
      {
        id: 'ppf-pkg1',
        name: 'الحماية الأمامية الكاملة (كبوت + رفارف + صدام + مرايا)',
        prices: {
          UltraGuard: { sedan: 1699, suv: 1999 },
          Onyx: { sedan: 2999, suv: 3499 },
          Xpel: { sedan: 3499, suv: 3999 }
        }
      },
      {
        id: 'ppf-pkg2',
        name: 'حماية مقدمة السيارة (ربع)',
        prices: {
          UltraGuard: { sedan: 1499, suv: 1699 },
          Onyx: { sedan: 2499, suv: 2999 },
          Xpel: { sedan: 2999, suv: 3499 }
        }
      },
      {
        id: 'ppf-pkg3',
        name: 'Full Protection — حماية كاملة للسيارة + عازل حراري CARONIC مجاناً',
        badge: 'عازل مجاني',
        isFreeTintBonus: true,
        prices: {
          UltraGuard: { sedan: 4999, suv: 5999 },
          Onyx: { sedan: 5999, suv: 6999 },
          Xpel: { sedan: 7999, suv: 8999 }
        }
      }
    ]
  },
  tint: {
    brands: ['CARONIC', 'SANTEK', 'Xpel'],
    items: [
      {
        id: 'tint-1',
        name: 'الزجاج بالكامل (تينت عادي)',
        prices: {
          CARONIC: { sedan: 999, suv: 1199 },
          SANTEK: { sedan: 2699, suv: 2999 },
          Xpel: { sedan: 1699, suv: 1999 }
        }
      },
      {
        id: 'tint-2',
        name: 'الزجاج الأمامي فقط',
        prices: {
          CARONIC: { sedan: 250, suv: 300 },
          SANTEK: { sedan: 650, suv: 750 },
          Xpel: { sedan: 450, suv: 500 }
        }
      },
      {
        id: 'tint-3',
        name: 'الزجاج الخلفي فقط',
        prices: {
          CARONIC: { sedan: 250, suv: 300 },
          SANTEK: { sedan: 650, suv: 750 },
          Xpel: { sedan: 450, suv: 500 }
        }
      },
      {
        id: 'tint-4',
        name: 'نافذة واحدة',
        prices: {
          CARONIC: { sedan: 100, suv: 150 },
          SANTEK: { sedan: 250, suv: 250 },
          Xpel: { sedan: 150, suv: 250 }
        }
      }
    ]
  },
  nanoCeramic: {
    note: 'يُمنح مجاناً عند شراء Full Protection.',
    items: [
      { id: 'nano-1', name: 'نانو سيراميك — ضمان 5 سنوات', price: 1800, note: 'حماية ولمعان فائق بتقنية النانو' }
    ]
  },
  polish: {
    items: [
      { id: 'polish-1', name: 'بولش كامل', price: 1200 },
      { id: 'polish-2', name: 'بولش خارجي', price: 600 },
      { id: 'polish-3', name: 'بولش داخلي', price: 600 }
    ]
  }
};

export const ProtectionTintCatalog: React.FC<ProtectionTintCatalogProps> = ({
  isEmployeeUnlocked = false,
  onLogActivity
}) => {
  const [activeTab, setActiveTab] = useState<ProtectionTab>('black_edition');
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editable data state with localStorage persistence
  const [catalogData, setCatalogData] = useState(() => {
    try {
      const saved = localStorage.getItem('wolfcar_protection_tint_data');
      return saved ? JSON.parse(saved) : INITIAL_PROTECTION_DATA;
    } catch {
      return INITIAL_PROTECTION_DATA;
    }
  });

  // Edit Mode state for staff/employees
  const [isEditingData, setIsEditingData] = useState(false);

  // Save changes to localStorage
  const saveCatalogData = (newData: typeof INITIAL_PROTECTION_DATA) => {
    setCatalogData(newData);
    localStorage.setItem('wolfcar_protection_tint_data', JSON.stringify(newData));
    if (onLogActivity) {
      onLogActivity('product_edit', 'تم تحديث أسعار خدمات الحماية والعازل الحراري');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('هل تريد إعادة تعيين كافة أسعار وخدمات الحماية والعازل الحراري إلى القيم الأصلية؟')) {
      saveCatalogData(INITIAL_PROTECTION_DATA);
      setIsEditingData(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showVehicleToggle = activeTab === 'ppf' || activeTab === 'tint';

  return (
    <div id="protection-tint-catalog-section" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans text-slate-900 dir-rtl my-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Decorative Gloss Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
              WOLF CAR SERVICES
            </span>
            <span className="text-xs text-orange-400 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>كتالوج الخدمات المعتمدة</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>خدمات الحماية والعازل الحراري</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            الباقات الفاخرة للصبغ العادي والمطاطي، حماية PPF، العازل الحراري النانو سيراميك، والبوليش مع خيارات الضمان والمواصفات المعيارية
          </p>
        </div>

        {/* Staff Quick Control Actions */}
        {isEmployeeUnlocked && (
          <div className="z-10 flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
            <button
              onClick={() => setIsEditingData(!isEditingData)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isEditingData
                  ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingData ? 'إنهاء التعديل' : 'تعديل الأسعار'}</span>
            </button>
            {isEditingData && (
              <button
                onClick={handleResetDefaults}
                className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-xl border border-slate-700 transition-colors"
                title="إعادة التعيين للأسعار الأصلية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Capsule Bar & Vehicle Selector */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* 6 Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('black_edition')}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
              activeTab === 'black_edition'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <span>Black Edition</span>
          </button>

          <button
            onClick={() => setActiveTab('paint')}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
              activeTab === 'paint'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>الصبغ</span>
          </button>

          <button
            onClick={() => setActiveTab('ppf')}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
              activeTab === 'ppf'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>حماية PPF</span>
          </button>

          <button
            onClick={() => setActiveTab('tint')}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
              activeTab === 'tint'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>العازل الحراري</span>
          </button>

          <button
            onClick={() => setActiveTab('nano')}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
              activeTab === 'nano'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>نانو سيراميك</span>
          </button>

          <button
            onClick={() => setActiveTab('polish')}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
              activeTab === 'polish'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <Gem className="w-3.5 h-3.5" />
            <span>بولش</span>
          </button>
        </div>

        {/* Vehicle Type Switcher Toggle (Sedan vs SUV) - ONLY shown on PPF and Tinting Tabs */}
        {showVehicleToggle && (
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs w-full lg:w-auto justify-center">
            <span className="text-[11px] font-bold text-slate-500 px-2">نوع السيارة:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100">
              <button
                onClick={() => setVehicleType('sedan')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vehicleType === 'sedan'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Sedan (صالون)</span>
              </button>
              <button
                onClick={() => setVehicleType('suv')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vehicleType === 'suv'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>SUV (فورويل)</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Section Content Views */}
      <div className="p-4 sm:p-6 space-y-6">

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: BLACK EDITION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'black_edition' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-orange-400 font-mono text-xs font-extrabold uppercase tracking-widest">LIMITED EDITION</span>
                <h3 className="text-lg font-extrabold text-white">{catalogData.blackEdition.title}</h3>
                <p className="text-xs text-slate-300">{catalogData.blackEdition.description}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-bold text-orange-400">
                <Flame className="w-4 h-4 fill-orange-400" />
                <span>تشطيب أسود ملكي فائق الحرارة</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {catalogData.blackEdition.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-orange-400 transition-all flex flex-col justify-between space-y-4 group relative"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                        {item.name}
                      </span>
                      <button
                        onClick={() => handleCopyText(`${item.name} — ${item.price} QAR`, item.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="نسخ تفاصيل الخدمة"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-400">السعر المطلق</span>
                    {isEditingData ? (
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = { ...catalogData };
                          updated.blackEdition.items[idx].price = val;
                          saveCatalogData(updated);
                        }}
                        className="w-24 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-sm font-extrabold text-orange-600 text-left focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-baseline gap-1 text-orange-600 font-extrabold text-2xl tracking-tight">
                        <span>{item.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-700 font-bold">ر.ق (QAR)</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PAINT (الصبغ) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'paint' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="bg-orange-50 border border-orange-200/80 p-3.5 rounded-xl flex items-center justify-between text-xs text-orange-900 font-bold">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{catalogData.paint.note}</span>
              </div>
              <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-[10px]">ضمان الجودة والتجهيز</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white text-xs font-extrabold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">الخدمة والتفاصيل</th>
                    <th className="p-3.5 text-left">السعر (ريال قطري QAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {catalogData.paint.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-400 text-center w-12">{index + 1}</td>
                      <td className="p-3.5 font-bold text-slate-800 text-sm">
                        {item.name}
                      </td>
                      <td className="p-3.5 text-left">
                        {isEditingData ? (
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = { ...catalogData };
                              updated.paint.items[index].price = val;
                              saveCatalogData(updated);
                            }}
                            className="w-24 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-xs font-extrabold text-orange-600 text-left"
                          />
                        ) : (
                          <span className="text-orange-600 font-extrabold text-base">
                            {item.price.toLocaleString()} <span className="text-xs text-slate-700">ر.ق</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: PPF (حماية PPF) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'ppf' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  <span>مقارنة ماركات حماية PPF لـ ({vehicleType === 'sedan' ? 'صالون Sedan' : 'فورويل SUV'})</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">اختر الماركة والتغطية التي تناسب احتياجات حماية سيارتك</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-slate-200 border border-slate-700">UltraGuard</span>
                <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-slate-200 border border-slate-700">Onyx</span>
                <span className="px-2.5 py-1 bg-orange-600 text-white rounded-lg">Xpel</span>
              </div>
            </div>

            {/* Individual Parts Table */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-orange-600" />
                <span>[قطع فردية]</span>
              </h5>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3">القطعة</th>
                      <th className="p-3 text-center bg-orange-500/5 text-slate-900">UltraGuard</th>
                      <th className="p-3 text-center bg-slate-200/50 text-slate-900">Onyx</th>
                      <th className="p-3 text-center bg-orange-600/10 text-orange-900">Xpel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {catalogData.ppf.individualParts.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="p-3 font-bold text-slate-800 text-xs sm:text-sm">{item.name}</td>
                        
                        {/* UltraGuard */}
                        <td className="p-3 text-center font-extrabold text-slate-800 bg-orange-500/5">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.UltraGuard[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.ppf.individualParts[idx].prices.UltraGuard[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-16 bg-white border border-slate-300 rounded text-center py-0.5 text-xs font-bold"
                            />
                          ) : (
                            <span>{item.prices.UltraGuard[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>

                        {/* Onyx */}
                        <td className="p-3 text-center font-extrabold text-slate-800 bg-slate-200/40">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.Onyx[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.ppf.individualParts[idx].prices.Onyx[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-16 bg-white border border-slate-300 rounded text-center py-0.5 text-xs font-bold"
                            />
                          ) : (
                            <span>{item.prices.Onyx[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>

                        {/* Xpel */}
                        <td className="p-3 text-center font-extrabold text-orange-600 bg-orange-600/10">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.Xpel[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.ppf.individualParts[idx].prices.Xpel[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-16 bg-white border border-orange-300 rounded text-center py-0.5 text-xs font-extrabold text-orange-600"
                            />
                          ) : (
                            <span>{item.prices.Xpel[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Packages Table */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>[الباقات المتميزة]</span>
              </h5>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white font-extrabold">
                    <tr>
                      <th className="p-3.5">اسم الباقة والتغطية</th>
                      <th className="p-3.5 text-center">UltraGuard</th>
                      <th className="p-3.5 text-center">Onyx</th>
                      <th className="p-3.5 text-center bg-orange-600 text-white">Xpel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {catalogData.ppf.packages.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className={item.isFreeTintBonus ? 'bg-emerald-50/50 hover:bg-emerald-50 transition-colors' : 'hover:bg-slate-50 transition-colors'}
                      >
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{item.name}</span>
                            {item.badge && (
                              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                                <Sparkles className="w-3 h-3 fill-white" />
                                <span>{item.badge}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-center font-extrabold text-slate-800">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.UltraGuard[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.ppf.packages[idx].prices.UltraGuard[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-20 bg-white border border-slate-300 rounded text-center py-1 text-xs font-bold"
                            />
                          ) : (
                            <span className="text-sm">{item.prices.UltraGuard[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-extrabold text-slate-800">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.Onyx[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.ppf.packages[idx].prices.Onyx[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-20 bg-white border border-slate-300 rounded text-center py-1 text-xs font-bold"
                            />
                          ) : (
                            <span className="text-sm">{item.prices.Onyx[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-extrabold text-orange-600 bg-orange-50">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.Xpel[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.ppf.packages[idx].prices.Xpel[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-20 bg-white border border-orange-300 rounded text-center py-1 text-xs font-bold text-orange-600"
                            />
                          ) : (
                            <span className="text-base font-black">{item.prices.Xpel[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{catalogData.ppf.note}</span>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: TINTING (العازل الحراري) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'tint' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-400" />
                <span>مقارنة ماركات العازل الحراري لـ ({vehicleType === 'sedan' ? 'صالون Sedan' : 'فورويل SUV'})</span>
              </h4>
              <span className="text-xs text-orange-400 font-mono font-bold">CARONIC | SANTEK | Xpel</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">الخدمة والتغطية</th>
                    <th className="p-3.5 text-center bg-orange-50 font-bold text-orange-900">CARONIC</th>
                    <th className="p-3.5 text-center font-bold text-slate-800">SANTEK</th>
                    <th className="p-3.5 text-center bg-orange-600/10 font-extrabold text-orange-900">Xpel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {catalogData.tint.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800 text-sm">{item.name}</td>
                      
                      {/* CARONIC */}
                      <td className="p-3.5 text-center font-extrabold text-orange-600 bg-orange-50/50">
                        {isEditingData ? (
                          <input
                            type="number"
                            value={item.prices.CARONIC[vehicleType]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = { ...catalogData };
                              updated.tint.items[idx].prices.CARONIC[vehicleType] = val;
                              saveCatalogData(updated);
                            }}
                            className="w-20 bg-white border border-orange-300 rounded text-center py-1 text-xs font-bold text-orange-600"
                          />
                        ) : (
                          <span className="text-sm">{item.prices.CARONIC[vehicleType].toLocaleString()} ر.ق</span>
                        )}
                      </td>

                      {/* SANTEK */}
                      <td className="p-3.5 text-center font-extrabold text-slate-800">
                        {isEditingData ? (
                          <input
                            type="number"
                            value={item.prices.SANTEK[vehicleType]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = { ...catalogData };
                              updated.tint.items[idx].prices.SANTEK[vehicleType] = val;
                              saveCatalogData(updated);
                            }}
                            className="w-20 bg-white border border-slate-300 rounded text-center py-1 text-xs font-bold"
                          />
                        ) : (
                          <span className="text-sm">{item.prices.SANTEK[vehicleType].toLocaleString()} ر.ق</span>
                        )}
                      </td>

                      {/* Xpel */}
                      <td className="p-3.5 text-center font-extrabold text-slate-900 bg-orange-600/10">
                        {isEditingData ? (
                          <input
                            type="number"
                            value={item.prices.Xpel[vehicleType]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = { ...catalogData };
                              updated.tint.items[idx].prices.Xpel[vehicleType] = val;
                              saveCatalogData(updated);
                            }}
                            className="w-20 bg-white border border-orange-300 rounded text-center py-1 text-xs font-bold"
                          />
                        ) : (
                          <span className="text-sm">{item.prices.Xpel[vehicleType].toLocaleString()} ر.ق</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: NANO CERAMIC (نانو سيراميك) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'nano' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  ضمان 5 سنوات معتمد
                </span>
                <h4 className="text-lg font-extrabold text-slate-900">نانو سيراميك — ضمان 5 سنوات</h4>
                <p className="text-xs text-slate-500">حماية هيكل السيارة الخارجي ولمعان دائم مضاد للخدوش السطحية والعوامل الجوية</p>
              </div>

              <div className="flex items-center gap-3">
                {isEditingData ? (
                  <input
                    type="number"
                    value={catalogData.nanoCeramic.items[0].price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updated = { ...catalogData };
                      updated.nanoCeramic.items[0].price = val;
                      saveCatalogData(updated);
                    }}
                    className="w-28 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-lg font-black text-orange-600"
                  />
                ) : (
                  <div className="text-orange-600 font-black text-3xl">
                    {catalogData.nanoCeramic.items[0].price.toLocaleString()} <span className="text-xs text-slate-700 font-bold">ر.ق</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ملاحظة: {catalogData.nanoCeramic.note}</span>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: POLISH (بولش) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'polish' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {catalogData.polish.items.map((item, idx) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-orange-400 transition-all flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">خدمة التلميع</span>
                    <h4 className="font-extrabold text-slate-900 text-base">{item.name}</h4>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-400">السعر</span>
                    {isEditingData ? (
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = { ...catalogData };
                          updated.polish.items[idx].price = val;
                          saveCatalogData(updated);
                        }}
                        className="w-24 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-sm font-bold text-orange-600 text-left"
                      />
                    ) : (
                      <div className="text-orange-600 font-black text-2xl">
                        {item.price.toLocaleString()} <span className="text-xs text-slate-700 font-bold">ر.ق</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
