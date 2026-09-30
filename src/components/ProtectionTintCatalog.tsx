import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sun, 
  Palette, 
  Sparkles, 
  Gem, 
  Flame, 
  Car, 
  Edit2, 
  Check, 
  Copy, 
  RotateCcw, 
  Plus, 
  Save, 
  Info, 
  Tag, 
  Trash2, 
  Search, 
  Printer, 
  X, 
  AlertTriangle, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  subscribeToProtectionCatalog, 
  saveProtectionCatalogToDb, 
  getProtectionCatalogData 
} from '../supabase';

export type ProtectionTab = 'black_edition' | 'paint' | 'ppf' | 'tint' | 'nano' | 'polish';
export type VehicleType = 'sedan' | 'suv';

export interface ProtectionControls {
  isEditing: boolean;
  toggleEditing: () => void;
  openAddModal: () => void;
  openReorderModal: () => void;
  resetDefaults: () => void;
  printCatalog: () => void;
  isDbSynced: boolean;
  servicesCount: number;
}

export interface ProtectionTintCatalogProps {
  isEmployeeUnlocked?: boolean;
  onLogActivity?: (action: string, details: string) => void;
  onRegisterControls?: (controls: ProtectionControls) => void;
}

export const INITIAL_PROTECTION_DATA = {
  tabOrder: ['black_edition', 'paint', 'ppf', 'tint', 'nano', 'polish'] as ProtectionTab[],
  blackEdition: {
    title: 'Black Edition — Leopard',
    description: 'عازل حراري فاخر بتشطيب أسود أنيق. اختر الدرجة المناسبة لك:',
    badge: 'عازل حراري بنسبة تصل إلى 99%',
    isBadgeEnabled: true,
    isDescriptionEnabled: true,
    items: [
      { id: 'be-1', name: 'LEOPARD 5', price: 499, description: 'درجة داكنة بتظليل أسود ملكي فائق الحماية والعزل الحراري' },
      { id: 'be-2', name: 'LEOPARD 7', price: 499, description: 'درجة متوازنة لعزل أعلى ورؤية واضحة نهاراً وليلاً' },
      { id: 'be-3', name: 'LEOPARD 8', price: 1299, description: 'الفئة الأعلى أداءً بعزل حراري استثنائي بنسبة 99% وحماية من الأشعة فوق البنفسجية' }
    ]
  },
  paint: {
    note: 'الأسعار تنطبق على جميع أنواع السيارات',
    badge: 'مطابق للمواصفات المعيارية',
    isNoteEnabled: true,
    isBadgeEnabled: true,
    headerServiceName: 'الخدمة والتفاصيل',
    headerPriceName: 'السعر بالريال القطري (QAR)',
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
    title: 'مقارنة ماركات حماية PPF لـ',
    description: 'ضمان حقيقي ضد الخدوش والعوامل الجوية مع تشطيب شفاف ذاتي المعالجة',
    partsTitle: '[قطع فردية]',
    partsSubTitle: 'الأسعار بالريال القطري (QAR)',
    packagesTitle: '[باقات]',
    packageTableHeader: 'اسم الباقة والتغطية',
    note: 'عند اختيار Full Protection يُضاف العازل الحراري CARONIC مجاناً ضمن نفس الطلب.',
    isNoteEnabled: true,
    individualParts: [
      {
        id: 'ppf-p1',
        name: 'مرايا (زوج)',
        prices: {
          brand0: { sedan: 150, suv: 200 },
          brand1: { sedan: 250, suv: 300 },
          brand2: { sedan: 350, suv: 400 }
        }
      },
      {
        id: 'ppf-p2',
        name: 'مقابض الأبواب',
        prices: {
          brand0: { sedan: 100, suv: 150 },
          brand1: { sedan: 200, suv: 250 },
          brand2: { sedan: 300, suv: 350 }
        }
      },
      {
        id: 'ppf-p3',
        name: 'الصدام الأمامي',
        prices: {
          brand0: { sedan: 800, suv: 1000 },
          brand1: { sedan: 1500, suv: 1700 },
          brand2: { sedan: 1800, suv: 2000 }
        }
      },
      {
        id: 'ppf-p4',
        name: 'الصدام الخلفي',
        prices: {
          brand0: { sedan: 800, suv: 1000 },
          brand1: { sedan: 1500, suv: 1700 },
          brand2: { sedan: 1800, suv: 2000 }
        }
      },
      {
        id: 'ppf-p5',
        name: 'الرفرف الأمامي',
        prices: {
          brand0: { sedan: 300, suv: 400 },
          brand1: { sedan: 500, suv: 700 },
          brand2: { sedan: 1000, suv: 1200 }
        }
      },
      {
        id: 'ppf-p6',
        name: 'الرفرف الخلفي',
        prices: {
          brand0: { sedan: 800, suv: 1000 },
          brand1: { sedan: 1500, suv: 1700 },
          brand2: { sedan: 1800, suv: 2000 }
        }
      },
      {
        id: 'ppf-p7',
        name: 'غطاء المحرك (الكبوت)',
        prices: {
          brand0: { sedan: 800, suv: 900 },
          brand1: { sedan: 1100, suv: 1200 },
          brand2: { sedan: 1400, suv: 1500 }
        }
      },
      {
        id: 'ppf-p8',
        name: 'حماية باب واحد',
        prices: {
          brand0: { sedan: 300, suv: 400 },
          brand1: { sedan: 500, suv: 700 },
          brand2: { sedan: 1000, suv: 1200 }
        }
      },
      {
        id: 'ppf-p9',
        name: 'حماية باب الشنطة',
        prices: {
          brand0: { sedan: 350, suv: 400 },
          brand1: { sedan: 550, suv: 600 },
          brand2: { sedan: 900, suv: 1000 }
        }
      },
      {
        id: 'ppf-p10',
        name: 'حماية الأنوار الأمامية',
        prices: {
          brand0: { sedan: 200, suv: 250 },
          brand1: { sedan: 300, suv: 350 },
          brand2: { sedan: 400, suv: 450 }
        }
      },
      {
        id: 'ppf-p11',
        name: 'حماية الأنوار الخلفية',
        prices: {
          brand0: { sedan: 200, suv: 250 },
          brand1: { sedan: 300, suv: 350 },
          brand2: { sedan: 400, suv: 450 }
        }
      },
      {
        id: 'ppf-p12',
        name: 'حماية السقف',
        prices: {
          brand0: { sedan: 1000, suv: 1200 },
          brand1: { sedan: 1500, suv: 1700 },
          brand2: { sedan: 2300, suv: 2500 }
        }
      },
      {
        id: 'ppf-p13',
        name: 'حماية الزجاج الأمامي',
        prices: {
          brand0: { sedan: 700, suv: 700 },
          brand1: { sedan: 700, suv: 700 },
          brand2: { sedan: 700, suv: 700 }
        }
      }
    ],
    packages: [
      {
        id: 'ppf-pkg1',
        name: 'الحماية الأمامية الكاملة (كبوت + رفارف + صدام + مرايا)',
        badge: 'الأكثر طلباً',
        prices: {
          brand0: { sedan: 1699, suv: 1999 },
          brand1: { sedan: 2999, suv: 3499 },
          brand2: { sedan: 3499, suv: 3999 }
        }
      },
      {
        id: 'ppf-pkg2',
        name: 'حماية مقدمة السيارة (ربع)',
        badge: '',
        prices: {
          brand0: { sedan: 1499, suv: 1699 },
          brand1: { sedan: 2499, suv: 2999 },
          brand2: { sedan: 2999, suv: 3499 }
        }
      },
      {
        id: 'ppf-pkg3',
        name: 'Full Protection — حماية كاملة للسيارة + عازل حراري CARONIC مجاناً',
        badge: 'عازل مجاني',
        isFreeTintBonus: true,
        prices: {
          brand0: { sedan: 4999, suv: 5999 },
          brand1: { sedan: 5999, suv: 6999 },
          brand2: { sedan: 7999, suv: 8999 }
        }
      }
    ]
  },
  tint: {
    brands: ['CARONIC', 'SANTEK', 'Xpel'],
    headerItemName: 'نوع التظليل / النافذة',
    items: [
      {
        id: 'tint-1',
        name: 'الزجاج بالكامل (تينت عادي)',
        prices: {
          brand0: { sedan: 999, suv: 1199 },
          brand1: { sedan: 2699, suv: 2999 },
          brand2: { sedan: 1699, suv: 1999 }
        }
      },
      {
        id: 'tint-2',
        name: 'الزجاج الأمامي فقط',
        prices: {
          brand0: { sedan: 250, suv: 300 },
          brand1: { sedan: 650, suv: 750 },
          brand2: { sedan: 450, suv: 500 }
        }
      },
      {
        id: 'tint-3',
        name: 'الزجاج الخلفي فقط',
        prices: {
          brand0: { sedan: 250, suv: 300 },
          brand1: { sedan: 650, suv: 750 },
          brand2: { sedan: 450, suv: 500 }
        }
      },
      {
        id: 'tint-4',
        name: 'نافذة واحدة',
        prices: {
          brand0: { sedan: 100, suv: 150 },
          brand1: { sedan: 250, suv: 250 },
          brand2: { sedan: 150, suv: 250 }
        }
      }
    ]
  },
  nanoCeramic: {
    note: 'ملاحظة خاصة: يُمنح مجاناً عند شراء Full Protection.',
    badge: 'شهادة ضمان معتمدة 5 سنوات',
    isNoteEnabled: true,
    isBadgeEnabled: true,
    items: [
      { 
        id: 'nano-1', 
        name: 'نانو سيراميك — ضمان 5 سنوات', 
        price: 1800, 
        note: 'حماية ولمعان فائق بتقنية النانو مع شهادة ضمان معتمدة' 
      }
    ]
  },
  polish: {
    note: 'أفضل مواد التلميع الألمانية والأمريكية لإعادة بريق وكالة السيارة',
    isNoteEnabled: true,
    items: [
      { id: 'polish-1', name: 'بولش كامل', price: 1200 },
      { id: 'polish-2', name: 'بولش خارجي', price: 600 },
      { id: 'polish-3', name: 'بولش داخلي', price: 600 }
    ]
  }
};

// Normalize data structure for compatibility
function normalizeCatalogData(data: any): typeof INITIAL_PROTECTION_DATA {
  if (!data) return INITIAL_PROTECTION_DATA;

  const normalized = { ...INITIAL_PROTECTION_DATA, ...data };
  if (!normalized.tabOrder || !Array.isArray(normalized.tabOrder) || normalized.tabOrder.length === 0) {
    normalized.tabOrder = ['black_edition', 'paint', 'ppf', 'tint', 'nano', 'polish'];
  }

  // Ensure toggle states default to true
  if (normalized.paint) {
    normalized.paint.isNoteEnabled = normalized.paint.isNoteEnabled !== false;
    normalized.paint.isBadgeEnabled = normalized.paint.isBadgeEnabled !== false;
  }
  if (normalized.ppf) {
    normalized.ppf.isNoteEnabled = normalized.ppf.isNoteEnabled !== false;
  }
  if (normalized.nanoCeramic) {
    normalized.nanoCeramic.isNoteEnabled = normalized.nanoCeramic.isNoteEnabled !== false;
    normalized.nanoCeramic.isBadgeEnabled = normalized.nanoCeramic.isBadgeEnabled !== false;
  }
  if (normalized.blackEdition) {
    normalized.blackEdition.isBadgeEnabled = normalized.blackEdition.isBadgeEnabled !== false;
    normalized.blackEdition.isDescriptionEnabled = normalized.blackEdition.isDescriptionEnabled !== false;
  }
  if (normalized.polish) {
    normalized.polish.isNoteEnabled = normalized.polish.isNoteEnabled !== false;
  }

  // Ensure PPF brands
  if (!normalized.ppf.brands || normalized.ppf.brands.length < 3) {
    normalized.ppf.brands = ['UltraGuard', 'Onyx', 'Xpel'];
  }
  // Ensure Tint brands
  if (!normalized.tint.brands || normalized.tint.brands.length < 3) {
    normalized.tint.brands = ['CARONIC', 'SANTEK', 'Xpel'];
  }

  // Normalize PPF individual parts prices to brand0, brand1, brand2
  if (Array.isArray(normalized.ppf.individualParts)) {
    normalized.ppf.individualParts = normalized.ppf.individualParts.map((item: any) => {
      const p = item.prices || {};
      const brand0 = p.brand0 || p.UltraGuard || { sedan: 0, suv: 0 };
      const brand1 = p.brand1 || p.Onyx || { sedan: 0, suv: 0 };
      const brand2 = p.brand2 || p.Xpel || { sedan: 0, suv: 0 };
      return {
        ...item,
        prices: { brand0, brand1, brand2 }
      };
    });
  }

  // Normalize PPF packages
  if (Array.isArray(normalized.ppf.packages)) {
    normalized.ppf.packages = normalized.ppf.packages.map((pkg: any) => {
      const p = pkg.prices || {};
      const brand0 = p.brand0 || p.UltraGuard || { sedan: 0, suv: 0 };
      const brand1 = p.brand1 || p.Onyx || { sedan: 0, suv: 0 };
      const brand2 = p.brand2 || p.Xpel || { sedan: 0, suv: 0 };
      return {
        ...pkg,
        prices: { brand0, brand1, brand2 }
      };
    });
  }

  // Normalize Tint items
  if (Array.isArray(normalized.tint.items)) {
    normalized.tint.items = normalized.tint.items.map((item: any) => {
      const p = item.prices || {};
      const brand0 = p.brand0 || p.CARONIC || { sedan: 0, suv: 0 };
      const brand1 = p.brand1 || p.SANTEK || { sedan: 0, suv: 0 };
      const brand2 = p.brand2 || p.Xpel || { sedan: 0, suv: 0 };
      return {
        ...item,
        prices: { brand0, brand1, brand2 }
      };
    });
  }

  return normalized;
}

// Reusable toggle switch component for notes & badges
const NoteToggleSwitch: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  label?: string;
}> = ({ enabled, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shadow-2xs shrink-0 ${
      enabled
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
    }`}
    title={enabled ? 'الملاحظة مفعلة وظاهرة (اضغط للإغلاق/الإخفاء)' : 'الملاحظة مغلقة ومخفية (اضغط للتفعيل/الإظهار)'}
  >
    {enabled ? (
      <>
        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
        <Eye className="w-3 h-3 text-emerald-600" />
        <span>مفعلة</span>
      </>
    ) : (
      <>
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <EyeOff className="w-3 h-3 text-slate-400" />
        <span>مغلقة</span>
      </>
    )}
    {label && <span className="text-[10px] text-slate-500">({label})</span>}
  </button>
);

export const ProtectionTintCatalog: React.FC<ProtectionTintCatalogProps> = ({
  isEmployeeUnlocked = false,
  onLogActivity,
  onRegisterControls
}) => {
  // 1. Data state loaded from DB / Local cache
  const [catalogData, setCatalogData] = useState<typeof INITIAL_PROTECTION_DATA>(() => {
    const cached = getProtectionCatalogData();
    return normalizeCatalogData(cached);
  });

  const [isDbSynced, setIsDbSynced] = useState(true);
  const [activeTab, setActiveTab] = useState<ProtectionTab>('black_edition');
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // 2. Editing and modal states (Strictly active only when employee is authenticated)
  const [isEditingDataRaw, setIsEditingData] = useState(false);
  const isEditingData = isEditingDataRaw && isEmployeeUnlocked;
  const [isAddModalOpenRaw, setIsAddModalOpen] = useState(false);
  const isAddModalOpen = isAddModalOpenRaw && isEmployeeUnlocked;
  const [isReorderModalOpenRaw, setIsReorderModalOpen] = useState(false);
  const isReorderModalOpen = isReorderModalOpenRaw && isEmployeeUnlocked;

  // Auto reset editing states whenever locked
  useEffect(() => {
    if (!isEmployeeUnlocked) {
      setIsEditingData(false);
      setIsAddModalOpen(false);
      setIsReorderModalOpen(false);
    }
  }, [isEmployeeUnlocked]);

  // Add Item form state
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    description: '',
    price: 500,
    priceBrand0Sedan: 500,
    priceBrand0Suv: 600,
    priceBrand1Sedan: 800,
    priceBrand1Suv: 950,
    priceBrand2Sedan: 1100,
    priceBrand2Suv: 1300,
    isPackage: false,
    badge: ''
  });

  // Calculate total services count
  const calculateTotalCount = (data: typeof INITIAL_PROTECTION_DATA) => {
    return (
      (data.blackEdition?.items?.length || 0) +
      (data.paint?.items?.length || 0) +
      (data.ppf?.individualParts?.length || 0) +
      (data.ppf?.packages?.length || 0) +
      (data.tint?.items?.length || 0) +
      (data.nanoCeramic?.items?.length || 0) +
      (data.polish?.items?.length || 0)
    );
  };

  // 3. Realtime subscription to database updates
  useEffect(() => {
    const unsubscribe = subscribeToProtectionCatalog((latestData) => {
      if (latestData) {
        setCatalogData(normalizeCatalogData(latestData));
        setIsDbSynced(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // 4. Save to Database (Supabase + Firebase + LocalStorage)
  const saveCatalogData = async (newData: typeof INITIAL_PROTECTION_DATA, activityMsg?: string) => {
    setCatalogData(newData);
    setIsDbSynced(false);

    try {
      await saveProtectionCatalogToDb(newData);
      setIsDbSynced(true);
      setSaveFeedback('تم الحفظ في قاعدة البيانات السحابية');
      setTimeout(() => setSaveFeedback(null), 3000);

      if (activityMsg && onLogActivity) {
        onLogActivity('product_edit', activityMsg);
      }
    } catch (err) {
      console.error('Failed to sync protection catalog:', err);
      setSaveFeedback('تم الحفظ محلياً (خطأ بالمزامنة)');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين كافة أسعار ومسميات وخدمات الحماية والعازل الحراري إلى القيم الأصلية المعتمدة؟')) {
      saveCatalogData(INITIAL_PROTECTION_DATA, 'إعادة تعيين أسعار الحماية والعازل للقيم الأصلية');
      setIsEditingData(false);
    }
  };

  const handlePrintSection = () => {
    window.print();
  };

  // Toggle notes helper functions
  const togglePaintNote = () => {
    const current = catalogData.paint.isNoteEnabled !== false;
    const updated = { ...catalogData };
    updated.paint.isNoteEnabled = !current;
    saveCatalogData(updated, `${!current ? 'تفعيل' : 'إغلاق'} ملاحظة الصبغ`);
  };

  const togglePaintBadge = () => {
    const current = catalogData.paint.isBadgeEnabled !== false;
    const updated = { ...catalogData };
    updated.paint.isBadgeEnabled = !current;
    saveCatalogData(updated, `${!current ? 'تفعيل' : 'إغلاق'} شارة الصبغ`);
  };

  const togglePpfNote = () => {
    const current = catalogData.ppf.isNoteEnabled !== false;
    const updated = { ...catalogData };
    updated.ppf.isNoteEnabled = !current;
    saveCatalogData(updated, `${!current ? 'تفعيل' : 'إغلاق'} ملاحظة باقة Full Protection`);
  };

  const toggleNanoNote = () => {
    const current = catalogData.nanoCeramic.isNoteEnabled !== false;
    const updated = { ...catalogData };
    updated.nanoCeramic.isNoteEnabled = !current;
    saveCatalogData(updated, `${!current ? 'تفعيل' : 'إغلاق'} ملاحظة النانو سيراميك`);
  };

  const toggleNanoBadge = () => {
    const current = catalogData.nanoCeramic.isBadgeEnabled !== false;
    const updated = { ...catalogData };
    updated.nanoCeramic.isBadgeEnabled = !current;
    saveCatalogData(updated, `${!current ? 'تفعيل' : 'إغلاق'} شارة ضمان النانو`);
  };

  const toggleBlackEditionBadge = () => {
    const current = catalogData.blackEdition.isBadgeEnabled !== false;
    const updated = { ...catalogData };
    updated.blackEdition.isBadgeEnabled = !current;
    saveCatalogData(updated, `${!current ? 'تفعيل' : 'إغلاق'} شارة Black Edition`);
  };

  // Register controls to the parent header
  useEffect(() => {
    if (onRegisterControls) {
      onRegisterControls({
        isEditing: isEditingData,
        toggleEditing: () => {
          if (!isEmployeeUnlocked) return;
          setIsEditingData((prev) => !prev);
        },
        openAddModal: () => {
          if (!isEmployeeUnlocked) return;
          setIsAddModalOpen(true);
        },
        openReorderModal: () => {
          if (!isEmployeeUnlocked) return;
          setIsReorderModalOpen(true);
        },
        resetDefaults: () => {
          if (!isEmployeeUnlocked) return;
          handleResetDefaults();
        },
        printCatalog: handlePrintSection,
        isDbSynced,
        servicesCount: calculateTotalCount(catalogData)
      });
    }
  }, [isEditingData, isEmployeeUnlocked, isDbSynced, catalogData, onRegisterControls]);

  // Tab definitions with icons and arabic labels
  const TAB_META: Record<ProtectionTab, { label: string; icon: React.ReactNode }> = {
    black_edition: { label: 'Black Edition', icon: <Flame className="w-3.5 h-3.5" /> },
    paint: { label: 'الصبغ', icon: <Palette className="w-3.5 h-3.5" /> },
    ppf: { label: 'حماية PPF', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    tint: { label: 'العازل الحراري', icon: <Sun className="w-3.5 h-3.5" /> },
    nano: { label: 'نانو سيراميك', icon: <Sparkles className="w-3.5 h-3.5" /> },
    polish: { label: 'بولش', icon: <Gem className="w-3.5 h-3.5" /> }
  };

  // Reorder tabs function
  const moveTab = (index: number, direction: 'up' | 'down') => {
    const order = [...catalogData.tabOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;

    const temp = order[index];
    order[index] = order[targetIdx];
    order[targetIdx] = temp;

    const updated = { ...catalogData, tabOrder: order };
    saveCatalogData(updated, `إعادة ترتيب تبويبات الكتالوج`);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Item to current tab
  const handleAddNewItem = () => {
    if (!newItemForm.name.trim()) return;

    const updated = JSON.parse(JSON.stringify(catalogData));
    const newId = `custom-${Date.now()}`;

    if (activeTab === 'black_edition') {
      updated.blackEdition.items.push({
        id: newId,
        name: newItemForm.name.trim(),
        price: Number(newItemForm.price) || 0,
        description: newItemForm.description.trim() || 'خدمة عازل مخصصة'
      });
    } else if (activeTab === 'paint') {
      updated.paint.items.push({
        id: newId,
        name: newItemForm.name.trim(),
        price: Number(newItemForm.price) || 0
      });
    } else if (activeTab === 'ppf') {
      if (newItemForm.isPackage) {
        updated.ppf.packages.push({
          id: newId,
          name: newItemForm.name.trim(),
          badge: newItemForm.badge.trim() || undefined,
          prices: {
            brand0: { sedan: Number(newItemForm.priceBrand0Sedan) || 0, suv: Number(newItemForm.priceBrand0Suv) || 0 },
            brand1: { sedan: Number(newItemForm.priceBrand1Sedan) || 0, suv: Number(newItemForm.priceBrand1Suv) || 0 },
            brand2: { sedan: Number(newItemForm.priceBrand2Sedan) || 0, suv: Number(newItemForm.priceBrand2Suv) || 0 }
          }
        });
      } else {
        updated.ppf.individualParts.push({
          id: newId,
          name: newItemForm.name.trim(),
          prices: {
            brand0: { sedan: Number(newItemForm.priceBrand0Sedan) || 0, suv: Number(newItemForm.priceBrand0Suv) || 0 },
            brand1: { sedan: Number(newItemForm.priceBrand1Sedan) || 0, suv: Number(newItemForm.priceBrand1Suv) || 0 },
            brand2: { sedan: Number(newItemForm.priceBrand2Sedan) || 0, suv: Number(newItemForm.priceBrand2Suv) || 0 }
          }
        });
      }
    } else if (activeTab === 'tint') {
      updated.tint.items.push({
        id: newId,
        name: newItemForm.name.trim(),
        prices: {
          brand0: { sedan: Number(newItemForm.priceBrand0Sedan) || 0, suv: Number(newItemForm.priceBrand0Suv) || 0 },
          brand1: { sedan: Number(newItemForm.priceBrand1Sedan) || 0, suv: Number(newItemForm.priceBrand1Suv) || 0 },
          brand2: { sedan: Number(newItemForm.priceBrand2Sedan) || 0, suv: Number(newItemForm.priceBrand2Suv) || 0 }
        }
      });
    } else if (activeTab === 'nano') {
      updated.nanoCeramic.items.push({
        id: newId,
        name: newItemForm.name.trim(),
        price: Number(newItemForm.price) || 0,
        note: newItemForm.description.trim() || 'خدمة نانو سيراميك مخصصة'
      });
    } else if (activeTab === 'polish') {
      updated.polish.items.push({
        id: newId,
        name: newItemForm.name.trim(),
        price: Number(newItemForm.price) || 0
      });
    }

    saveCatalogData(updated, `إضافة بند جديد (${newItemForm.name}) في كتالوج الحماية`);
    setIsAddModalOpen(false);
    setNewItemForm({
      name: '',
      description: '',
      price: 500,
      priceBrand0Sedan: 500,
      priceBrand0Suv: 600,
      priceBrand1Sedan: 800,
      priceBrand1Suv: 950,
      priceBrand2Sedan: 1100,
      priceBrand2Suv: 1300,
      isPackage: false,
      badge: ''
    });
  };

  // Delete item handler
  const handleDeleteItem = (section: string, itemId: string, itemName: string) => {
    if (!confirm(`هل أنت متأكد من حذف (${itemName})؟`)) return;

    const updated = JSON.parse(JSON.stringify(catalogData));

    if (section === 'black_edition') {
      updated.blackEdition.items = updated.blackEdition.items.filter((i: any) => i.id !== itemId);
    } else if (section === 'paint') {
      updated.paint.items = updated.paint.items.filter((i: any) => i.id !== itemId);
    } else if (section === 'ppf_part') {
      updated.ppf.individualParts = updated.ppf.individualParts.filter((i: any) => i.id !== itemId);
    } else if (section === 'ppf_package') {
      updated.ppf.packages = updated.ppf.packages.filter((i: any) => i.id !== itemId);
    } else if (section === 'tint') {
      updated.tint.items = updated.tint.items.filter((i: any) => i.id !== itemId);
    } else if (section === 'nano') {
      updated.nanoCeramic.items = updated.nanoCeramic.items.filter((i: any) => i.id !== itemId);
    } else if (section === 'polish') {
      updated.polish.items = updated.polish.items.filter((i: any) => i.id !== itemId);
    }

    saveCatalogData(updated, `حذف بند (${itemName}) من كتالوج الحماية`);
  };

  const showVehicleToggle = activeTab === 'ppf' || activeTab === 'tint';

  // Search filter helper
  const matchesSearch = (text: string) => {
    if (!searchFilter.trim()) return true;
    return text.toLowerCase().includes(searchFilter.toLowerCase().trim());
  };

  return (
    <div id="protection-tint-catalog-section" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans text-slate-900 dir-rtl my-4" dir="rtl">
      
      {/* 1. Main Navigation Tab Bar (Reorderable Tabs & Vehicle Switcher) */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Reordered Tabs according to catalogData.tabOrder */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          {catalogData.tabOrder.map((tabKey) => {
            const meta = TAB_META[tabKey];
            if (!meta) return null;
            const isSelected = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-2xs ${
                  isSelected
                    ? 'bg-orange-600 text-white font-bold border-orange-600 shadow-sm ring-2 ring-orange-500/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {meta.icon}
                <span>{meta.label}</span>
              </button>
            );
          })}

          {/* Quick Tab Reorder trigger button - ONLY for logged in staff */}
          {isEmployeeUnlocked && (
            <button
              onClick={() => setIsReorderModalOpen(true)}
              className="p-2 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold transition-all shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
              title="ترتيب شريط التبويبات وتحديد الأول والثاني"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline text-[11px]">ترتيب الأقسام</span>
            </button>
          )}
        </div>

        {/* Right Controls: Vehicle Selector & Search */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
          
          {/* Vehicle Type Switcher Toggle (Sedan vs SUV) - shown on PPF and Tinting */}
          {showVehicleToggle && (
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs w-full sm:w-auto justify-center">
              <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-orange-600" />
                <span>نوع السيارة:</span>
              </span>
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100">
                <button
                  onClick={() => setVehicleType('sedan')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    vehicleType === 'sedan'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Sedan (صالون)</span>
                </button>
                <button
                  onClick={() => setVehicleType('suv')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    vehicleType === 'suv'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>SUV (فورويل)</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-44">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="تصفية البنود..."
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold pl-7 pr-7 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
            />
            <Search className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400" />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute left-2 top-1.5 text-xs text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 2. Active Editing Mode Banner */}
      {isEditingData && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-xs font-bold text-orange-950 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>وضع التعديل الشامل مفعل: يمكنك تفعيل أو إغلاق الملاحظات بالأزرار المخصصة، وتغيير المسميات والأسعار فوراً.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة بند إلى ({TAB_META[activeTab]?.label})</span>
            </button>
            <button
              onClick={() => setIsReorderModalOpen(true)}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors shadow-2xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-400" />
              <span>ترتيب الأقسام</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Feedback Toast */}
      {saveFeedback && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 flex items-center justify-center gap-1.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* 4. Tab Contents */}
      <div className="p-4 sm:p-6 space-y-6">

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: BLACK EDITION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'black_edition' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Header Description Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 w-full md:w-auto flex-1">
                <span className="text-orange-400 font-mono text-xs font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                  <span>PREMIUM BLACK EDITION</span>
                </span>
                
                {isEditingData ? (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">عنوان القسم:</label>
                      <input
                        type="text"
                        value={catalogData.blackEdition.title}
                        onChange={(e) => {
                          const updated = { ...catalogData };
                          updated.blackEdition.title = e.target.value;
                          saveCatalogData(updated);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">وصف القسم:</label>
                      <input
                        type="text"
                        value={catalogData.blackEdition.description}
                        onChange={(e) => {
                          const updated = { ...catalogData };
                          updated.blackEdition.description = e.target.value;
                          saveCatalogData(updated);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-black text-white">{catalogData.blackEdition.title}</h3>
                    <p className="text-xs text-slate-300">{catalogData.blackEdition.description}</p>
                  </>
                )}
              </div>

              {/* Badge & Toggle */}
              {(catalogData.blackEdition.isBadgeEnabled !== false || isEditingData) && (
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 ${
                  catalogData.blackEdition.isBadgeEnabled === false
                    ? 'bg-slate-800/40 border-slate-700 text-slate-500 opacity-60'
                    : 'bg-slate-800/90 border-slate-700/80 text-orange-400'
                }`}>
                  <Sparkles className="w-4 h-4 fill-orange-400" />
                  {isEditingData ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={catalogData.blackEdition.badge || 'عازل حراري بنسبة تصل إلى 99%'}
                        onChange={(e) => {
                          const updated = { ...catalogData };
                          updated.blackEdition.badge = e.target.value;
                          saveCatalogData(updated);
                        }}
                        className="bg-slate-700 text-orange-300 px-2 py-0.5 rounded text-xs font-bold border border-slate-600 focus:outline-none"
                      />
                      <NoteToggleSwitch
                        enabled={catalogData.blackEdition.isBadgeEnabled !== false}
                        onToggle={toggleBlackEditionBadge}
                        label="الشارة"
                      />
                    </div>
                  ) : (
                    <span>{catalogData.blackEdition.badge || 'عازل حراري بنسبة تصل إلى 99%'}</span>
                  )}
                </div>
              )}
            </div>

            {/* Product Cards Grid with editable car / tier name, description, and price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {catalogData.blackEdition.items
                .filter((item) => matchesSearch(item.name) || matchesSearch(item.description))
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-orange-400 transition-all flex flex-col justify-between space-y-4 group relative"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {isEditingData ? (
                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 block font-bold">اسم الفئة / السيارة:</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updated = { ...catalogData };
                                updated.blackEdition.items[idx].name = e.target.value;
                                saveCatalogData(updated);
                              }}
                              className="w-full bg-slate-900 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        ) : (
                          <span className="bg-slate-900 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg">
                            {item.name}
                          </span>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyText(`${item.name} — ${item.price} QAR (الريال القطري)\n${item.description}`, item.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="نسخ تفاصيل الخدمة"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {isEditingData && (
                            <button
                              onClick={() => handleDeleteItem('black_edition', item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف هذا البند"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditingData ? (
                        <div>
                          <label className="text-[10px] text-slate-400 block font-bold mt-1">الوصف والمميزات:</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              const updated = { ...catalogData };
                              updated.blackEdition.items[idx].description = e.target.value;
                              saveCatalogData(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-700 focus:outline-none focus:border-orange-500"
                            rows={3}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-400">السعر المعتمد:</span>
                      {isEditingData ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = { ...catalogData };
                              updated.blackEdition.items[idx].price = val;
                              saveCatalogData(updated);
                            }}
                            className="w-24 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-sm font-black text-orange-600 text-left focus:outline-none"
                          />
                          <span className="text-xs font-bold text-slate-700">ر.ق</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 text-orange-600 font-black text-2xl tracking-tight">
                          <span>{item.price.toLocaleString()}</span>
                          <span className="text-xs text-slate-700 font-bold">ر.ق</span>
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
            
            {/* Note & Badge Editable Banner with On/Off Toggle Buttons */}
            {(catalogData.paint.isNoteEnabled !== false || catalogData.paint.isBadgeEnabled !== false || isEditingData) && (
              <div className={`p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-bold transition-all border ${
                (catalogData.paint.isNoteEnabled === false && catalogData.paint.isBadgeEnabled === false)
                  ? 'bg-slate-100 border-dashed border-slate-300 opacity-60 text-slate-500'
                  : 'bg-orange-50 border-orange-200/90 text-orange-950'
              }`}>
                {/* Note section */}
                {(catalogData.paint.isNoteEnabled !== false || isEditingData) && (
                  <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                    <Info className={`w-4 h-4 shrink-0 ${catalogData.paint.isNoteEnabled === false ? 'text-slate-400' : 'text-orange-600'}`} />
                    {isEditingData ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={catalogData.paint.note}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.paint.note = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="flex-1 bg-white border border-orange-300 rounded px-2 py-1 text-xs font-bold text-orange-950 focus:outline-none focus:border-orange-500"
                        />
                        <NoteToggleSwitch
                          enabled={catalogData.paint.isNoteEnabled !== false}
                          onToggle={togglePaintNote}
                          label="الملاحظة"
                        />
                      </div>
                    ) : (
                      <span>{catalogData.paint.note}</span>
                    )}
                  </div>
                )}

                {/* Badge section */}
                {(catalogData.paint.isBadgeEnabled !== false || isEditingData) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isEditingData ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={catalogData.paint.badge}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.paint.badge = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-black border border-orange-700 focus:outline-none"
                        />
                        <NoteToggleSwitch
                          enabled={catalogData.paint.isBadgeEnabled !== false}
                          onToggle={togglePaintBadge}
                          label="الشارة"
                        />
                      </div>
                    ) : (
                      <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        {catalogData.paint.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white text-xs font-black uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">
                      {isEditingData ? (
                        <input
                          type="text"
                          value={catalogData.paint.headerServiceName || 'الخدمة والتفاصيل'}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.paint.headerServiceName = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="bg-slate-800 text-white px-2 py-0.5 rounded text-xs font-bold border border-slate-700"
                        />
                      ) : (
                        <span>{catalogData.paint.headerServiceName || 'الخدمة والتفاصيل'}</span>
                      )}
                    </th>
                    <th className="p-3.5 text-left">
                      {isEditingData ? (
                        <input
                          type="text"
                          value={catalogData.paint.headerPriceName || 'السعر بالريال القطري (QAR)'}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.paint.headerPriceName = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="bg-slate-800 text-white px-2 py-0.5 rounded text-xs font-bold border border-slate-700 text-left"
                        />
                      ) : (
                        <span>{catalogData.paint.headerPriceName || 'السعر بالريال القطري (QAR)'}</span>
                      )}
                    </th>
                    {isEditingData && <th className="p-3.5 text-center w-16">إجراء</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {catalogData.paint.items
                    .filter((item) => matchesSearch(item.name))
                    .map((item, index) => (
                      <tr key={item.id} className="hover:bg-orange-50/40 transition-colors group">
                        <td className="p-3.5 font-bold text-slate-400 text-center">{index + 1}</td>
                        <td className="p-3.5 font-bold text-slate-800 text-sm">
                          {isEditingData ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updated = { ...catalogData };
                                updated.paint.items[index].name = e.target.value;
                                saveCatalogData(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:border-orange-500"
                            />
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.name}</span>
                              <button
                                onClick={() => handleCopyText(`${item.name} — ${item.price} QAR`, item.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-800 rounded transition-opacity"
                                title="نسخ السعر"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-left">
                          {isEditingData ? (
                            <div className="inline-flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.paint.items[index].price = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-24 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-xs font-black text-orange-600 text-left focus:outline-none"
                              />
                              <span className="text-xs font-bold text-slate-700">ر.ق</span>
                            </div>
                          ) : (
                            <span className="text-orange-600 font-black text-base">
                              {item.price.toLocaleString()} <span className="text-xs text-slate-700 font-bold">ر.ق</span>
                            </span>
                          )}
                        </td>
                        {isEditingData && (
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteItem('paint', item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="حذف الخدمة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
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
            
            {/* Header info with editable brand names (UltraGuard, Onyx, Xpel) */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
              <div className="flex-1">
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  <span>
                    {catalogData.ppf.title || 'مقارنة ماركات حماية PPF لـ'} ({vehicleType === 'sedan' ? 'صالون Sedan' : 'فورويل SUV'})
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {catalogData.ppf.description || 'ضمان حقيقي ضد الخدوش والعوامل الجوية مع تشطيب شفاف ذاتي المعالجة'}
                </p>
              </div>

              {/* Brands Pill Bar (Editable in edit mode) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">الماركات:</span>
                {catalogData.ppf.brands.map((brandName, bIdx) => (
                  <div key={bIdx}>
                    {isEditingData ? (
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => {
                          const updated = { ...catalogData };
                          updated.ppf.brands[bIdx] = e.target.value;
                          saveCatalogData(updated);
                        }}
                        className="bg-slate-800 text-orange-300 font-bold px-2 py-0.5 rounded text-xs border border-slate-700 focus:outline-none focus:border-orange-500 w-24 text-center"
                        title={`تعديل اسم الماركة رقم ${bIdx + 1}`}
                      />
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                        bIdx === 2 
                          ? 'bg-orange-600 text-white border-orange-500 shadow-2xs' 
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                        {brandName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Part 1: Individual Parts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-orange-600" />
                  {isEditingData ? (
                    <input
                      type="text"
                      value={catalogData.ppf.partsTitle || '[قطع فردية]'}
                      onChange={(e) => {
                        const updated = { ...catalogData };
                        updated.ppf.partsTitle = e.target.value;
                        saveCatalogData(updated);
                      }}
                      className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
                    />
                  ) : (
                    <span>{catalogData.ppf.partsTitle || '[قطع فردية]'}</span>
                  )}
                </h5>
                <span className="text-[11px] text-slate-500 font-bold">
                  {catalogData.ppf.partsSubTitle || 'الأسعار بالريال القطري (QAR)'} لسيارات {vehicleType === 'sedan' ? 'الصالون Sedan' : 'الفورويل SUV'}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <tr>
                      <th className="p-3">القطعة</th>
                      <th className="p-3 text-center bg-orange-500/5 text-slate-900">
                        {catalogData.ppf.brands[0] || 'UltraGuard'}
                      </th>
                      <th className="p-3 text-center bg-slate-200/50 text-slate-900">
                        {catalogData.ppf.brands[1] || 'Onyx'}
                      </th>
                      <th className="p-3 text-center bg-orange-600/10 text-orange-950 font-black">
                        {catalogData.ppf.brands[2] || 'Xpel'}
                      </th>
                      {isEditingData && <th className="p-3 text-center w-16">إجراء</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {catalogData.ppf.individualParts
                      .filter((item) => matchesSearch(item.name))
                      .map((item, idx) => (
                        <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-3 font-bold text-slate-800 text-xs sm:text-sm">
                            {isEditingData ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = { ...catalogData };
                                  updated.ppf.individualParts[idx].name = e.target.value;
                                  saveCatalogData(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{item.name}</span>
                            )}
                          </td>
                          
                          {/* Brand 0 */}
                          <td className="p-3 text-center font-black text-slate-800 bg-orange-500/5">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={item.prices.brand0[vehicleType]}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.ppf.individualParts[idx].prices.brand0[vehicleType] = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-20 bg-white border border-slate-300 rounded text-center py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{item.prices.brand0[vehicleType].toLocaleString()} ر.ق</span>
                            )}
                          </td>

                          {/* Brand 1 */}
                          <td className="p-3 text-center font-black text-slate-800 bg-slate-200/40">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={item.prices.brand1[vehicleType]}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.ppf.individualParts[idx].prices.brand1[vehicleType] = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-20 bg-white border border-slate-300 rounded text-center py-0.5 text-xs font-bold"
                              />
                            ) : (
                              <span>{item.prices.brand1[vehicleType].toLocaleString()} ر.ق</span>
                            )}
                          </td>

                          {/* Brand 2 */}
                          <td className="p-3 text-center font-black text-orange-600 bg-orange-600/10">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={item.prices.brand2[vehicleType]}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.ppf.individualParts[idx].prices.brand2[vehicleType] = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-20 bg-white border border-orange-300 rounded text-center py-0.5 text-xs font-black text-orange-600"
                              />
                            ) : (
                              <span>{item.prices.brand2[vehicleType].toLocaleString()} ر.ق</span>
                            )}
                          </td>

                          {isEditingData && (
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteItem('ppf_part', item.id, item.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="حذف القطعة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part 2: Packages */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>{catalogData.ppf.packagesTitle || '[باقات الحماية المتكاملة]'}</span>
                </h5>
                <span className="text-[11px] text-slate-500 font-bold">باقات شاملة التركيب والضمان</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white font-black border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">
                        {isEditingData ? (
                          <input
                            type="text"
                            value={catalogData.ppf.packageTableHeader || 'اسم الباقة والتغطية'}
                            onChange={(e) => {
                              const updated = { ...catalogData };
                              updated.ppf.packageTableHeader = e.target.value;
                              saveCatalogData(updated);
                            }}
                            className="bg-slate-800 text-white px-2 py-0.5 rounded text-xs font-bold border border-slate-700"
                          />
                        ) : (
                          <span>{catalogData.ppf.packageTableHeader || 'اسم الباقة والتغطية'}</span>
                        )}
                      </th>
                      <th className="p-3.5 text-center text-slate-200">
                        {catalogData.ppf.brands[0] || 'UltraGuard'}
                      </th>
                      <th className="p-3.5 text-center text-slate-200">
                        {catalogData.ppf.brands[1] || 'Onyx'}
                      </th>
                      <th className="p-3.5 text-center text-orange-400 font-black">
                        {catalogData.ppf.brands[2] || 'Xpel'}
                      </th>
                      {isEditingData && <th className="p-3.5 text-center w-16">إجراء</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {catalogData.ppf.packages
                      .filter((pkg) => matchesSearch(pkg.name))
                      .map((pkg, idx) => (
                        <tr key={pkg.id} className="hover:bg-orange-50/40 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 text-sm">
                            <div className="space-y-1">
                              {isEditingData ? (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={pkg.name}
                                    onChange={(e) => {
                                      const updated = { ...catalogData };
                                      updated.ppf.packages[idx].name = e.target.value;
                                      saveCatalogData(updated);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                  />
                                  <input
                                    type="text"
                                    value={pkg.badge || ''}
                                    placeholder="شارة الباقة (مثلاً: عازل مجاني)"
                                    onChange={(e) => {
                                      const updated = { ...catalogData };
                                      updated.ppf.packages[idx].badge = e.target.value;
                                      saveCatalogData(updated);
                                    }}
                                    className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-[10px] text-emerald-700"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{pkg.name}</span>
                                  {pkg.badge && (
                                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                                      {pkg.badge}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Brand 0 */}
                          <td className="p-3.5 text-center font-black text-slate-800 bg-orange-500/5">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={pkg.prices.brand0[vehicleType]}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.ppf.packages[idx].prices.brand0[vehicleType] = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-20 bg-white border border-slate-300 rounded text-center py-1 text-xs font-bold"
                              />
                            ) : (
                              <span>{pkg.prices.brand0[vehicleType].toLocaleString()} ر.ق</span>
                            )}
                          </td>

                          {/* Brand 1 */}
                          <td className="p-3.5 text-center font-black text-slate-800 bg-slate-200/40">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={pkg.prices.brand1[vehicleType]}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.ppf.packages[idx].prices.brand1[vehicleType] = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-20 bg-white border border-slate-300 rounded text-center py-1 text-xs font-bold"
                              />
                            ) : (
                              <span>{pkg.prices.brand1[vehicleType].toLocaleString()} ر.ق</span>
                            )}
                          </td>

                          {/* Brand 2 */}
                          <td className="p-3.5 text-center font-black text-orange-600 bg-orange-600/10 text-sm">
                            {isEditingData ? (
                              <input
                                type="number"
                                value={pkg.prices.brand2[vehicleType]}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.ppf.packages[idx].prices.brand2[vehicleType] = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-20 bg-white border border-orange-300 rounded text-center py-1 text-xs font-black text-orange-600"
                              />
                            ) : (
                              <span>{pkg.prices.brand2[vehicleType].toLocaleString()} ر.ق</span>
                            )}
                          </td>

                          {isEditingData && (
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleDeleteItem('ppf_package', pkg.id, pkg.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="حذف الباقة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom PPF Note with Toggle Button */}
            {(catalogData.ppf.isNoteEnabled !== false || isEditingData) && (
              <div className={`p-3.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border transition-all ${
                catalogData.ppf.isNoteEnabled === false
                  ? 'bg-slate-100 border-dashed border-slate-300 opacity-60 text-slate-500'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                  <Sparkles className={`w-4 h-4 shrink-0 ${catalogData.ppf.isNoteEnabled === false ? 'text-slate-400' : 'text-emerald-600'}`} />
                  {isEditingData ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={catalogData.ppf.note}
                        onChange={(e) => {
                          const updated = { ...catalogData };
                          updated.ppf.note = e.target.value;
                          saveCatalogData(updated);
                        }}
                        className="flex-1 bg-white border border-emerald-300 rounded px-2 py-1 text-xs font-bold text-emerald-950 focus:outline-none"
                      />
                      <NoteToggleSwitch
                        enabled={catalogData.ppf.isNoteEnabled !== false}
                        onToggle={togglePpfNote}
                        label="ملاحظة العازل المجاني"
                      />
                    </div>
                  ) : (
                    <span>{catalogData.ppf.note}</span>
                  )}
                </div>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black shrink-0">
                  عرض خاص معتمد
                </span>
              </div>
            )}

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: THERMAL TINT (العازل الحراري) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'tint' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Header info with editable brands (CARONIC, SANTEK, Xpel) */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl">
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <Sun className="w-4 h-4 text-orange-400" />
                  <span>عروض العازل الحراري للسيارات ({vehicleType === 'sedan' ? 'صالون Sedan' : 'فورويل SUV'})</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">عزل حراري نانو سيراميك متطور مع ضمان حقيقي معتمد</p>
              </div>

              {/* Tint Brands (Editable in edit mode) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">الماركات:</span>
                {catalogData.tint.brands.map((brandName, bIdx) => (
                  <div key={bIdx}>
                    {isEditingData ? (
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => {
                          const updated = { ...catalogData };
                          updated.tint.brands[bIdx] = e.target.value;
                          saveCatalogData(updated);
                        }}
                        className="bg-slate-800 text-orange-300 font-bold px-2 py-0.5 rounded text-xs border border-slate-700 focus:outline-none focus:border-orange-500 w-24 text-center"
                        title={`تعديل ماركة العازل رقم ${bIdx + 1}`}
                      />
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                        bIdx === 0
                          ? 'bg-orange-600 text-white border-orange-500 shadow-2xs'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                        {brandName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tint Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">
                      {isEditingData ? (
                        <input
                          type="text"
                          value={catalogData.tint.headerItemName || 'نوع التظليل / النافذة'}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.tint.headerItemName = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
                        />
                      ) : (
                        <span>{catalogData.tint.headerItemName || 'نوع التظليل / النافذة'}</span>
                      )}
                    </th>
                    <th className="p-3.5 text-center bg-orange-500/5 text-slate-900">
                      {catalogData.tint.brands[0] || 'CARONIC'}
                    </th>
                    <th className="p-3.5 text-center bg-slate-200/50 text-slate-900">
                      {catalogData.tint.brands[1] || 'SANTEK'}
                    </th>
                    <th className="p-3.5 text-center bg-orange-600/10 text-orange-950 font-black">
                      {catalogData.tint.brands[2] || 'Xpel'}
                    </th>
                    {isEditingData && <th className="p-3.5 text-center w-16">إجراء</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {catalogData.tint.items
                    .filter((item) => matchesSearch(item.name))
                    .map((item, idx) => (
                      <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 text-sm">
                          {isEditingData ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updated = { ...catalogData };
                                updated.tint.items[idx].name = e.target.value;
                                saveCatalogData(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                            />
                          ) : (
                            <span>{item.name}</span>
                          )}
                        </td>

                        {/* Brand 0 */}
                        <td className="p-3.5 text-center font-black text-slate-800 bg-orange-500/5">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.brand0[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.tint.items[idx].prices.brand0[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-20 bg-white border border-slate-300 rounded text-center py-1 text-xs font-bold"
                            />
                          ) : (
                            <span>{item.prices.brand0[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>

                        {/* Brand 1 */}
                        <td className="p-3.5 text-center font-black text-slate-800 bg-slate-200/40">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.brand1[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.tint.items[idx].prices.brand1[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-20 bg-white border border-slate-300 rounded text-center py-1 text-xs font-bold"
                            />
                          ) : (
                            <span>{item.prices.brand1[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>

                        {/* Brand 2 */}
                        <td className="p-3.5 text-center font-black text-orange-600 bg-orange-600/10 text-sm">
                          {isEditingData ? (
                            <input
                              type="number"
                              value={item.prices.brand2[vehicleType]}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = { ...catalogData };
                                updated.tint.items[idx].prices.brand2[vehicleType] = val;
                                saveCatalogData(updated);
                              }}
                              className="w-20 bg-white border border-orange-300 rounded text-center py-1 text-xs font-black text-orange-600"
                            />
                          ) : (
                            <span>{item.prices.brand2[vehicleType].toLocaleString()} ر.ق</span>
                          )}
                        </td>

                        {isEditingData && (
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteItem('tint', item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="حذف الخدمة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
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
            
            {/* Note Editable Banner with Toggle Buttons */}
            {(catalogData.nanoCeramic.isNoteEnabled !== false || catalogData.nanoCeramic.isBadgeEnabled !== false || isEditingData) && (
              <div className={`p-3.5 rounded-xl text-xs font-bold flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border transition-all ${
                (catalogData.nanoCeramic.isNoteEnabled === false && catalogData.nanoCeramic.isBadgeEnabled === false)
                  ? 'bg-slate-100 border-dashed border-slate-300 opacity-60 text-slate-500'
                  : 'bg-orange-50 border-orange-200 text-orange-950'
              }`}>
                {/* Note */}
                {(catalogData.nanoCeramic.isNoteEnabled !== false || isEditingData) && (
                  <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                    <Sparkles className={`w-4 h-4 shrink-0 ${catalogData.nanoCeramic.isNoteEnabled === false ? 'text-slate-400' : 'text-orange-600'}`} />
                    {isEditingData ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={catalogData.nanoCeramic.note}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.nanoCeramic.note = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="flex-1 bg-white border border-orange-300 rounded px-2 py-1 text-xs font-bold text-orange-950 focus:outline-none"
                        />
                        <NoteToggleSwitch
                          enabled={catalogData.nanoCeramic.isNoteEnabled !== false}
                          onToggle={toggleNanoNote}
                          label="الملاحظة"
                        />
                      </div>
                    ) : (
                      <span>{catalogData.nanoCeramic.note}</span>
                    )}
                  </div>
                )}

                {/* Badge */}
                {(catalogData.nanoCeramic.isBadgeEnabled !== false || isEditingData) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isEditingData ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={catalogData.nanoCeramic.badge}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.nanoCeramic.badge = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-black border border-orange-700 focus:outline-none"
                        />
                        <NoteToggleSwitch
                          enabled={catalogData.nanoCeramic.isBadgeEnabled !== false}
                          onToggle={toggleNanoBadge}
                          label="الشارة"
                        />
                      </div>
                    ) : (
                      <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        {catalogData.nanoCeramic.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nano Ceramic Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalogData.nanoCeramic.items
                .filter((item) => matchesSearch(item.name))
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-orange-400 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        {isEditingData ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = { ...catalogData };
                              updated.nanoCeramic.items[idx].name = e.target.value;
                              saveCatalogData(updated);
                            }}
                            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm font-black text-slate-800 w-full"
                          />
                        ) : (
                          <h4 className="text-base font-black text-slate-900">{item.name}</h4>
                        )}

                        {isEditingData && (
                          <button
                            onClick={() => handleDeleteItem('nano', item.id, item.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isEditingData ? (
                        <textarea
                          value={item.note || ''}
                          onChange={(e) => {
                            const updated = { ...catalogData };
                            updated.nanoCeramic.items[idx].note = e.target.value;
                            saveCatalogData(updated);
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-700"
                          rows={2}
                        />
                      ) : (
                        <p className="text-xs text-slate-600 font-medium">{item.note}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-400">السعر:</span>
                      {isEditingData ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = { ...catalogData };
                              updated.nanoCeramic.items[idx].price = val;
                              saveCatalogData(updated);
                            }}
                            className="w-24 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-sm font-black text-orange-600 text-left"
                          />
                          <span className="text-xs font-bold text-slate-700">ر.ق</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 text-orange-600 font-black text-2xl tracking-tight">
                          <span>{item.price.toLocaleString()}</span>
                          <span className="text-xs text-slate-700 font-bold">ر.ق</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: POLISH (بولش) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'polish' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Note Banner with toggle */}
            {(catalogData.polish.isNoteEnabled !== false || isEditingData) && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border gap-2 transition-all ${
                catalogData.polish.isNoteEnabled === false
                  ? 'bg-slate-100 border-dashed border-slate-300 opacity-60 text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2 flex-1">
                  <Gem className="w-4 h-4 text-orange-600 shrink-0" />
                  {isEditingData ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={catalogData.polish.note}
                        onChange={(e) => {
                          const updated = { ...catalogData };
                          updated.polish.note = e.target.value;
                          saveCatalogData(updated);
                        }}
                        className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                      />
                      <NoteToggleSwitch
                        enabled={catalogData.polish.isNoteEnabled !== false}
                        onToggle={() => {
                          const current = catalogData.polish.isNoteEnabled !== false;
                          const updated = { ...catalogData };
                          updated.polish.isNoteEnabled = !current;
                          saveCatalogData(updated, `${!current ? 'تفعيل' : 'إغلاق'} ملاحظة البولش`);
                        }}
                        label="الملاحظة"
                      />
                    </div>
                  ) : (
                    <span>{catalogData.polish.note}</span>
                  )}
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white text-xs font-black uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">خدمة البولش والتلميع</th>
                    <th className="p-3.5 text-left">السعر بالريال القطري (QAR)</th>
                    {isEditingData && <th className="p-3.5 text-center w-16">إجراء</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {catalogData.polish.items
                    .filter((item) => matchesSearch(item.name))
                    .map((item, index) => (
                      <tr key={item.id} className="hover:bg-orange-50/40 transition-colors group">
                        <td className="p-3.5 font-bold text-slate-400 text-center">{index + 1}</td>
                        <td className="p-3.5 font-bold text-slate-800 text-sm">
                          {isEditingData ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updated = { ...catalogData };
                                updated.polish.items[index].name = e.target.value;
                                saveCatalogData(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                            />
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.name}</span>
                              <button
                                onClick={() => handleCopyText(`${item.name} — ${item.price} QAR`, item.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-800 rounded transition-opacity"
                                title="نسخ السعر"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-left">
                          {isEditingData ? (
                            <div className="inline-flex items-center gap-1 justify-end">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = { ...catalogData };
                                  updated.polish.items[index].price = val;
                                  saveCatalogData(updated);
                                }}
                                className="w-24 bg-orange-50 border border-orange-300 rounded px-2 py-1 text-xs font-black text-orange-600 text-left"
                              />
                              <span className="text-xs font-bold text-slate-700">ر.ق</span>
                            </div>
                          ) : (
                            <span className="text-orange-600 font-black text-base">
                              {item.price.toLocaleString()} <span className="text-xs text-slate-700 font-bold">ر.ق</span>
                            </span>
                          )}
                        </td>
                        {isEditingData && (
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteItem('polish', item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="حذف الخدمة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* 5. Reorder Tabs Modal */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">ترتيب تبويبات وأقسام الكتالوج</h3>
              </div>
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              اضغط على الأسهم لتحديد أي قسم يظهر أولاً وثانياً في شريط التبويبات. الترتيب يحفظ سحابياً فوراً.
            </p>

            <div className="space-y-2">
              {catalogData.tabOrder.map((tabKey, idx) => {
                const meta = TAB_META[tabKey];
                return (
                  <div
                    key={tabKey}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-2 font-black text-sm text-slate-800">
                        {meta?.icon}
                        <span>{meta?.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveTab(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-orange-600 disabled:opacity-30 disabled:pointer-events-none"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveTab(idx, 'down')}
                        disabled={idx === catalogData.tabOrder.length - 1}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-orange-600 disabled:opacity-30 disabled:pointer-events-none"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const defaultOrder: ProtectionTab[] = ['black_edition', 'paint', 'ppf', 'tint', 'nano', 'polish'];
                  saveCatalogData({ ...catalogData, tabOrder: defaultOrder }, 'إعادة الترتيب الافتراضي للأقسام');
                }}
                className="text-xs text-slate-500 hover:text-orange-600 font-bold"
              >
                استعادة الترتيب الافتراضي
              </button>
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-colors"
              >
                تم، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">
                  إضافة بند جديد إلى ({TAB_META[activeTab]?.label})
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الخدمة / القطعة / السيارة:</label>
                <input
                  type="text"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="مثال: LEOPARD 10 أو حماية مقود أو بولش مائي..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {activeTab === 'ppf' && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="isPkg"
                    checked={newItemForm.isPackage}
                    onChange={(e) => setNewItemForm({ ...newItemForm, isPackage: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <label htmlFor="isPkg" className="font-bold text-slate-800 cursor-pointer">
                    إضافة كـ "باقة حماية متكاملة" بدلاً من قطعة فردية
                  </label>
                </div>
              )}

              {/* PPF & Tint Multi-Brand Prices */}
              {(activeTab === 'ppf' || activeTab === 'tint') ? (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-black text-slate-800 block text-xs">
                    تحديد الأسعار حسب الماركات ونوع السيارة (بالريال القطري):
                  </span>

                  {/* Brand 0 */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="font-bold text-slate-700 text-xs">
                      {activeTab === 'ppf' ? catalogData.ppf.brands[0] : catalogData.tint.brands[0]}:
                    </span>
                    <input
                      type="number"
                      placeholder="صالون"
                      value={newItemForm.priceBrand0Sedan}
                      onChange={(e) => setNewItemForm({ ...newItemForm, priceBrand0Sedan: Number(e.target.value) })}
                      className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold"
                    />
                    <input
                      type="number"
                      placeholder="فورويل"
                      value={newItemForm.priceBrand0Suv}
                      onChange={(e) => setNewItemForm({ ...newItemForm, priceBrand0Suv: Number(e.target.value) })}
                      className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold"
                    />
                  </div>

                  {/* Brand 1 */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="font-bold text-slate-700 text-xs">
                      {activeTab === 'ppf' ? catalogData.ppf.brands[1] : catalogData.tint.brands[1]}:
                    </span>
                    <input
                      type="number"
                      placeholder="صالون"
                      value={newItemForm.priceBrand1Sedan}
                      onChange={(e) => setNewItemForm({ ...newItemForm, priceBrand1Sedan: Number(e.target.value) })}
                      className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold"
                    />
                    <input
                      type="number"
                      placeholder="فورويل"
                      value={newItemForm.priceBrand1Suv}
                      onChange={(e) => setNewItemForm({ ...newItemForm, priceBrand1Suv: Number(e.target.value) })}
                      className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold"
                    />
                  </div>

                  {/* Brand 2 */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="font-bold text-orange-600 text-xs font-black">
                      {activeTab === 'ppf' ? catalogData.ppf.brands[2] : catalogData.tint.brands[2]}:
                    </span>
                    <input
                      type="number"
                      placeholder="صالون"
                      value={newItemForm.priceBrand2Sedan}
                      onChange={(e) => setNewItemForm({ ...newItemForm, priceBrand2Sedan: Number(e.target.value) })}
                      className="bg-white border border-orange-300 rounded-lg p-1.5 text-xs text-center font-bold text-orange-600"
                    />
                    <input
                      type="number"
                      placeholder="فورويل"
                      value={newItemForm.priceBrand2Suv}
                      onChange={(e) => setNewItemForm({ ...newItemForm, priceBrand2Suv: Number(e.target.value) })}
                      className="bg-white border border-orange-300 rounded-lg p-1.5 text-xs text-center font-bold text-orange-600"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">السعر المعتمد (بالريال القطري QAR):</label>
                  <input
                    type="number"
                    value={newItemForm.price}
                    onChange={(e) => setNewItemForm({ ...newItemForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-orange-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">الوصف والملاحظات:</label>
                <textarea
                  value={newItemForm.description}
                  onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="وصف تفصيلي للخدمة أو الضمان..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddNewItem}
                disabled={!newItemForm.name.trim()}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-colors disabled:opacity-40"
              >
                إضافة وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
