// Catering Pack types
export type CateringCategory = 'vegetarian' | 'non-vegetarian' | 'mixed';

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  descriptionNl: string;
  price: number;
  isVegetarian: boolean;
  isSpicy: boolean;
  image?: string;
}

export interface CateringPack {
  _id: string;
  name: string;
  description: string;
  descriptionNl: string;
  category: CateringCategory;
  pricePerPerson: number;
  minPeople: number;
  menuItems: MenuItem[];
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CateringPackFormData {
  name: string;
  description: string;
  descriptionNl: string;
  category: CateringCategory;
  pricePerPerson: number;
  minPeople: number;
  menuItems: string[];
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

// Catering Order types
export type DeliveryStatus = 'YET_TO_BE_DELIVERED' | 'DELIVERED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface DeliveryAddress {
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  additionalInfo?: string;
}

export interface CateringOrder {
  _id: string;
  orderNumber: string;
  cateringPack: {
    _id: string;
    name: string;
    description: string;
    descriptionNl: string;
    category: CateringCategory;
    pricePerPerson: number;
    minPeople: number;
    image?: string;
    menuItems?: MenuItem[];
  };
  peopleCount: number;
  totalPrice: number;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: DeliveryAddress;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface CateringPacksResponse {
  success: boolean;
  message: string;
  packs: CateringPack[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CateringPackResponse {
  success: boolean;
  message: string;
  pack: CateringPack;
}

export interface CateringOrdersResponse {
  success: boolean;
  message: string;
  orders: CateringOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CateringOrderResponse {
  success: boolean;
  message: string;
  order: CateringOrder;
}

// Query params
export interface CateringPacksQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: CateringCategory;
  isActive?: boolean;
}

export interface CateringOrdersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  deliveryStatus?: DeliveryStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}
