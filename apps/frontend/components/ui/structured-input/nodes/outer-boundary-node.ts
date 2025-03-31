import {
  type EditorConfig,
  type LexicalEditor,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from "lexical";
import { ShowBoundaries } from "#/components/ui/structured-input/nodes/box-node";

type BoxOuterBoundaryNodePosition = "front" | "back";
type SerializedBoxOuterBoundaryNode = Spread<
  { pos: BoxOuterBoundaryNodePosition },
  SerializedTextNode
>;

export class BoxOuterBoundaryNode extends TextNode {
  #type = "box-outer-boundary";
  #pos: BoxOuterBoundaryNodePosition;

  constructor(pos: BoxOuterBoundaryNodePosition, key?: NodeKey) {
    super(ShowBoundaries ? "|" : "\u200B", key);
    this.#pos = pos;
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
    return "box-outer-boundary";
  }

  static clone(node: BoxOuterBoundaryNode): BoxOuterBoundaryNode {
    return new BoxOuterBoundaryNode(node.#pos, node.__key);
  }

  exportJSON(): SerializedBoxOuterBoundaryNode {
    return {
      ...super.exportJSON(),
      pos: this.#pos,
    };
  }

  static importJSON(
    serialized: SerializedBoxOuterBoundaryNode,
  ): BoxOuterBoundaryNode {
    return $createBoxOuterBoundaryNode(serialized.pos).updateFromJSON(
      serialized,
    );
  }

  isFrontBoundary() {
    return this.#pos === "front";
  }
}

export function $createBoxOuterBoundaryNode(
  pos: BoxOuterBoundaryNodePosition,
): BoxOuterBoundaryNode {
  return new BoxOuterBoundaryNode(pos);
}

export function $isBoxOuterBoundaryNode(
  node: unknown,
): node is BoxOuterBoundaryNode {
  return node instanceof BoxOuterBoundaryNode;
}
