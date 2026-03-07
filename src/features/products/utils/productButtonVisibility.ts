import { Product } from "../types/product";

/**
 * Check if product can be archived
 */
export function canArchiveProduct(product: Product | undefined): boolean {
  if (!product) return false;
  return true;
}

/**
 * Check if product can be deleted
 */
export function canDeleteProduct(product: Product | undefined): boolean {
  if (!product) return false;
  return true;
}

/**
 * Check if product can be activated
 */
export function canActivateProduct(product: Product | undefined): boolean {
  if (!product) return false;
  return !product.is_active;
}

/**
 * Check if product can be deactivated
 */
export function canDeactivateProduct(product: Product | undefined): boolean {
  if (!product) return false;
  return product.is_active === true;
}
