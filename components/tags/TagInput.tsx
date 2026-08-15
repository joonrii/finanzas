"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Plus, Tag } from "lucide-react";

export default function TagInput({
  transactionId,
  initialTags,
  onTagsChange,
}: {
  transactionId?: string;
  initialTags?: { id: string; name: string; color: string }[];
  onTagsChange?: (tags: string[]) => void;
}) {
  const supabase = createClient();
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTags?.map((t) => t.id) ?? []
  );
  const [input, setInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("tags")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name");
    setAllTags(data ?? []);
  }

  async function createTag(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const colors = ["#3ECF8E", "#3882F6", "#E5484D", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { data } = await supabase
      .from("tags")
      .insert({ user_id: user.id, name: name.trim(), color })
      .select()
      .single();
    if (data) {
      setAllTags((prev) => [...prev, data]);
      toggleTag(data.id);
      setInput("");
      setShowCreate(false);
    }
  }

  function toggleTag(tagId: string) {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(next);
    onTagsChange?.(next);
  }

  const filtered = allTags.filter(
    (t) =>
      t.name.toLowerCase().includes(input.toLowerCase()) &&
      !selectedTags.includes(t.id)
  );

  return (
    <div>
      <label className="block text-sm text-muted mb-2 flex items-center gap-1.5">
        <Tag size={14} />
        Etiquetas
      </label>

      {/* Tags seleccionados */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedTags.map((tagId) => {
          const tag = allTags.find((t) => t.id === tagId);
          if (!tag) return null;
          return (
            <span
              key={tagId}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white border"
              style={{ borderColor: tag.color, backgroundColor: tag.color + "20" }}
            >
              #{tag.name}
              <button
                type="button"
                onClick={() => toggleTag(tagId)}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
      </div>

      {/* Input para buscar/crear */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowCreate(e.target.value.length > 0);
          }}
          placeholder="Escribe para buscar o crear..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-positive"
        />
        {showCreate && input.trim() && !allTags.some((t) => t.name.toLowerCase() === input.toLowerCase()) && (
          <button
            type="button"
            onClick={() => createTag(input)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-positive hover:underline"
          >
            <Plus size={12} />
            Crear "#{input}"
          </button>
        )}
      </div>

      {/* Lista de tags existentes */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="rounded-full px-3 py-1 text-xs border transition hover:brightness-125"
              style={{ borderColor: tag.color + "60", color: tag.color }}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
