import {
  type EditorConfig,
  type LexicalEditor,
  type NodeKey,
  type SerializedTextNode,
  TextNode,
} from "lexical";
import { ShowBoundaries } from "#/components/ui/structured-input/nodes/box-node";

type SerializedBoxInnerBoundaryNode = SerializedTextNode;

export class BoxInnerBoundaryNode extends TextNode {
  #type = "box-inner-boundary-node";

  constructor(key?: NodeKey) {
    super(ShowBoundaries ? "|" : "\u200B", key);
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    if (ShowBoundaries) {
      dom.style.opacity = "0.3";
    }
    return dom;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  // Make this node unremoval
  remove(preserveEmptyParent?: boolean): void {
    // no-op
  }

  internalRemove(preserveEmptyParent?: boolean): void {
    super.remove(preserveEmptyParent);
  }

  static getType(): string {
    return "inner-boundary";
  }

  static clone(node: BoxInnerBoundaryNode): BoxInnerBoundaryNode {
    return new BoxInnerBoundaryNode(node.__key);
  }

  static importJSON(
    serialized: SerializedBoxInnerBoundaryNode,
  ): BoxInnerBoundaryNode {
    return $createBoxInnerBoundaryNode().updateFromJSON(serialized);
  }
}

export function $createBoxInnerBoundaryNode(): BoxInnerBoundaryNode {
  return new BoxInnerBoundaryNode();
}

export function $isBoxInnerBoundaryNode(
  node: unknown,
): node is BoxInnerBoundaryNode {
  return node instanceof BoxInnerBoundaryNode;
}
