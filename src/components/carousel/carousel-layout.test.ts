import { describe, expect, it } from 'vitest';

import {
  type CardPlacement,
  type CarouselLayout,
  computeLayout,
  getLoopOffset,
  type Keyline,
  placeCard,
} from './carousel-layout';

function widths(layout: CarouselLayout): number[] {
  return layout.keylines.map((keyline: Keyline): number => keyline.width);
}

describe('computeLayout', () => {
  it('uses five visible cards on desktop', () => {
    const layout: CarouselLayout = computeLayout(1904, 1920);

    expect(layout.name).toBe('desktop');
    // A parking slot on both sides, then 120 | 288 | middle | 288 | 120.
    // 1904 - 2 * 8 padding - 2 * (120 + 288) - 4 * 8 gaps = 1040.
    expect(widths(layout)).toEqual([120, 120, 288, 1040, 288, 120, 120]);
    expect(layout.centerIndex).toBe(3);
    expect(layout.keylines[1]?.x).toBe(8);
  });

  it('uses three visible cards on tablet', () => {
    const layout: CarouselLayout = computeLayout(752, 768);

    expect(layout.name).toBe('tablet');
    expect(widths(layout)).toEqual([104, 104, 512, 104, 104]);
    expect(layout.step).toBe(512 / 2 + 8 + 104 / 2);
  });

  it('switches to the tablet layout before the middle card gets smaller than on tablet', () => {
    // The desktop middle card reaches the 448px tablet middle card at a 1312px track.
    expect(computeLayout(1312, 1330).name).toBe('desktop');
    expect(computeLayout(1311, 1330).name).toBe('tablet');
  });

  it('uses the narrow side cards on mobile', () => {
    const layout: CarouselLayout = computeLayout(359, 375);

    expect(layout.name).toBe('mobile');
    // 359 - 2 * 4 padding - 2 * 56 - 2 * 8 gaps = 223.
    expect(widths(layout)).toEqual([56, 56, 223, 56, 56]);
    expect(layout.keylines[1]?.x).toBe(4);
  });
});

describe('placeCard', () => {
  const layout: CarouselLayout = computeLayout(752, 768);

  it('puts the current card into the middle slot', () => {
    expect(placeCard(layout, 0)).toEqual<CardPlacement>({ x: 120, width: 512, isVisible: true });
  });

  it('interpolates between the slots while dragging', () => {
    const placement: CardPlacement = placeCard(layout, 0.5);

    expect(placement.width).toBe((512 + 104) / 2);
    expect(placement.x).toBe((120 + 640) / 2);
  });

  it('hides the cards in the parking slots and beyond', () => {
    expect(placeCard(layout, 2).isVisible).toBe(false);
    expect(placeCard(layout, -5)).toEqual(
      expect.objectContaining({ isVisible: false, width: 104 }),
    );
  });
});

describe('getLoopOffset', () => {
  it('takes the shortest way around the loop', () => {
    expect(getLoopOffset(1, 0, 5)).toBe(1);
    expect(getLoopOffset(4, 0, 5)).toBe(-1);
    expect(getLoopOffset(0, 4, 5)).toBe(1);
    expect(getLoopOffset(2, 2, 5)).toBe(0);
  });

  it('works with a fractional position while dragging', () => {
    expect(getLoopOffset(0, 0.25, 4)).toBeCloseTo(-0.25);
  });
});
