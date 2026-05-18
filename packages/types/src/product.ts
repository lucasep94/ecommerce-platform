export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
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

export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
}
