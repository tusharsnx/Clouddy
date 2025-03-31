import { $moveCaretSelection, $moveCharacter } from "@lexical/selection";
import {
  $getPreviousSelection,
  $setSelection,
  type PointType,
  type RangeSelection,
} from "lexical";
import { isBoxBoundaryNode } from "#/components/ui/structured-input/nodes/helpers";
import { $isBoxInnerBoundaryNode } from "#/components/ui/structured-input/nodes/inner-boundary-node";
import { $isBoxOuterBoundaryNode } from "#/components/ui/structured-input/nodes/outer-boundary-node";

/**
 * Skips box nodes during a deletion operation.
 * @returns True, if selection was changed, else False.
 */
export function $skipBoxNodesForDeletion(
  selection: RangeSelection,
  isBackward: boolean,
) {
  if (!selection.isCollapsed()) {
    return false;
  }

  // Track changes made to the current selection
  const initialSelection = selection.clone();

  // This is to track when selection stops moving so we can stop the
  // loop and avoid running it endlessly. This happens when we've
  // reached the end of the text.
  let lastSelection: RangeSelection | null = null;

  let node = getNextCharacterNode(selection, isBackward);
  while (isBoxBoundaryNode(node) && !selection.is(lastSelection)) {
    lastSelection = selection.clone();
    $moveCharacter(selection, false, isBackward);
    node = getNextCharacterNode(selection, isBackward);
  }

  return !selection.is(initialSelection);
}

function getNextCharacterNode(selection: RangeSelection, isBackward: boolean) {
  // There can be many non-text nodes in-between current position and
  // the next character. Getting the next character becomes tricky
  // because there are no browser primitive to do that. However, we can
  // ask the dom to select the character for us, and then read the node
  // from the selection object.

  // Save the current selection state to restore it later.
  const lastSelection = selection.clone();

  // Select a character.
  // This might select "too" much in case of some unicode characters
  // that needs to be deleted in parts, but box characters (e.g.
  // \u200B) are always deleted as a single unit so it's fine.
  selection.modify("extend", isBackward, "character");

  // The next character belongs to the focus node.
  const nextCharacterNode = selection.focus.getNode();

  // Restore the last selection.
  $setSelection(lastSelection);

  return nextCharacterNode;
}

/**
 * Moves or extends the selection according to the input.
 * Skips box nodes.
 * @param selection The selection object to modify.
 * @param isBackward The direction in which selection needs to be modified.
 * @param granularity The level of modification to apply.
 * @returns True, if caret was moved at all, else False.
 */
export function $modifySelection(
  selection: RangeSelection,
  isBackward: boolean,
  granularity: "character" | "word",
) {
  // Track changes made to the selection.
  const initialSelection = selection.clone();
  const isInitialSelectionBackward = initialSelection.isBackward();
  let isRangeSelection = !initialSelection.isCollapsed();

  // This is to track when selection stops moving so we can stop the
  // loop and avoid running it endlessly. This happens when we've
  // reached the end of the text.
  let lastSelection: RangeSelection | null = null;
  let hasDirectionChanged = false;

  // A shrinking range selection first collapses, and then expands in
  // the opposite direction. It can't do both in the same event. This
  // only applies for a character-wise modification.
  const isShrinking = isInitialSelectionBackward !== isBackward;
  const collapseOnDirectionChange =
    isRangeSelection && granularity === "character" && isShrinking;

  while (
    shouldSkipSelectionPoint(selection.focus, isRangeSelection) &&
    !selection.is(lastSelection) &&
    (!collapseOnDirectionChange || !hasDirectionChanged)
  ) {
    lastSelection = selection.clone();
    $moveCaretSelection(selection, isRangeSelection, isBackward, granularity);
    hasDirectionChanged = isInitialSelectionBackward !== selection.isBackward();
  }

  if (collapseOnDirectionChange && hasDirectionChanged) {
    const { anchor } = selection;
    const { offset } = anchor;
    anchor.getNode().select(offset, offset);
    isRangeSelection = false;
  }

  // Undo the selection if we couldn't find a good node.
  if (shouldSkipSelectionPoint(selection.focus, isRangeSelection)) {
    const prevSelection = $getPreviousSelection()?.clone() ?? null;
    $setSelection(prevSelection);
  }

  return !selection.is(initialSelection);
}

function shouldSkipSelectionPoint(point: PointType, isRangeSelection: boolean) {
  return isRangeSelection
    ? isBoxBoundaryNode(point.getNode())
    : isPointSkipPosition(point);
}

function isPointSkipPosition(point: PointType) {
  const node = point.getNode();
  const { offset } = point;

  return $isBoxOuterBoundaryNode(node)
    ? node.isFrontBoundary()
      ? offset === 1
      : offset === 0
    : $isBoxInnerBoundaryNode(node) && offset === 0;
}
