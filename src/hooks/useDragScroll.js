import { useRef, useState } from 'react';

/**
 * Custom React hook that enables mouse drag-to-scroll and mouse wheel horizontal scrolling
 * for horizontal containers on desktop.
 */
export function useDragScroll() {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const moved = useRef(false);

  const onMouseDown = (e) => {
    if (!ref.current) return;
    // Only drag on primary (left) button
    if (e.button !== 0) return;
    setIsDragging(true);
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    moved.current = false;
  };

  const onMouseMove = (e) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.35;
    if (Math.abs(walk) > 4) {
      moved.current = true;
    }
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  // Convert vertical mouse wheel into horizontal scroll seamlessly
  const onWheel = (e) => {
    if (!ref.current) return;
    if (e.deltaY !== 0) {
      e.preventDefault();
      ref.current.scrollLeft += e.deltaY * 0.9;
    }
  };

  return {
    ref,
    isDragging,
    hasMoved: () => moved.current,
    dragProps: {
      ref,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onWheel,
    },
  };
}
