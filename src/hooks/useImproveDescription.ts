import { useState } from 'react';

type ImproveMode = 'improve' | 'extract' | 'rewrite' | 'tags';

interface ImproveDescriptionResponse {
  original: string;
  improved: string;
  mode: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export function useImproveDescription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const improveDescription = async (
    description: string,
    mode: ImproveMode = 'improve'
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/improve-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, mode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve description');
      }

      const data: ImproveDescriptionResponse = await response.json();
      return data.improved;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { improveDescription, isLoading, error };
}
