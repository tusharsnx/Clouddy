import {
  $getHtmlContent,
  $getLexicalContent,
  setLexicalClipboardDataTransfer,
} from "@lexical/clipboard";
import { mergeRegister } from "@lexical/utils";
import {
  $handleSelectionOnBox,
  $skipBoxNodesBeforeDeletion,
  getSelectionTextContent,
  getTextContentNodeSelection,
} from "#/components/ui/structured-input/selection";

import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  CUT_COMMAND,
  type CommandPayloadType,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { BoxContentNode } from "#/components/ui/structured-input/nodes/box-content-node";
import { $getBoxRootByGroupNode } from "#/components/ui/structured-input/nodes/helpers";

type SelectionState = {
  granularity: "character" | "word";
  isBackward?: boolean;
};

type BoxPluginState = {
  getSelectionState: () => SelectionState | null;
  setSelectionState: (state: SelectionState) => void;
  clearSelectionState: () => void;
};

export function registerBoxPluginHandlers(editor: LexicalEditor) {
  const pluginState = initPluginState();

  const unregisterCommandListeners = registerCommandListeners(
    editor,
    pluginState,
  );
  const unregisterEventHandlers = registerEventHandlers(editor, pluginState);
  const unregisterNodeTransform = registerNodeTransforms(editor, pluginState);

  return () => {
    unregisterNodeTransform();
    unregisterCommandListeners();
    unregisterEventHandlers?.();
  };
}

function initPluginState(): BoxPluginState {
  let selectionState: SelectionState | null = null;

  return {
    getSelectionState: () => {
      const curr = selectionState;
      selectionState = null;
      return curr;
    },
    setSelectionState: (state: SelectionState) => {
      selectionState = state;
    },
    clearSelectionState: () => {
      selectionState = null;
    },
  };
}

function registerCommandListeners(
  editor: LexicalEditor,
  pluginState: BoxPluginState,
) {
  const onCopyForPlainText = (
    event: CommandPayloadType<typeof COPY_COMMAND>,
    editor: LexicalEditor,
  ): boolean => {
    const selection = $getSelection();
    if (selection === null || !$isRangeSelection(selection)) {
      return false;
    }

    if (!(event instanceof ClipboardEvent) || event.clipboardData === null) {
      return false;
    }

    event.preventDefault();

    const htmlString = $getHtmlContent(editor);
    const lexicalContent = $getLexicalContent(editor, selection);
    const textContent = $isRangeSelection(selection)
      ? getSelectionTextContent(selection)
      : getTextContentNodeSelection(selection);

    setLexicalClipboardDataTransfer(event.clipboardData, {
      "text/plain": textContent,
      "text/html": htmlString,
      "application/x-lexical-editor": lexicalContent ?? undefined,
    });

    return true;
  };

  const onCutForPlainText = (event: CommandPayloadType<typeof CUT_COMMAND>) => {
    const skipNext = onCopyForPlainText(event, editor);
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      selection.removeText();
    }

    return skipNext;
  };

  const onDelete = (isBackward: boolean) => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return false;
    }

    // Skip skip'ble box nodes to prevent them from getting deleted.
    // Note: Only do this when selection is collapsed. A "dom" range
    // selection (non-collapsed) either contains full box-nodes, or is
    // within a single BoxTextNode, none of which requires special
    // case handling. See onSelectionChange.
    $skipBoxNodesBeforeDeletion(selection, isBackward);

    return false;
  };

  const onSelectionChange = () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const selectionState = pluginState.getSelectionState();
    if (!selectionState) {
      return false;
    }

    return $handleSelectionOnBox(
      selection,
      selectionState.granularity,
      selectionState.isBackward,
    );
  };

  return mergeRegister(
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      onSelectionChange,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      INSERT_LINE_BREAK_COMMAND,
      // disable line breaks
      () => true,
      COMMAND_PRIORITY_CRITICAL,
    ),
    editor.registerCommand(
      COPY_COMMAND,
      onCopyForPlainText,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      CUT_COMMAND,
      onCutForPlainText,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      onDelete,
      COMMAND_PRIORITY_CRITICAL,
    ),
    editor.registerCommand(
      DELETE_WORD_COMMAND,
      onDelete,
      COMMAND_PRIORITY_CRITICAL,
    ),
  );
}

function registerEventHandlers(
  editor: LexicalEditor,
  pluginState: BoxPluginState,
) {
  const root = editor.getRootElement();
  if (!root) {
    return;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (key !== "ArrowRight" && key !== "ArrowLeft") {
      pluginState.clearSelectionState();
      return;
    }

    pluginState.setSelectionState({
      granularity: event.ctrlKey ? "word" : "character",
      isBackward: key === "ArrowLeft",
    });
  };

  const onPointerUp = (event: PointerEvent) => {
    // No-op if this is not from the main MB.
    if (event.button !== 0) {
      return;
    }

    pluginState.setSelectionState({ granularity: "character" });

    // Dispatch a selection change command so our callback is called to
    // make required changes to the current selection. Also, do this
    // only for "mouse" type since this is automatically done by the
    // browser for touch devices.
    if (event.pointerType === "mouse") {
      editor.dispatchCommand(SELECTION_CHANGE_COMMAND, undefined);
    }
  };

  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("pointerup", onPointerUp);
  return () => {
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("pointerup", onPointerUp);
  };
}

function registerNodeTransforms(
  editor: LexicalEditor,
  pluginState: BoxPluginState,
) {
  return mergeRegister(
    editor.registerNodeTransform(BoxContentNode, (node) => {
      const nBoxContentNodeChild = node.getChildrenSize();
      if (nBoxContentNodeChild >= 2) return;
      // Less than 2 children. Clean up this BoxNode group.
      const boxRoot = $getBoxRootByGroupNode(node);
      if (!boxRoot) return;
      boxRoot.remove();
    }),
  );
}
