import sidebarsV1_0 from '../sidebars.v1.0';
import sidebarsV1_1 from '../sidebars.v1.1';

type SidebarsConfig = {
  [key: string]: (string | Record<string, any>)[];
};

export const getSidebarConfig = (version: string): SidebarsConfig => {
  switch (version) {
    case 'v1.0':
      return sidebarsV1_0;
    case 'v1.1':
      return sidebarsV1_1;
    default:
      return sidebarsV1_1; // Default to latest version
  }
};

export const getSidebar = (version: string) => {
  const config = getSidebarConfig(version);
  return config.tutorialSidebar;
};

/**
 * Create a new category in the sidebar
 * TODO: replace with POST /api/sidebars/{version}/categories
 */
export const createCategory = async (
  version: string,
  payload: { label: string; parentId?: string }
): Promise<void> => {
  console.log(`[STUB] Creating category in ${version}:`, payload);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('✓ Category created (stub)');
};

/**
 * Create a new doc page in the sidebar
 * TODO: replace with POST /api/sidebars/{version}/pages
 */
export const createPage = async (
  version: string,
  payload: { label: string; path: string; parentId?: string }
): Promise<void> => {
  console.log(`[STUB] Creating page in ${version}:`, payload);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('✓ Page created (stub)');
};

/**
 * Update an existing sidebar item
 * TODO: replace with PUT /api/sidebars/{version}/items/{id}
 */
export const updateItem = async (
  version: string,
  id: string,
  payload: { label?: string; path?: string }
): Promise<void> => {
  console.log(`[STUB] Updating item ${id} in ${version}:`, payload);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('✓ Item updated (stub)');
};

/**
 * Delete a sidebar item
 * TODO: replace with DELETE /api/sidebars/{version}/items/{id}
 */
export const deleteItem = async (version: string, id: string): Promise<void> => {
  console.log(`[STUB] Deleting item ${id} in ${version}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('✓ Item deleted (stub)');
};

/**
 * Reorder a sidebar item
 * TODO: replace with PATCH /api/sidebars/{version}/items/{id}/reorder
 */
export const reorderItem = async (
  version: string,
  id: string,
  direction: 'up' | 'down'
): Promise<void> => {
  console.log(`[STUB] Reordering item ${id} in ${version} - direction: ${direction}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('✓ Item reordered (stub)');
};
