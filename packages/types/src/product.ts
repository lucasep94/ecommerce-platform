export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  images: string[];
  brand: string;
  rating: number | null;
  reviewCount: number;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDTO {
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  images: string[];
  brand: string;
  rating?: number | null;
  reviewCount?: number;
  categoryId: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  isActive?: boolean;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  productCount: number;
}

export interface CreateCategoryDTO {
  slug: string;
  name: string;
}

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;
