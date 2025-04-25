import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type JSX, useEffect } from "react";
import { registerBoxPluginHandlers } from "#/components/ui/structured-input/box-node-plugin-helpers";
import { BoxNodeTypes } from "#/components/ui/structured-input/nodes/helpers";

export default function BoxNodePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([...BoxNodeTypes])) {
      throw new Error("BoxNode: BoxNode is not registered in the editor");
    }
    return registerBoxPluginHandlers(editor);
  }, [editor]);

  return null;
}
