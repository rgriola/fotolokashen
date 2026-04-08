"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tag, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/constants/messages";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  /** AI features (suggest tags, add all, dismiss) */
  ai?: {
    suggestedTags: string[];
    onSuggestTags: () => void;
    onDismissSuggested: () => void;
    isLoading: boolean;
    /** Whether the suggest button should be disabled (e.g. no production notes) */
    disabled?: boolean;
  };
}

const TAG_REGEX = /^[a-zA-Z0-9\s\-]+$/;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 25;

export function TagInput({ tags, onTagsChange, ai }: TagInputProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();

    if (!trimmedTag) return;

    if (tags.includes(trimmedTag)) {
      toast.error(TOAST.TAGS.DUPLICATE);
      return;
    }

    if (tags.length >= MAX_TAGS) {
      toast.error(TOAST.TAGS.MAX_REACHED);
      return;
    }

    if (trimmedTag.length > MAX_TAG_LENGTH) {
      toast.error(TOAST.TAGS.TOO_LONG);
      return;
    }

    if (!TAG_REGEX.test(trimmedTag)) {
      toast.error(TOAST.TAGS.INVALID_CHARS);
      return;
    }

    onTagsChange([...tags, trimmedTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < MAX_TAGS) {
      onTagsChange([...tags, tag]);
    }
    ai?.onDismissSuggested();
  };

  const handleAddAllSuggestedTags = () => {
    if (!ai) return;
    const availableSlots = MAX_TAGS - tags.length;
    const tagsToAdd = ai.suggestedTags
      .filter((tag) => !tags.includes(tag))
      .slice(0, availableSlots);

    if (tagsToAdd.length > 0) {
      onTagsChange([...tags, ...tagsToAdd]);
      ai.onDismissSuggested();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor="tags">Tags</Label>
        <span className="text-xs text-muted-foreground">
          {tags.length}/{MAX_TAGS} • each tag {MAX_TAG_LENGTH} chars max
        </span>
      </div>
      <div className="relative">
        <Input
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          placeholder="Add tags..."
          maxLength={MAX_TAG_LENGTH}
          className="pr-10"
        />
        <Button
          type="button"
          onClick={handleAddTag}
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
        >
          <Tag className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Suggest Tags Button */}
      {ai && (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ai.onSuggestTags}
            disabled={ai.isLoading || ai.disabled || ai.suggestedTags.length > 0}
            className="text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {ai.isLoading ? "Generating..." : "AI Tag Suggestions"}
          </Button>
        </div>
      )}

      {/* Suggested Tags */}
      {ai && ai.suggestedTags.length > 0 && (
        <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary">AI Suggested Tags:</p>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddAllSuggestedTags}
                className="text-xs h-6 px-2 text-primary hover:text-primary"
              >
                Add All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={ai.onDismissSuggested}
                className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ai.suggestedTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="gap-1 cursor-pointer hover:bg-primary/10 border-primary/30 text-primary"
                onClick={() => handleAddSuggestedTag(tag)}
              >
                + {tag}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-primary italic">Click a tag to add it to your location</p>
        </div>
      )}

      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
