import './skeleton.scss';

import { createElement } from '@/shared/dom/create-element';

export type SkeletonShape = 'block' | 'text' | 'circle';

/**
 * A placeholder shape with a shimmer that stands in for content while it is loading. The size
 * comes from the class of the section that uses it.
 */
export function createSkeleton(className: string, shape: SkeletonShape = 'block'): HTMLElement {
  return createElement('span', {
    className: `skeleton skeleton--${shape} ${className}`,
    attributes: { 'aria-hidden': 'true' },
  });
}

/**
 * Wraps skeleton shapes into a region that screen readers announce as loading.
 */
export function createSkeletonRegion(
  label: string,
  children: readonly Node[],
  className: string,
): HTMLElement {
  return createElement('div', {
    className,
    attributes: { role: 'status', 'aria-busy': 'true', 'aria-label': label },
    children: [...children],
  });
}
