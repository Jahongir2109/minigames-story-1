// Keyline layout of the "New Games" slider (Material 3 multi-browse carousel): a large card in the
// middle and smaller cards towards the edges.

export type CarouselLayoutName = 'desktop' | 'tablet' | 'mobile';

export interface Keyline {
  x: number;
  width: number;
}

export interface CarouselLayout {
  name: CarouselLayoutName;
  keylines: Keyline[];
  centerIndex: number;
  /**
   * Distance between the centres of the middle slot and its neighbour: a swipe of this length
   * moves the slider by one card.
   */
  step: number;
}

export interface CardPlacement extends Keyline {
  isVisible: boolean;
}

interface LayoutConfig {
  name: CarouselLayoutName;
  /**
   * Widths of the visible slots on one side of the middle card, outermost first.
   */
  sideSlots: readonly number[];
  gap: number;
  padding: number;
}

// Mockup: 120 | 288 | middle | 288 | 120 at 1920px, 104 | middle | 104 at 768px and
// 56 | middle | 56 at 375px; the middle card takes the remaining width.
const DESKTOP: LayoutConfig = { name: 'desktop', sideSlots: [120, 288], gap: 8, padding: 8 };
const TABLET: LayoutConfig = { name: 'tablet', sideSlots: [104], gap: 8, padding: 8 };
const MOBILE: LayoutConfig = { name: 'mobile', sideSlots: [56], gap: 8, padding: 4 };

// Mirrors `$bp-narrow`. The five-card layout is used once its middle card is at least as wide as
// the middle card of the tablet layout, so the middle card always stays the largest.
const MOBILE_MAX_VIEWPORT: number = 576;
const TABLET_MIDDLE_WIDTH: number = 448;

function getMiddleWidth(config: LayoutConfig, trackWidth: number): number {
  const sides: number = config.sideSlots.reduce(
    (sum: number, width: number): number => sum + width,
    0,
  );
  const gaps: number = config.sideSlots.length * 2 * config.gap;

  return trackWidth - config.padding * 2 - sides * 2 - gaps;
}

function pickConfig(trackWidth: number, viewportWidth: number): LayoutConfig {
  if (viewportWidth <= MOBILE_MAX_VIEWPORT) {
    return MOBILE;
  }

  return getMiddleWidth(DESKTOP, trackWidth) >= TABLET_MIDDLE_WIDTH ? DESKTOP : TABLET;
}

export function computeLayout(trackWidth: number, viewportWidth: number): CarouselLayout {
  const config: LayoutConfig = pickConfig(trackWidth, viewportWidth);
  const middle: number = getMiddleWidth(config, trackWidth);
  const side: readonly number[] = config.sideSlots;
  const mirrored: number[] = side.map(
    (_: number, index: number): number => side[side.length - 1 - index] ?? 0,
  );
  const outermost: number = side[0] ?? middle;

  const keylines: Keyline[] = [];
  let x: number = config.padding;

  for (const width of [...side, middle, ...mirrored]) {
    keylines.push({ x, width });
    x += width + config.gap;
  }

  // One parking slot on each side just outside the track, so the cards slide in and out
  // instead of popping up.
  keylines.unshift({ x: config.padding - config.gap - outermost, width: outermost });
  keylines.push({ x, width: outermost });

  const centerIndex: number = (keylines.length - 1) / 2;
  const center: Keyline = keylines[centerIndex] ?? { x: 0, width: 0 };
  const next: Keyline = keylines[centerIndex + 1] ?? center;

  return {
    name: config.name,
    keylines,
    centerIndex,
    step: next.x + next.width / 2 - (center.x + center.width / 2),
  };
}

/**
 * Position and width of a card `offset` slots away from the middle (fractional while the user
 * drags), interpolated between the neighbouring keylines.
 */
export function placeCard(layout: CarouselLayout, offset: number): CardPlacement {
  const lastIndex: number = layout.keylines.length - 1;
  const slot: number = Math.min(Math.max(layout.centerIndex + offset, 0), lastIndex);
  const lower: number = Math.floor(slot);
  const progress: number = slot - lower;
  const from: Keyline = layout.keylines[lower] ?? { x: 0, width: 0 };
  const to: Keyline = layout.keylines[Math.min(lower + 1, lastIndex)] ?? from;

  return {
    x: from.x + (to.x - from.x) * progress,
    width: from.width + (to.width - from.width) * progress,
    isVisible: slot > 0 && slot < lastIndex,
  };
}

/**
 * Shortest signed distance from `position` to `index` on a loop of `count` cards.
 */
export function getLoopOffset(index: number, position: number, count: number): number {
  const distance: number = (((index - position) % count) + count) % count;

  return distance > count / 2 ? distance - count : distance;
}
