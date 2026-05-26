import sidebarsV1_0 from '../sidebars.v1.0';
import sidebarsV1_1 from '../sidebars.v1.1';
import sidebarsV1_2_4 from '../sidebars.v1.2.4';
import sidebars from '../sidebars';
import { convertDocusaurusSidebar } from '../utils/sidebarConverter';

// API imports - commented out, will use when backend is ready
// import { DocCategory, CreateCategoryPayload } from '../types/documentation';
// import documentationService from './documentationService';

export interface SidebarItem {
  label: string;
  path?: string;
  items?: SidebarItem[];
}

/**
 * Get sidebar from hardcoded sidebars config by version
 * Supports: 1.2.2, 1.2.3, 1.2.4 (latest), default (current)
 * API version commented out below - will use when backend is ready
 */
export const getSidebar = (version: string = 'default'): SidebarItem[] => {
  let sidebarConfig;

  switch (version) {
    case '1.2.2':
      sidebarConfig = sidebarsV1_0.tutorialSidebar || [];
      break;
    case '1.2.3':
      sidebarConfig = sidebarsV1_1.tutorialSidebar || [];
      break;
    case '1.2.4':
      sidebarConfig = sidebarsV1_2_4.tutorialSidebar || [];
      break;
    case 'default':
    default:
      sidebarConfig = sidebars.tutorialSidebar || [];
      break;
  }

  return convertDocusaurusSidebar(sidebarConfig);
};

/**
 * COMMENTED OUT - API INTEGRATION PENDING
 * Build tree structure from flat category array using parent_category_id
 */
/*
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
*/

/**
 * COMMENTED OUT - API INTEGRATION PENDING
 * Convert DocCategory tree to SidebarItem tree format
 * Maps category.label → label, category.code → path, nested categories → items
 */
/*
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
*/

/**
 * COMMENTED OUT - API INTEGRATION PENDING
 * Get sidebar categories from API
 */
/*
export const getCategories = async (): Promise<DocCategory[]> => {
  try {
    return await documentationService.getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
    throw error;
  }
};
*/

/**
 * COMMENTED OUT - API INTEGRATION PENDING
 * Create a new category
 */
/*
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
*/

/**
 * COMMENTED OUT - API INTEGRATION PENDING
 * Update an existing category
 */
/*
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
*/

/**
 * COMMENTED OUT - API INTEGRATION PENDING
 * Delete a category
 */
/*
export const deleteCategory = async (id: number): Promise<any> => {
  try {
    return await documentationService.deleteCategory(id);
  } catch (error) {
    console.error('Failed to delete category:', error);
    throw error;
  }
};
*/
