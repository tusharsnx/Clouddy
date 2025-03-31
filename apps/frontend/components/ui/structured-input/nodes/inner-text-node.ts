import { type SerializedTextNode, TextNode } from "lexical";
import {
  $getBoxGroupNodesByBoxKey,
  $getBoxKey,
} from "#/components/ui/structured-input/nodes/helpers";

type SerializedBoxInnerTextNode = SerializedTextNode;

export class BoxTextNode extends TextNode {
  #type = "box-inner-text-node";

  getContentKey(): string {
    return this.__key;
  }

  remove(preserveEmptyParent?: boolean): void {
    // A Box group is only valid when there's some text in the inner
    // text node. So, remove the root node along with the inner text
    // node.
    const boxKey = $getBoxKey(this);
    const otherBoxNodes = boxKey ? $getBoxGroupNodesByBoxKey(boxKey) : [];
    for (const node of otherBoxNodes) {
      node.internalRemove(preserveEmptyParent);
    }
  }

  internalRemove(preserveEmptyParent?: boolean) {
    super.remove(preserveEmptyParent);
  }

  static getType(): string {
    return "box-inner-text";
  }

  static clone(node: BoxTextNode): BoxTextNode {
    return new BoxTextNode(node.__text, node.__key);
  }

  static importJSON(serialized: SerializedBoxInnerTextNode): BoxTextNode {
    return $createBoxTextNode(serialized.text).updateFromJSON(serialized);
  }
}

export function $createBoxTextNode(text: string): BoxTextNode {
  return new BoxTextNode(text);
}

export function $isBoxTextNode(node: unknown): node is BoxTextNode {
  return node instanceof BoxTextNode;
}
