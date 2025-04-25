import {
  type EditorConfig,
  ElementNode,
  type LexicalEditor,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from "lexical";

type SerializedBoxContentNode = Spread<
  { className?: string },
  SerializedElementNode
>;

export class BoxContentNode extends ElementNode {
  static #type = "box-content";
  #className?: string;

  constructor(className?: string, key?: NodeKey) {
    super(key);
    this.#className = className;
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("span");
    dom.dataset.lexical = "box-content";
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

  static getType(): string {
    return BoxContentNode.#type;
  }

  static clone(node: BoxContentNode): BoxContentNode {
    return new BoxContentNode(node.#className, node.__key);
  }

  exportJSON(): SerializedBoxContentNode {
    return {
      ...super.exportJSON(),
      className: this.#className,
    };
  }

  static importJSON(serialized: SerializedBoxContentNode): BoxContentNode {
    return $createBoxContentNode(serialized.className).updateFromJSON(
      serialized,
    );
  }
}

export function $createBoxContentNode(className?: string): BoxContentNode {
  return new BoxContentNode(className);
}

export function $isBoxContentNode(node: unknown): node is BoxContentNode {
  return node instanceof BoxContentNode;
}
