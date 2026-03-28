import React from 'react';
import BreadcrumbsOriginal from '@theme-original/Breadcrumbs';
import type BreadcrumbsType from '@theme/Breadcrumbs';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof BreadcrumbsType>;

export default function BreadcrumbsWrapper(props: Props): JSX.Element {
  return (
    <div
      onClick={(e: React.MouseEvent) => {
        // Prevent navigation on home icon (first breadcrumb item)
        const target = e.target as HTMLElement;
        if (target.closest('.breadcrumbs__item:first-child a')) {
          e.preventDefault();
        }
      }}
    >
      <BreadcrumbsOriginal {...props} />
    </div>
  );
}
