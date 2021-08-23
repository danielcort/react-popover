import { useCallback } from 'react';
import { PositionPopover, UsePopoverProps, UsePopoverResult } from '.';
import {
  getBoundingRectNeglectingPositionalTransform,
  getNewPopoverRect,
  getNudgedPopoverRect,
} from './util';
import { useElementRef } from './useElementRef';

export const usePopover = ({
  childRef,
  positions,
  containerClassName,
  containerParent,
  contentLocation,
  align,
  padding,
  reposition,
  boundaryInset,
  onPositionPopover,
}: UsePopoverProps): UsePopoverResult => {
  const popoverRef = useElementRef(containerClassName, {
    position: 'fixed',
    overflow: 'visible',
    top: '0px',
    left: '0px',
  });

  const positionPopover = useCallback<PositionPopover>(
    ({
      positionIndex = 0,
      parentRect = containerParent.getBoundingClientRect(),
      parentRectAdjusted = getBoundingRectNeglectingPositionalTransform(containerParent),
      childRect = childRef?.current?.getBoundingClientRect(),
      popoverRect = popoverRef.current.getBoundingClientRect(),
    } = {}) => {
      if (!childRect || !parentRect) {
        return;
      }
      if (contentLocation) {
        const { top: inputTop, left: inputLeft } =
          typeof contentLocation === 'function'
            ? contentLocation({
                childRect,
                popoverRect,
                parentRect,
                padding,
                nudgedTop: 0,
                nudgedLeft: 0,
                boundaryInset,
              })
            : contentLocation;

        const left = parentRect.left + inputLeft;
        const top = parentRect.top + inputTop;

        popoverRef.current.style.transform = `translate(${left}px, ${top}px)`;

        onPositionPopover({
          childRect,
          popoverRect,
          parentRect,
          padding,
          nudgedTop: 0,
          nudgedLeft: 0,
          boundaryInset,
        });

        return;
      }

      const isExhausted = positionIndex === positions.length;
      const position = isExhausted ? positions[0] : positions[positionIndex];

      const { rect, boundaryViolation } = getNewPopoverRect(
        {
          childRect,
          popoverRect,
          parentRect,
          parentRectAdjusted,
          position,
          align,
          padding,
          reposition,
        },
        boundaryInset,
      );

      if (boundaryViolation && reposition && !isExhausted) {
        positionPopover({
          positionIndex: positionIndex + 1,
          childRect,
          popoverRect,
          parentRect,
          parentRectAdjusted,
        });
        return;
      }

      const { top, left, width, height } = rect;
      const shouldNudge = reposition && !isExhausted;
      const { left: nudgedLeft, top: nudgedTop } = getNudgedPopoverRect(
        rect,
        parentRect,
        boundaryInset,
      );

      let finalTop = top;
      let finalLeft = left;

      if (shouldNudge) {
        finalTop = nudgedTop;
        finalLeft = nudgedLeft;
      }

      popoverRef.current.style.transform = `translate(${finalLeft}px, ${finalTop}px)`;

      onPositionPopover({
        childRect,
        popoverRect: {
          top: finalTop,
          left: finalLeft,
          width,
          height,
          right: finalLeft + width,
          bottom: finalTop + height,
        },
        parentRect,
        position,
        align,
        padding,
        nudgedTop: nudgedTop - top,
        nudgedLeft: nudgedLeft - left,
        boundaryInset,
      });
    },
    [
      childRef,
      popoverRef,
      positions,
      align,
      padding,
      reposition,
      boundaryInset,
      containerParent,
      contentLocation,
      onPositionPopover,
    ],
  );

  return [positionPopover, popoverRef];
};
