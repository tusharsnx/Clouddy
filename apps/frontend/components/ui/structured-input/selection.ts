import {
  $caretRangeFromSelection,
  $getCharacterOffsets,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  $removeTextFromCaretRange,
  $setSelection,
  $updateRangeSelectionFromCaretRange,
  type NodeSelection,
  type RangeSelection,
} from "lexical";
import { $isBoxInnerBoundaryNode } from "#/components/ui/structured-input/nodes/inner-boundary-node";
import { $isBoxOuterBoundaryNode } from "#/components/ui/structured-input/nodes/outer-boundary-node";

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
export function getTextContentRangeSelection(selection: RangeSelection) {
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
        if ($isBoxOuterBoundaryNode(node) || $isBoxInnerBoundaryNode(node)) {
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

export function $removeSelectedText(selection: RangeSelection): boolean {
  if (selection.isCollapsed()) {
    return false;
  }

  const range = $caretRangeFromSelection(selection);
  const newRange = $removeTextFromCaretRange(range);
  $updateRangeSelectionFromCaretRange(selection, newRange);
  $setSelection(selection);

  return true;
}
