'use client';

import { useState } from 'react';
import { useImproveDescription } from '@/hooks/useImproveDescription';

export default function DescriptionImprover() {
  const [description, setDescription] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [mode, setMode] = useState<'improve' | 'extract' | 'rewrite'>('improve');
  const { improveDescription, isLoading, error } = useImproveDescription();

  const handleImprove = async () => {
    if (!description.trim()) return;

    const result = await improveDescription(description, mode);
    if (result) {
      setImprovedText(result);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Description Improver</h1>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Mode:</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="improve"
              checked={mode === 'improve'}
              onChange={(e) => setMode(e.target.value as 'improve' | 'extract' | 'rewrite')}
              className="cursor-pointer"
            />
            <span>Improve</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="extract"
              checked={mode === 'extract'}
              onChange={(e) => setMode(e.target.value as 'improve' | 'extract' | 'rewrite')}
              className="cursor-pointer"
            />
            <span>Extract Key Points</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="rewrite"
              checked={mode === 'rewrite'}
              onChange={(e) => setMode(e.target.value as 'improve' | 'extract' | 'rewrite')}
              className="cursor-pointer"
            />
            <span>Rewrite</span>
          </label>
        </div>
      </div>

      {/* Input Textarea */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Enter your description:
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Type or paste your description here..."
          className="w-full h-40 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Improve Button */}
      <button
        onClick={handleImprove}
        disabled={isLoading || !description.trim()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing...' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Description`}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}

      {/* Result Display */}
      {improvedText && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Result:</label>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="whitespace-pre-wrap">{improvedText}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(improvedText);
            }}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
