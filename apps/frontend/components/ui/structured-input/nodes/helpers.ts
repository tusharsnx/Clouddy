import { $findMatchingParent } from "@lexical/utils";
import {
  $getNodeByKey,
  $setSelection,
  type LexicalNode,
  type NodeKey,
  type PointType,
  type RangeSelection,
} from "lexical";
import {
  $isBoxBoundaryNode,
  BoxBoundaryNode,
} from "#/components/ui/structured-input/nodes/box-boundary-node";
import {
  $isBoxContentNode,
  BoxContentNode,
} from "#/components/ui/structured-input/nodes/box-content-node";
import {
  $isBoxNode,
  BoxNode,
} from "#/components/ui/structured-input/nodes/box-node";
import {
  $isBoxTextNode,
  BoxTextNode,
} from "#/components/ui/structured-input/nodes/box-text-node";

/**
 * Returns the box key of the group this node belongs to.
 * A box key is shared by all the box nodes belonging to the group.
 */
export function $getBoxKey(node: LexicalNode): string | undefined {
  return $getBoxRootByGroupNode(node)?.getKey();
}

/**
 * Returns the box root node of the group a given node belongs to.
 * A box key is shared by all the box nodes belonging to the group.
 */
export function $getBoxRootByGroupNode(node: LexicalNode): BoxNode | null {
  return $findMatchingParent(node, (node) => $isBoxNode(node));
}

export function $getBoxRootByBoxKey(boxNodeKey: NodeKey): BoxNode | null {
  const node = $getNodeByKey(boxNodeKey);
  return $isBoxNode(node) ? node : null;
}

export const BoxNodeTypes = [
  BoxNode,
  BoxContentNode,
  BoxBoundaryNode,
  BoxTextNode,
] as const;

export type BoxGroupNodes = (typeof BoxNodeTypes)[number];

export function $isBoxGroupNode(node: unknown): node is BoxGroupNodes {
  return (
    $isBoxNode(node) ||
    $isBoxContentNode(node) ||
    $isBoxBoundaryNode(node) ||
    $isBoxTextNode(node)
  );
}

export function shouldSkipPoint(point: PointType) {
  const node = point.getNode();
  const { offset } = point;

  const canPlaceCaretHere = $isBoxBoundaryNode(node)
    ? (offset === 0 && node.canPlaceCaretBefore()) ||
      (offset === node.getTextContentSize() && node.canPlaceCaretAfter())
    : true;
  return !canPlaceCaretHere;
}

export function $getNextCharacterNode(
  selection: RangeSelection,
  isBackward: boolean,
) {
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
