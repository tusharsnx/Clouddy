import {
  type EditorConfig,
  ElementNode,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from "lexical";
import { $insertAfterBox } from "#/components/ui/structured-input/nodes/helpers";

type SerializedBoxInnerNode = Spread<
  { className?: string },
  SerializedElementNode
>;

export class BoxInnerNode extends ElementNode {
  #type = "box-inner-node";
  #className?: string;

  constructor(className?: string, key?: NodeKey) {
    super(key);
    this.#className = className;
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("span");
    if (this.#className) {
      dom.setAttribute("class", this.#className);
    }
    return dom;
  }

  updateDOM(
    _prevNode: unknown,
    _dom: HTMLElement,
    _config: EditorConfig,
  ): boolean {
    return false;
  }

  canBeEmpty(): false {
    return false;
  }

  canIndent(): false {
    return false;
  }

  canMergeWhenEmpty(): false {
    return false;
  }

  isInline(): true {
    return true;
  }

  // When a controlled insertion happens on a BoxTextNode, the outside
  // stuff is merged inside its parent, which is a BoxInnerNode. To preserve
  // the BoxNode's structure, insert the new node after the BoxNode that
  // contains this BoxInnerNode.
  insertAfter(
    nodeToInsert: LexicalNode,
    restoreSelection?: boolean,
  ): LexicalNode {
    return $insertAfterBox(this, nodeToInsert, restoreSelection);
  }

  // Make this node unremoval
  remove(preserveEmptyParent?: boolean): void {
    // no-op
  }

  internalRemove(preserveEmptyParent?: boolean): void {
    super.remove(preserveEmptyParent);
  }

  static getType(): string {
    return "box-inner";
  }

  static clone(node: BoxInnerNode): BoxInnerNode {
    return new BoxInnerNode(node.#className, node.__key);
  }

  exportJSON(): SerializedBoxInnerNode {
    return {
      ...super.exportJSON(),
      className: this.#className,
    };
  }

  static importJSON(serialized: SerializedBoxInnerNode): BoxInnerNode {
    return $createBoxInnerNode(serialized.className).updateFromJSON(serialized);
  }
}

export function $createBoxInnerNode(className?: string): BoxInnerNode {
  return new BoxInnerNode(className);
}

export function $isBoxInnerNode(node: unknown): node is BoxInnerNode {
  return node instanceof BoxInnerNode;
}
