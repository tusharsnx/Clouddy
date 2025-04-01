import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuRenderFn,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import type { TextNode } from "lexical";
import { type JSX, useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import { $createFileTagNode } from "#/components/ui/structured-input/nodes/file-tag-node";
import { fetchFileTags } from "#/lib/file-tags";
import { cn } from "#/lib/utils";

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

const fileTagCache = new Map();

function useFileTags(tagQuery: string | null) {
  const [fileTags, setFileTags] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (tagQuery == null) {
        setFileTags([]);
        return;
      }

      const cachedResults = fileTagCache.get(tagQuery);

      if (cachedResults === null) {
        return;
      }

      if (cachedResults !== undefined) {
        setFileTags(cachedResults);
        return;
      }

      fileTagCache.set(tagQuery, null);
      const tags = await fetchFileTags(tagQuery);

      if (cancelled) {
        return;
      }

      fileTagCache.set(tagQuery, tags);
      setFileTags(tags);
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [tagQuery]);

  return fileTags
    .map((result) => new MenuOption(result))
    .slice(0, SUGGESTION_LIST_LENGTH_LIMIT);
}

type FileTagMenuProps = {
  options: MenuOption[];
  selectedIndex: number | null;
  selectOptionAndCleanUp: (option: MenuOption) => void;
  setHighlightedIndex: (index: number) => void;
};

function FileTagsMenu({
  options,
  selectedIndex,
  selectOptionAndCleanUp,
  setHighlightedIndex,
}: FileTagMenuProps) {
  return (
    <ul className="w-64 border-2 rounded-lg overflow-hidden">
      {options.map((option, i: number) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents:
        <option
          tabIndex={-1}
          aria-selected={selectedIndex === i}
          key={option.key}
          ref={option.setRefElement}
          onClick={() => {
            setHighlightedIndex(i);
            selectOptionAndCleanUp(option);
          }}
          onMouseEnter={() => setHighlightedIndex(i)}
          className={cn(
            "px-2 aria-selected:bg-gray-500",
            selectedIndex === i && "selected",
          )}
        >
          {option.key}
        </option>
      ))}
    </ul>
  );
}

export default function FileTagPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [tagQuery, setTagQuery] = useState<string | null>(null);
  const tags = useFileTags(tagQuery);
  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  function onSelectOption(
    selectedOption: MenuOption,
    nodeToReplace: TextNode | null,
    closeMenu: () => void,
  ) {
    editor.update(() => {
      const boxNode = $createFileTagNode(selectedOption.key);
      nodeToReplace?.replace(boxNode);
      // Place the caret after the new node
      boxNode.selectEnd();
      closeMenu();
    });
  }

  const renderMenu: MenuRenderFn<MenuOption> = (anchorElementRef, itemProps) =>
    tags.length && anchorElementRef.current
      ? ReactDOM.createPortal(
          <FileTagsMenu {...itemProps} />,
          anchorElementRef.current,
        )
      : null;

  return (
    <>
      <LexicalTypeaheadMenuPlugin
        options={tags}
        onQueryChange={setTagQuery}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        menuRenderFn={renderMenu}
      />
    </>
  );
}
