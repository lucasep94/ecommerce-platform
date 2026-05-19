export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
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
  stock: number;
  images: string[];
  categoryId: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  isActive?: boolean;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
}

export interface CreateCategoryDTO {
  slug: string;
  name: string;
}

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;
