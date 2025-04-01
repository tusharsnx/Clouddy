import {
  $getHtmlContent,
  $getLexicalContent,
  setLexicalClipboardDataTransfer,
} from "@lexical/clipboard";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  CUT_COMMAND,
  type CommandPayloadType,
  DELETE_CHARACTER_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { type JSX, useEffect, useRef } from "react";
import {
  $modifySelection,
  $skipBoxNodesForDeletion as $skipBoxNodeDeletion,
} from "#/components/ui/structured-input/caret";
import { BoxNode } from "#/components/ui/structured-input/nodes/box-node";
import {
  $removeSelectedText,
  getTextContentNodeSelection,
  getTextContentRangeSelection,
} from "#/components/ui/structured-input/selection";

type SelectionEvent = {
  granularity: "character" | "word";
  isBackward: boolean;
};

export default function BoxNodePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const selectionEventRef = useRef<SelectionEvent | null>(null);

  const setSelectionEvent = (
    granularity: SelectionEvent["granularity"],
    isBackward: SelectionEvent["isBackward"],
  ) => {
    selectionEventRef.current = {
      granularity,
      isBackward,
    };
  };

  const readSelectionEvent = () => {
    const selectionEvent = selectionEventRef.current;
    // Reset after each read.
    selectionEventRef.current = null;
    return selectionEvent;
  };

  function onCopyForPlainText(
    event: CommandPayloadType<typeof COPY_COMMAND>,
    editor: LexicalEditor,
  ): boolean {
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
      ? getTextContentRangeSelection(selection)
      : getTextContentNodeSelection(selection);

    setLexicalClipboardDataTransfer(event.clipboardData, {
      "text/plain": textContent,
      "text/html": htmlString,
      "application/x-lexical-editor": lexicalContent ?? undefined,
    });

    return true;
  }

  function onCutForPlainText(
    event: CommandPayloadType<typeof CUT_COMMAND>,
    editor: LexicalEditor,
  ): boolean {
    const skipNext = onCopyForPlainText(event, editor);
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      selection.removeText();
    }

    return skipNext;
  }

  function onDeleteCharacter(isBackward: boolean) {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return false;
    }

    if (selection.isCollapsed()) {
      // Skip box nodes ahead of the next "real" character.
      $skipBoxNodeDeletion(selection, isBackward);
      // Let lexical handle the actual deletion.
      return false;
    }

    return $removeSelectedText(selection);
  }

  function onSelectionChange() {
    const selection = $getSelection();
    const event = readSelectionEvent();
    if ($isRangeSelection(selection) && event !== null) {
      return $modifySelection(selection, event.isBackward, event.granularity);
    }

    return false;
  }

  function onPointerUp() {
    editor.update(
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $modifySelection(selection, true, "character");
        }
      },
      // Skip transforms for this update since we don't make any changes
      // to the nodes
      { skipTransforms: true },
    );
  }

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const isWordSelection =
      (key === "ArrowLeft" || key === "ArrowRight") && event.ctrlKey;
    if (isWordSelection) {
      setSelectionEvent("word", key === "ArrowLeft");
    }
  }

  useEffect(
    () => {
      if (!editor.hasNodes([BoxNode])) {
        throw new Error("BoxNode: BoxNode is not registered in the editor");
      }

      // Todo: Interesting commands left to be considered:
      // - Select word/line
      // - CONTROLLED_TEXT_INSERTION_COMMAND
      return mergeRegister(
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          onSelectionChange,
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_ARROW_LEFT_COMMAND,
          () => {
            setSelectionEvent("character", true);
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_ARROW_RIGHT_COMMAND,
          () => {
            setSelectionEvent("character", false);
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          INSERT_LINE_BREAK_COMMAND,
          // disable line breaks
          () => true,
          COMMAND_PRIORITY_HIGH,
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
          onDeleteCharacter,
          COMMAND_PRIORITY_LOW,
        ),
      );
    },
    // biome-ignore format:
    // biome-ignore lint/correctness/useExhaustiveDependencies:
    [editor, onDeleteCharacter, onSelectionChange, setSelectionEvent, onCopyForPlainText, onCutForPlainText],
  );

  useEffect(
    () => {
      const root = editor.getRootElement();
      if (!root) {
        return;
      }

      root.addEventListener("pointerup", onPointerUp);
      root.addEventListener("keydown", onKeyDown);
      return () => {
        root.removeEventListener("pointerup", onPointerUp);
        root.removeEventListener("keydown", onKeyDown);
      };
    },
    // biome-ignore format:
    // biome-ignore lint/correctness/useExhaustiveDependencies:
    [editor, onPointerUp, onKeyDown],
  );

  return null;
}
