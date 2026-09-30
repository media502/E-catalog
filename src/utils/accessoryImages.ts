export interface AccessoryImagePreset {
  keywords: string[];
  title: string;
  url: string;
}

export const ACCESSORY_IMAGE_PRESETS: AccessoryImagePreset[] = [
  {
    keywords: ['شاشة', 'حماية شاشة', 'نانو', 'screen', 'protector', 'navigation'],
    title: 'حماية شاشة الملاحة نانو',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['دواسات', 'فرشات', '5d', '7d', 'مات', 'floor mat', 'mats', 'ارضية'],
    title: 'طقم دواسات أرضية 5D فاخرة',
    url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['مظلة', 'سقف', 'بانوراما', 'عازل', 'sunshade', 'roof', 'حرارة'],
    title: 'مظلة سقف بانوراما عازلة للحرارة',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['كونسول', 'منظم', 'شاحن لاسلكي', 'console', 'organizer', 'wireless', 'charger'],
    title: 'منظم كونسول وسطي مع شاحن لاسلكي',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['عتب', 'مضيء', 'ستانلس', 'scuff', 'door sill', 'ابواب', 'step'],
    title: 'حماية عتب الأبواب ستانلس ستيل مضيء',
    url: 'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['مفتاح', 'كفر مفتاح', 'ريموت', 'كربون', 'key', 'fob', 'cover'],
    title: 'غطاء حماية مفتاح كربون فايبر',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['ستائر', 'مغناطيس', 'خصوصية', 'curtain', 'window', 'shade', 'نافذة'],
    title: 'ستائر جانبية مغناطيسية خصوصية',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['جناح', 'سبويلر', 'spoiler', 'rear wing', 'خلفي'],
    title: 'جناح خلفي رياضي كربون',
    url: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['سيليكون', 'تخزين', 'حامل اكواب', 'صندوق', 'tray', 'storage', 'silicone'],
    title: 'صندوق تخزين سيليكون مخصص',
    url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['دواسة عتب', 'عتب جانبي', 'running board', 'side step'],
    title: 'دواسات عتب جانبي ألمنيوم',
    url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['مسند', 'تكاية', 'مناديل', 'armrest', 'tissue', 'جلد'],
    title: 'غطاء مسند الذراع مع حافظة مناديل',
    url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['شنطة', 'حقيبة', 'صندوق خلفي', 'trunk', 'boot', 'منظم شنطة'],
    title: 'منظم شنطة خلفية متعدد الاستخدامات',
    url: 'https://images.unsplash.com/photo-1563720223523-491ff04651de?w=600&auto=format&fit=crop&q=80',
  },
];

export function findMatchingImageForTitle(title: string): string {
  const lower = title.toLowerCase();
  for (const preset of ACCESSORY_IMAGE_PRESETS) {
    for (const kw of preset.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return preset.url;
      }
    }
  }
  // Default high-quality automotive accessory photo
  return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';
}
