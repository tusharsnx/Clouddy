import {
  type EditorConfig,
  ElementNode,
  type SerializedElementNode,
} from "lexical";
import { $createBoxInnerBoundaryNode } from "#/components/ui/structured-input/nodes/inner-boundary-node";
import { $createBoxInnerNode } from "#/components/ui/structured-input/nodes/inner-node";
import { $createBoxTextNode } from "#/components/ui/structured-input/nodes/inner-text-node";
import { $createBoxOuterBoundaryNode } from "#/components/ui/structured-input/nodes/outer-boundary-node";

type SerializedBoxNode = SerializedElementNode;

// Use this to toggle boundary visibility in the UI
export const ShowBoundaries = true;

export class BoxNode extends ElementNode {
  #type = "box-node";

  createDOM(): HTMLElement {
    return document.createElement("span");
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

  internalRemove(preserveEmptyParent?: boolean): void {
    this.remove(preserveEmptyParent);
  }

  static importJSON(serializedNode: SerializedBoxNode): BoxNode {
    return $createBoxNode().updateFromJSON(serializedNode);
  }

  static getType(): string {
    return "box";
  }

  static clone(node: BoxNode): BoxNode {
    return new BoxNode(node.__key);
  }

  getBoxKey(): string {
    return this.__key;
  }
}

export function $createBoxGroup(text: string, className?: string): BoxNode {
  const boxNode = $createBoxNode();
  const outerFrontBoundaryNode = $createBoxOuterBoundaryNode("front");
  const outerBackBoundaryNode = $createBoxOuterBoundaryNode("back");
  const innerBoundaryNode = $createBoxInnerBoundaryNode();
  const textNode = $createBoxTextNode(text);
  const boxInnerNode = $createBoxInnerNode(className);

  boxInnerNode.append(innerBoundaryNode, textNode);
  boxNode.append(outerFrontBoundaryNode, boxInnerNode, outerBackBoundaryNode);

  return boxNode;
}

export function $createBoxNode(): BoxNode {
  return new BoxNode();
}

export function $isBoxNode(node: unknown): node is BoxNode {
  return node instanceof BoxNode;
}
