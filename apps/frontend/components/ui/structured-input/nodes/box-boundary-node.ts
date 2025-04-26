import {
  type EditorConfig,
  type LexicalEditor,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from "lexical";

const ShowBoundary = false;

type BoxBoundaryType = "outer-before" | "outer-after" | "inner";
type SerializedBoxBoundaryNode = Spread<
  { boundaryType: BoxBoundaryType },
  SerializedTextNode
>;

export class BoxBoundaryNode extends TextNode {
  static #type = "box-boundary";
  #boundaryType: BoxBoundaryType;

  constructor(type: BoxBoundaryType, key?: NodeKey) {
    super(ShowBoundary ? "|" : "\u200B", key);
    this.#boundaryType = type;
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    if (ShowBoundary) {
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

  isInner(): boolean {
    return this.#boundaryType === "inner";
  }

  canPlaceCaretBefore(): boolean {
    switch (this.#boundaryType) {
      case "outer-before":
        return true;
      case "outer-after":
        return false;
      case "inner":
        return false;
      default:
        return false;
    }
  }

  canPlaceCaretAfter(): boolean {
    switch (this.#boundaryType) {
      case "outer-before":
        return false;
      case "outer-after":
        return true;
      case "inner":
        return true;
      default:
        return false;
    }
  }

  static getType(): string {
    return BoxBoundaryNode.#type;
  }

  static clone(node: BoxBoundaryNode): BoxBoundaryNode {
    return new BoxBoundaryNode(node.#boundaryType, node.__key);
  }

  exportJSON(): SerializedBoxBoundaryNode {
    return {
      ...super.exportJSON(),
      boundaryType: this.#boundaryType,
    };
  }

  static importJSON(serialized: SerializedBoxBoundaryNode): BoxBoundaryNode {
    return $createBoxBoundaryNode(serialized.boundaryType).updateFromJSON(
      serialized,
    );
  }
}

export function $createBoxBoundaryNode(type: BoxBoundaryType): BoxBoundaryNode {
  return new BoxBoundaryNode(type);
}

export function $isBoxBoundaryNode(node: unknown): node is BoxBoundaryNode {
  return node instanceof BoxBoundaryNode;
}
