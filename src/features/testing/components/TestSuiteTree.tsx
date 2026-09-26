import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FileCode2,
  CircleDot,
} from 'lucide-react';
import type { TestCatalogNode } from '../types/health';
import { collectValues } from '../utils/testCatalogUtils';

const KIND_ICON = {
  category: Folder,
  spec: FileCode2,
  case: CircleDot,
} as const;

interface TestSuiteTreeProps {
  nodes: TestCatalogNode[];
  selected: Set<string>;
  onToggle: (value: string, checked: boolean) => void;
  onToggleBranch: (node: TestCatalogNode, checked: boolean) => void;
  defaultOpenDepth?: number;
}

const TreeNode: React.FC<{
  node: TestCatalogNode;
  depth: number;
  selected: Set<string>;
  onToggle: (value: string, checked: boolean) => void;
  onToggleBranch: (node: TestCatalogNode, checked: boolean) => void;
  defaultOpenDepth: number;
}> = ({ node, depth, selected, onToggle, onToggleBranch, defaultOpenDepth }) => {
  const [open, setOpen] = useState(depth < defaultOpenDepth);
  const hasChildren = Boolean(node.children?.length);
  const branchValues = collectValues(node).filter(Boolean);
  const selectedCount = branchValues.filter((value) => selected.has(value)).length;
  const allSelected = branchValues.length > 0 && selectedCount === branchValues.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const Icon = KIND_ICON[node.kind];

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
          someSelected || allSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center text-gray-500 hover:text-gray-800"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        <input
          type="checkbox"
          checked={node.value ? selected.has(node.value) : allSelected}
          ref={(el) => {
            if (el) el.indeterminate = !node.value && someSelected;
          }}
          onChange={(event) => {
            if (node.value) {
              onToggle(node.value, event.target.checked);
            } else {
              onToggleBranch(node, event.target.checked);
            }
          }}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        <Icon size={13} className="text-gray-500 shrink-0" />
        <span className="text-sm text-gray-900 flex-1">{node.label}</span>
        {node.value && (
          <span className="text-xs text-gray-400 max-w-[220px] truncate">{node.value}</span>
        )}
      </div>

      {open && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
              onToggleBranch={onToggleBranch}
              defaultOpenDepth={defaultOpenDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TestSuiteTree: React.FC<TestSuiteTreeProps> = ({
  nodes,
  selected,
  onToggle,
  onToggleBranch,
  defaultOpenDepth = 1,
}) => {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selected={selected}
          onToggle={onToggle}
          onToggleBranch={onToggleBranch}
          defaultOpenDepth={defaultOpenDepth}
        />
      ))}
    </div>
  );
};

export default TestSuiteTree;
