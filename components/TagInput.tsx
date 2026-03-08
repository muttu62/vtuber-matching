"use client";
import { useState } from "react";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
};

export default function TagInput({
  tags,
  onChange,
  placeholder = "入力してEnterで追加",
  suggestions,
  max = 10,
}: Props) {
  const [input, setInput] = useState("");

  const addTag = (value: string) => {
    const v = value.trim();
    if (!v || tags.includes(v) || tags.length >= max) return;
    onChange([...tags, v]);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
      setInput("");
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
        />
        <button
          type="button"
          onClick={() => { addTag(input); setInput(""); }}
          disabled={!input.trim() || tags.length >= max}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          追加
        </button>
      </div>

      {suggestions && suggestions.filter((s) => !tags.includes(s)).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {suggestions.filter((s) => !tags.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-full transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-white leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-gray-500 text-xs mt-1 text-right">{tags.length} / {max}</p>
    </div>
  );
}
