// Shared GraphQL type aliases for resolver params
export interface Parent {
  id: string;
  [key: string]: unknown;
}

export interface PaginationArgs {
  limit?: number;
  offset?: number;
}

export interface PostFilterArgs extends PaginationArgs {
  published?: boolean;
  search?: string;
}

export interface ProductFilterArgs extends PaginationArgs {
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface IdArg {
  id: string;
}

export interface SlugArg {
  slug: string;
}

export interface NameArg {
  name: string;
}

export interface CodeArg {
  code: string;
}

export interface UserIdArg {
  userId: string;
}

export interface PostIdArg {
  postId: string;
}

export interface ProductIdArg {
  productId: string;
  quantity?: number;
}

export interface OrderIdArg {
  orderId: string;
}
