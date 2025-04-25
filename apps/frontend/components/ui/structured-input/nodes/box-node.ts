import {
  type EditorConfig,
  ElementNode,
  type SerializedElementNode,
} from "lexical";
import { $createBoxBoundaryNode } from "#/components/ui/structured-input/nodes/box-boundary-node";
import { $createBoxContentNode } from "#/components/ui/structured-input/nodes/box-content-node";
import { $createBoxTextNode } from "#/components/ui/structured-input/nodes/box-text-node";

type SerializedBoxNode = SerializedElementNode;

// Use this to toggle boundary visibility in the UI
export const ShowBoundaries = true;

export class BoxNode extends ElementNode {
  static #type = "box";

  createDOM(): HTMLElement {
    const dom = document.createElement("span");
    dom.dataset.lexical = "box";
    return dom;
  }

  updateDOM(
    _prevNode: unknown,
    _dom: HTMLElement,
    _config: EditorConfig,
  ): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canMergeWhenEmpty(): boolean {
    return false;
  }

  isInline(): true {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  canIndent(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedBoxNode): BoxNode {
    return $createBoxNode().updateFromJSON(serializedNode);
  }

  static getType(): string {
    return BoxNode.#type;
  }

  static clone(node: BoxNode): BoxNode {
    return new BoxNode(node.__key);
  }
}

export function $createBoxGroup(text: string, className?: string): BoxNode {
  const boxNode = $createBoxNode();
  const outerBeforeBoundaryNode = $createBoxBoundaryNode("outer-before");
  const outerAfterBoundaryNode = $createBoxBoundaryNode("outer-after");
  const innerBoundaryNode = $createBoxBoundaryNode("inner");
  const textNode = $createBoxTextNode(text);
  const boxContentNode = $createBoxContentNode(className);

  boxContentNode.append(innerBoundaryNode, textNode);
  boxNode.append(
    outerBeforeBoundaryNode,
    boxContentNode,
    outerAfterBoundaryNode,
  );

  return boxNode;
}

export function $createBoxNode(): BoxNode {
  return new BoxNode();
}

export function $isBoxNode(node: unknown): node is BoxNode {
  return node instanceof BoxNode;
}
