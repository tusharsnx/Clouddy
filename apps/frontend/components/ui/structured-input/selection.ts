import { $moveCaretSelection, $moveCharacter } from "@lexical/selection";
import {
  $getCharacterOffsets,
  $getPreviousSelection,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  $setSelection,
  type NodeSelection,
  type Point,
  type RangeSelection,
} from "lexical";
import { $isBoxBoundaryNode } from "#/components/ui/structured-input/nodes/box-boundary-node";
import { $isBoxNode } from "#/components/ui/structured-input/nodes/box-node";
import { $isBoxTextNode } from "#/components/ui/structured-input/nodes/box-text-node";
import {
  $getBoxRootByGroupNode,
  $getNextCharacterNode,
  $isBoxGroupNode,
  shouldSkipSelectionPoint,
} from "#/components/ui/structured-input/nodes/helpers";

// This is taken from gh/lexical:
// https://github.com/facebook/lexical/blob/993184c5620efded36efe9e08649c4da08a5e6fa/packages/lexical/src/LexicalSelection.ts#L3088
export function getTextContentNodeSelection(selection: NodeSelection) {
  const nodes = selection.getNodes();
  let textContent = "";
  for (const node of nodes) {
    textContent += node.getTextContent();
  }
  return textContent;
}

// This is taken from gh/lexical:
// https://github.com/facebook/lexical/blob/993184c5620efded36efe9e08649c4da08a5e6fa/packages/lexical/src/LexicalSelection.ts#L559
export function getSelectionTextContent(selection: RangeSelection) {
  const nodes = selection.getNodes();
  if (nodes.length === 0) {
    return "";
  }
  const firstNode = nodes[0];
  const lastNode = nodes[nodes.length - 1];
  const anchor = selection.anchor;
  const focus = selection.focus;
  const isBefore = anchor.isBefore(focus);
  const [anchorOffset, focusOffset] = $getCharacterOffsets(selection);
  let textContent = "";
  let prevWasElement = true;
  for (const node of nodes) {
    if ($isElementNode(node) && !node.isInline()) {
      if (!prevWasElement) {
        textContent += "\n";
      }
      if (node.isEmpty()) {
        prevWasElement = false;
      } else {
        prevWasElement = true;
      }
    } else {
      prevWasElement = false;

      if ($isTextNode(node)) {
        let text: string;

        // Remove special text nodes that adds hidden "\u200B" in the text
        // for making impossible cursor locations possible.
        if ($isBoxBoundaryNode(node)) {
          text = "";
        } else {
          text = node.getTextContent();
        }

        if (node === firstNode) {
          if (node === lastNode) {
            if (
              anchor.type !== "element" ||
              focus.type !== "element" ||
              focus.offset === anchor.offset
            ) {
              text =
                anchorOffset < focusOffset
                  ? text.slice(anchorOffset, focusOffset)
                  : text.slice(focusOffset, anchorOffset);
            }
          } else {
            text = isBefore
              ? text.slice(anchorOffset)
              : text.slice(focusOffset);
          }
        } else if (node === lastNode) {
          text = isBefore
            ? text.slice(0, focusOffset)
            : text.slice(0, anchorOffset);
        }
        textContent += text;
      } else if (
        ($isDecoratorNode(node) || $isLineBreakNode(node)) &&
        (node !== lastNode || !selection.isCollapsed())
      ) {
        textContent += node.getTextContent();
      }
    }
  }
  return textContent;
}

/**
 * Skips box nodes during a deletion operation.
 * @returns True, if selection was changed, else False.
 */
export function $skipBoxNodesBeforeDeletion(
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

  let node = $getNextCharacterNode(selection, isBackward);
  while ($isBoxBoundaryNode(node) && !selection.is(lastSelection)) {
    lastSelection = selection.clone();
    $moveCharacter(selection, false, isBackward);
    node = $getNextCharacterNode(selection, isBackward);
  }

  return !selection.is(initialSelection);
}

/**
 * Moves or extends the selection according to the input.
 * @param selection The selection object to modify.
 * @param isBackward The direction in which selection needs to be modified.
 * @param granularity The level of modification to apply.
 * @returns True, if caret was moved at all, else False.
 */
export function $handleKeySelectionOnBox(
  selection: RangeSelection,
  isBackward: boolean,
  granularity: "character" | "word",
) {
  return selection.isCollapsed()
    ? $handleCaretSelectionOnBox(selection, isBackward, granularity)
    : $handleRangeSelectionOnBox(selection, isBackward);
}

// Todo: Try with $extendCaretToRange()
function $handleCaretSelectionOnBox(
  selection: RangeSelection,
  isBackward: boolean,
  granularity: "character" | "word",
) {
  const newSelection: RangeSelection = selection.clone();

  // Track changes made to the selection.
  const initialSelection = selection.clone();
  const isInitialSelectionBackward = initialSelection.isBackward();
  let isRangeSelection = !initialSelection.isCollapsed();

  // This is to track when selection stops moving so we can stop the
  // loop and avoid running it endlessly. This happens when we've
  // reached the end of the text.
  let lastSelection: RangeSelection | null = null;
  let hasDirectionChanged = false;

  // A narrowing range selection first collapses, and then expands in
  // the opposite direction. It can't do both in the same event. This
  // only applies for a character-wise modification.
  const isNarrowing = isInitialSelectionBackward !== isBackward;
  const collapseOnDirectionChange =
    isRangeSelection && granularity === "character" && isNarrowing;

  while (
    shouldSkipSelectionPoint(newSelection.focus, isRangeSelection) &&
    !newSelection.is(lastSelection) &&
    !(collapseOnDirectionChange && hasDirectionChanged)
  ) {
    lastSelection = newSelection.clone();
    $moveCaretSelection(
      newSelection,
      isRangeSelection,
      isBackward,
      granularity,
    );
    hasDirectionChanged =
      isInitialSelectionBackward !== newSelection.isBackward();
  }

  if (collapseOnDirectionChange && hasDirectionChanged) {
    const { anchor } = newSelection;
    const { offset } = anchor;
    anchor.getNode().select(offset, offset);
    isRangeSelection = false;
  }

  // Undo the selection if we couldn't find a good node.
  if (shouldSkipSelectionPoint(newSelection.focus, isRangeSelection)) {
    const prevSelection = $getPreviousSelection()?.clone() ?? null;
    $setSelection(prevSelection);
    return false;
  }

  if (!newSelection.is(initialSelection)) {
    $setSelection(newSelection);
    return true;
  }

  return false;
}

function $handleRangeSelectionOnBox(
  selection: RangeSelection,
  isBackward: boolean,
): boolean {
  // No need to expand the selection if anchor or focus is within the same box node.
  if (!$isPartialSelectionInBox(selection)) {
    return false;
  }

  const { anchor, focus } = selection;

  const isSelectionBackward = selection.isBackward();
  const newSelection = selection.clone();

  // Handle anchor node
  if ($isPointWithinBoxNode(anchor)) {
    const anchorBoxRoot = $getBoxRootByGroupNode(anchor.getNode());
    if (anchorBoxRoot) {
      newSelection.anchor.set(
        anchorBoxRoot.getKey(),
        isSelectionBackward ? anchorBoxRoot.getChildrenSize() : 0,
        "element",
      );
    }
  }

  // Handle focus node
  if ($isPointWithinBoxNode(focus)) {
    const focusBoxRoot = $getBoxRootByGroupNode(focus.getNode());
    if (focusBoxRoot) {
      if (isSelectionBackward) {
        if (isBackward) {
          newSelection.focus.set(focusBoxRoot.getKey(), 0, "element");
        } else {
          const nextSibling = focusBoxRoot.getNextSibling();
          if (nextSibling === null) {
            return false;
          }
          const isSiblingElementNode = $isElementNode(nextSibling);
          newSelection.focus.set(
            nextSibling.getKey(),
            0,
            isSiblingElementNode ? "element" : "text",
          );
        }
      } else {
        if (isBackward) {
          const prevSibling = focusBoxRoot.getPreviousSibling();
          if (prevSibling === null) {
            return false;
          }
          const isSiblingElementNode = $isElementNode(prevSibling);
          newSelection.focus.set(
            prevSibling.getKey(),
            isSiblingElementNode
              ? prevSibling.getChildrenSize()
              : prevSibling.getTextContentSize(),
            isSiblingElementNode ? "element" : "text",
          );
        } else {
          newSelection.focus.set(
            focusBoxRoot.getKey(),
            focusBoxRoot.getChildrenSize(),
            "element",
          );
        }
      }
    }
  }

  if (!newSelection.is(selection)) {
    $setSelection(newSelection);
    return true;
  }

  return false;
}

function $isPartialSelectionInBox(selection: RangeSelection) {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  return !($isBoxTextNode(anchorNode) && anchorNode.is(focusNode));
}

function $isPointWithinBoxNode(point: Point) {
  const node = point.getNode();
  return (
    $isBoxGroupNode(node) &&
    !$isBoxNode(node) &&
    !(
      $isBoxBoundaryNode(node) &&
      !node.isInner() &&
      node.getIndexWithinParent() === 2 &&
      point.offset === 1
    ) &&
    !(
      $isBoxBoundaryNode(node) &&
      !node.isInner() &&
      node.getIndexWithinParent() === 0 &&
      point.offset === 0
    )
  );
}

export function $handlePointerSelectionOnBox(selection: RangeSelection) {
  if (selection.isCollapsed()) {
    return false;
  }

  // No need to expand the selection if anchor or focus is within the same box node.
  if (!$isPartialSelectionInBox(selection)) {
    return false;
  }

  const { anchor, focus } = selection;

  const isSelectionBackward = selection.isBackward();
  const newSelection = selection.clone();

  // Handle anchor node
  if ($isPointWithinBoxNode(anchor)) {
    const anchorBoxRoot = $getBoxRootByGroupNode(anchor.getNode());
    if (anchorBoxRoot) {
      newSelection.anchor.set(
        anchorBoxRoot.getKey(),
        isSelectionBackward ? anchorBoxRoot.getChildrenSize() : 0,
        "element",
      );
    }
  }

  // Handle focus node
  if ($isPointWithinBoxNode(focus)) {
    const focusBoxRoot = $getBoxRootByGroupNode(focus.getNode());
    if (focusBoxRoot) {
      newSelection.focus.set(
        focusBoxRoot.getKey(),
        isSelectionBackward ? 0 : focusBoxRoot.getChildrenSize(),
        "element",
      );
    }
  }

  if (!newSelection.is(selection)) {
    $setSelection(newSelection);
    return true;
  }

  return false;
}
