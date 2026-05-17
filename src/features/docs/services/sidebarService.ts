import { DocCategory, CreateCategoryPayload } from '../types/documentation';
import documentationService from './documentationService';

export interface SidebarItem {
  label: string;
  path?: string;
  items?: SidebarItem[];
}

/**
 * Build tree structure from flat category array using parent_category_id
 */
const buildCategoryTree = (
  categories: DocCategory[],
  parentId: number | null = null
): DocCategory[] => {
  return categories
    .filter((cat) => cat.parent_category_id === parentId)
    .sort((a, b) => a.display_order - b.display_order)
    .map((cat) => ({
      ...cat,
      subcategories: buildCategoryTree(categories, cat.category_id),
    }));
};

/**
 * Convert DocCategory tree to SidebarItem tree format
 * Maps category.label → label, category.code → path, nested categories → items
 */
export const categoryTreeToSidebarItems = (categories: DocCategory[]): SidebarItem[] => {
  return categories.map((category) => {
    const item: SidebarItem = {
      label: category.label || category.name,
      path: category.code ? `/documentation/${category.code}` : undefined,
    };

    if ('subcategories' in category && category.subcategories && category.subcategories.length > 0) {
      item.items = categoryTreeToSidebarItems(category.subcategories);
    }

    return item;
  });
};

/**
 * Get sidebar categories from API
 */
export const getCategories = async (): Promise<DocCategory[]> => {
  try {
    return await documentationService.getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
    throw error;
  }
};

/**
 * Get sidebar as SidebarItem tree from API
 */
export const getSidebar = async (): Promise<SidebarItem[]> => {
  const categories = await getCategories();
  const tree = buildCategoryTree(categories);
  return categoryTreeToSidebarItems(tree);
};

/**
 * Create a new category
 */
export const createCategory = async (
  payload: CreateCategoryPayload
): Promise<any> => {
  try {
    return await documentationService.createCategory(payload);
  } catch (error) {
    console.error('Failed to create category:', error);
    throw error;
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (
  id: number,
  payload: Partial<CreateCategoryPayload>
): Promise<any> => {
  try {
    return await documentationService.updateCategory(id, payload);
  } catch (error) {
    console.error('Failed to update category:', error);
    throw error;
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: number): Promise<any> => {
  try {
    return await documentationService.deleteCategory(id);
  } catch (error) {
    console.error('Failed to delete category:', error);
    throw error;
  }
};
