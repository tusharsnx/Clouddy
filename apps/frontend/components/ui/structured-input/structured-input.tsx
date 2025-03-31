import {
  type InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { $createParagraphNode, $getRoot, type LexicalNode } from "lexical";
import { useEffect } from "react";
import BoxNodePlugin from "#/components/ui/structured-input/box-node-plugin";
import FileTagPlugin from "#/components/ui/structured-input/file-tag-plugin";
import { BoxNode } from "#/components/ui/structured-input/nodes/box-node";
import { $createFileTagNode } from "#/components/ui/structured-input/nodes/file-tag-node";
import { BoxInnerBoundaryNode } from "#/components/ui/structured-input/nodes/inner-boundary-node";
import { BoxInnerNode } from "#/components/ui/structured-input/nodes/inner-node";
import { BoxTextNode } from "#/components/ui/structured-input/nodes/inner-text-node";
import { BoxOuterBoundaryNode } from "#/components/ui/structured-input/nodes/outer-boundary-node";
import { theme } from "#/components/ui/structured-input/theme";
import { cn } from "#/lib/utils";

export default function TreeViewPlugin() {
  const [editor] = useLexicalComposerContext();
  return (
    <div>
      <TreeView
        viewClassName="absolute my-4 w-full text-[0.75rem] border-2 rounded-lg p-2 [&>pre]:border-2 [&>pre]:rounded-lg [&>pre]:p-2 [&>pre]:my-2 [&>pre]:bg-white/10"
        treeTypeButtonClassName="me-2 px-2 py-1 border-2 rounded-lg"
        timeTravelPanelClassName="p-2 border-2 rounded-lg flex items-center space-x-2"
        timeTravelButtonClassName="px-2 py-1 border-2 rounded-lg"
        timeTravelPanelSliderClassName=""
        timeTravelPanelButtonClassName="px-2 py-1 border-2 rounded-lg"
        editor={editor}
      />
    </div>
  );
}

const initialLexicalConfig: InitialConfigType = {
  theme,
  nodes: [
    BoxNode,
    BoxOuterBoundaryNode,
    BoxInnerNode,
    BoxInnerBoundaryNode,
    BoxTextNode,
  ],
  namespace: "structured-input",
  onError: (error) => {
    console.error(error);
  },
};

function LexicalContentEditable() {
  return (
    // These styles position <Placeholder> on top of <ContentEditable>
    // to mimic an <input>)
    <div className="grid [&>*]:row-start-1 [&>*]:col-start-1">
      <PlainTextPlugin
        contentEditable={<ContentEditable className="outline-none" />}
        placeholder={
          <div className="text-white/40 text-base pointer-events-none">
            Search files
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
    </div>
  );
}

function LexicalPlugins() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let insertedNode: LexicalNode | null = null;

    editor.update(() => {
      const root = $getRoot();
      const paragraphNode = $createParagraphNode();
      root.clear().append(paragraphNode);
      paragraphNode.append(
        $createFileTagNode("project"),
        $createFileTagNode("clouddy"),
      );
      insertedNode = paragraphNode;
    });

    return () => {
      editor.update(() => {
        insertedNode?.remove();
      });
    };
  }, [editor]);

  return (
    <>
      <HistoryPlugin />
      <TreeViewPlugin />
      <BoxNodePlugin />
      <FileTagPlugin />
    </>
  );
}

export function StructuredInput({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <LexicalComposer initialConfig={initialLexicalConfig}>
        <LexicalContentEditable />
        <LexicalPlugins />
      </LexicalComposer>
    </div>
  );
}
