import { type SerializedTextNode, TextNode } from "lexical";

type SerializedBoxTextNode = SerializedTextNode;

export class BoxTextNode extends TextNode {
  static #type = "box-text";

  static getType(): string {
    return BoxTextNode.#type;
  }

  static clone(node: BoxTextNode): BoxTextNode {
    return new BoxTextNode(node.__text, node.__key);
  }

  static importJSON(serialized: SerializedBoxTextNode): BoxTextNode {
    return $createBoxTextNode(serialized.text).updateFromJSON(serialized);
  }
}

export function $createBoxTextNode(text: string): BoxTextNode {
  return new BoxTextNode(text);
}

export function $isBoxTextNode(node: unknown): node is BoxTextNode {
  return node instanceof BoxTextNode;
}
