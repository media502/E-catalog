export interface ProductImageTransform {
  xOffset?: number; // in %
  yOffset?: number; // in %
  zoom?: number; // scale multiplier e.g. 1.0
  fit?: 'contain' | 'cover';
  frameHeight?: number; // custom frame height in px
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  barcode: string;
  price: number;
  oldPrice?: number;
  currency: string;
  imageUrl: string;
  description?: string;
  imageTransform?: ProductImageTransform;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarCategory {
  id: string;
  name: string;
  carModel: string;
  headerTitle: string;
  mainCarImageUrl: string;
  description?: string;
  order: number;
}

export type ViewMode = 'catalog' | 'employee_entry' | 'print_view' | 'barcode_scanner';

export type SortOption = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'custom';


export interface CatalogSettings {
  storeName: string;
  storeLogoUrl: string;
  contactNumber: string;
  currency: string;
  cardStyle: 'pdf_exact' | 'compact' | 'grid_large';
  frameHeight?: number; // 80 to 140px (default 105)
  frameRatio?: '50-50' | '60-40' | '40-60'; // Image vs Barcode width split
  imageFit?: 'contain' | 'cover';
}

export type UserRole = 'it' | 'accounting' | 'showroom' | 'admin';

export interface UserSession {
  role: UserRole;
  displayName: string;
  username: string;
  loginTime: string;
}

export interface DeletedProduct {
  id: string;
  originalProduct: Product;
  deletedAt: string; // ISO string
  deletedBy: string;
  deletedRole: UserRole;
  expiresAt: string; // ISO string 30 days after deletedAt
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  actionType: 'price_change' | 'product_edit' | 'product_add' | 'product_delete' | 'category_edit' | 'category_add' | 'category_delete' | 'bulk_import' | 'pdf_extract' | 'image_transform' | 'product_restore' | 'hard_delete' | 'trash_empty';
  productId?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  details: string;
  oldValue?: string | number;
  newValue?: string | number;
}

