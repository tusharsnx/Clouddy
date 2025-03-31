import { $getNodeByKey, type NodeKey } from "lexical";
import {
  $isBoxNode,
  type BoxNode,
} from "#/components/ui/structured-input/nodes/box-node";
import {
  $isBoxInnerBoundaryNode,
  type BoxInnerBoundaryNode,
} from "#/components/ui/structured-input/nodes/inner-boundary-node";
import {
  $isBoxInnerNode,
  type BoxInnerNode,
} from "#/components/ui/structured-input/nodes/inner-node";
import {
  $isBoxTextNode,
  type BoxTextNode,
} from "#/components/ui/structured-input/nodes/inner-text-node";
import {
  $isBoxOuterBoundaryNode,
  type BoxOuterBoundaryNode,
} from "#/components/ui/structured-input/nodes/outer-boundary-node";

type BoxGroupNode =
  | BoxNode
  | BoxInnerNode
  | BoxOuterBoundaryNode
  | BoxInnerBoundaryNode
  | BoxTextNode;

/**
 * Returns the box key of the group this node belongs to.
 * A box key is shared by all the box nodes belonging to the group.
 */
export function $getBoxKey(node: BoxGroupNode): string | undefined {
  const boxNode = $isBoxNode(node)
    ? node
    : $isBoxOuterBoundaryNode(node) || $isBoxInnerNode(node)
      ? node.getParent()
      : $isBoxInnerBoundaryNode(node) || $isBoxTextNode(node)
        ? node.getParent()?.getParent()
        : undefined;

  // The group id of a box node group is the key of parent BoxNode.
  return $isBoxNode(boxNode) ? boxNode.getBoxKey() : undefined;
}

export function isBoxGroupNode(node: unknown): node is BoxGroupNode {
  return (
    $isBoxNode(node) ||
    $isBoxInnerNode(node) ||
    $isBoxOuterBoundaryNode(node) ||
    $isBoxInnerBoundaryNode(node) ||
    $isBoxTextNode(node)
  );
}

export function isBoxBoundaryNode(node: unknown) {
  return $isBoxInnerBoundaryNode(node) || $isBoxOuterBoundaryNode(node);
}

export function $getBoxGroupNodesByBoxKey(key: NodeKey): BoxGroupNode[] {
  const nodes: (unknown | null)[] = [];
  const boxNode = $getNodeByKey(key);
  if ($isBoxNode(boxNode)) {
    const boxOuterBoundaryNodeFront = boxNode?.getFirstChild();
    const boxOuterBoundaryNodeBack = boxNode?.getLastChild();
    const boxInnerNode = boxOuterBoundaryNodeFront?.getNextSibling() ?? null;

    nodes.push(
      boxOuterBoundaryNodeFront,
      boxOuterBoundaryNodeBack,
      boxInnerNode,
    );

    if ($isBoxInnerNode(boxInnerNode)) {
      const boxInnerBoundaryNode = boxInnerNode?.getFirstChild() ?? null;
      const boxInnerTextNode = boxInnerBoundaryNode?.getNextSibling() ?? null;
      nodes.push(boxInnerBoundaryNode, boxInnerTextNode);
    }
  }

  // Always return the deepest children first
  return nodes.filter((node) => isBoxGroupNode(node)).reverse();
}
