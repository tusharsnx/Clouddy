import { $moveCaretSelection, $moveCharacter } from "@lexical/selection";
import {
  $getCharacterOffsets,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  $setSelection,
  type NodeSelection,
  type RangeSelection,
} from "lexical";
import { $isBoxBoundaryNode } from "#/components/ui/structured-input/nodes/box-boundary-node";
import { $isBoxTextNode } from "#/components/ui/structured-input/nodes/box-text-node";
import {
  $getBoxRootByGroupNode,
  $getNextCharacterNode,
  $isBoxGroupNode,
  shouldSkipPoint,
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
 * @param granularity The level of modification to apply.
 * @param isBackward The direction in which selection needs to be modified.
 * @returns True, if caret was moved at all, else False.
 */
export function $handleSelectionOnBox(
  selection: RangeSelection,
  granularity: "character" | "word",
  isBackward?: boolean,
) {
  return selection.isCollapsed()
    ? $handleCaretSelection(selection, granularity, isBackward)
    : $handleRangeSelection(selection, isBackward);
}

function $handleRangeSelection(
  selection: RangeSelection,
  isBackward?: boolean,
): boolean {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  // No modification is required if both the anchor and focus are within the same BoxTextNode.
  if ($isBoxTextNode(anchorNode) && anchorNode.is(focusNode)) {
    return false;
  }

  const newSelection = selection.clone();
  const isSelectionBackward = selection.isBackward();

  // Handle anchor node
  if ($isBoxGroupNode(anchorNode)) {
    const anchorBoxRoot = $getBoxRootByGroupNode(anchorNode);
    if (anchorBoxRoot) {
      newSelection.anchor.set(
        anchorBoxRoot.getKey(),
        isSelectionBackward ? anchorBoxRoot.getChildrenSize() : 0,
        "element",
      );
    }
  }

  const expandSelection =
    isBackward === undefined || isBackward === isSelectionBackward;

  // Handle focus node
  if ($isBoxGroupNode(focusNode)) {
    const focusBoxRoot = $getBoxRootByGroupNode(focusNode);
    if (focusBoxRoot) {
      if (expandSelection) {
        newSelection.focus.set(
          focusBoxRoot.getKey(),
          isSelectionBackward ? 0 : focusBoxRoot.getChildrenSize(),
          "element",
        );
      } else {
        const sibling = isSelectionBackward
          ? focusBoxRoot.getNextSibling()
          : focusBoxRoot.getPreviousSibling();
        if (sibling === null) {
          return false;
        }

        const isSiblingElementNode = $isElementNode(sibling);
        const key = sibling.getKey();
        const offset = isSelectionBackward
          ? // Move focus to the next sibling's first offset.
            0
          : // Move focus to the previous sibling's last (child) offset.
            isSiblingElementNode
            ? sibling.getChildrenSize()
            : sibling.getTextContentSize();
        const type = isSiblingElementNode ? "element" : "text";
        newSelection.focus.set(key, offset, type);
      }
    }
  }

  if (!newSelection.is(selection)) {
    $setSelection(newSelection);
    return true;
  }

  return false;
}

// Todo: Try with $extendCaretToRange()
function $handleCaretSelection(
  selection: RangeSelection,
  granularity: "character" | "word",
  isBackward = true,
): boolean {
  if (!selection.isCollapsed()) {
    return false;
  }

  const newSelection: RangeSelection = selection.clone();

  // This is to track when selection stops moving so we can stop the
  // loop and avoid running it endlessly. This happens when we've
  // reached the end of the text.
  let lastSelection: RangeSelection | null = null;

  while (
    shouldSkipPoint(newSelection.focus) &&
    !newSelection.is(lastSelection)
  ) {
    lastSelection = newSelection.clone();
    $moveCaretSelection(newSelection, false, isBackward, granularity);
  }

  if (!newSelection.is(selection)) {
    $setSelection(newSelection);
    return true;
  }

  return false;
}
