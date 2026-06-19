import type { TestCatalogNode } from '../types/health';

export function collectValues(node: TestCatalogNode): string[] {
  const values = node.value ? [node.value] : [];
  node.children?.forEach((child) => values.push(...collectValues(child)));
  return values;
}

export function nodeMatches(node: TestCatalogNode, query: string): boolean {
  const haystack = `${node.label} ${node.value ?? ''}`.toLowerCase();
  if (haystack.includes(query)) return true;
  return node.children?.some((child) => nodeMatches(child, query)) ?? false;
}

export function filterTree(nodes: TestCatalogNode[], query: string): TestCatalogNode[] {
  if (!query) return nodes;
  return nodes
    .filter((node) => nodeMatches(node, query))
    .map((node) => ({
      ...node,
      children: node.children ? filterTree(node.children, query) : undefined,
    }));
}

export function formatSuiteLabel(value: string): string {
  if (value.includes('::')) {
    return value.split('::').pop() ?? value;
  }
  return value.split('/').pop() ?? value;
}

export function countCatalogNodes(nodes: TestCatalogNode[]): number {
  return nodes.reduce((sum, node) => {
    const self = node.value ? 1 : 0;
    const children = node.children ? countCatalogNodes(node.children) : 0;
    return sum + self + children;
  }, 0);
}
