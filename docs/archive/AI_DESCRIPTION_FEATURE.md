# AI Description Improvement Feature

This feature uses OpenAI's API to improve, extract key points from, or rewrite user descriptions.

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again!)

### 2. Add the API Key to Your Environment

Add this to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Files Created

- **API Route**: `/src/app/api/ai/improve-description/route.ts`
  - Handles the AI processing
  - Supports 3 modes: improve, extract, rewrite

- **Hook**: `/src/hooks/useImproveDescription.ts`
  - React hook for easy integration
  - Handles loading states and errors

- **Example Component**: `/src/components/DescriptionImprover.tsx`
  - Demo component showing how to use the feature
  - Can be used as-is or as a reference

### 4. Usage Examples

#### Using the Hook in Your Components

```tsx
import { useImproveDescription } from '@/hooks/useImproveDescription';

function MyComponent() {
  const { improveDescription, isLoading, error } = useImproveDescription();

  const handleClick = async () => {
    const result = await improveDescription(
      "This is my description",
      "improve" // or "extract" or "rewrite"
    );
    
    if (result) {
      console.log('Improved:', result);
    }
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Improve Description'}
    </button>
  );
}
```

#### Using the API Directly

```typescript
const response = await fetch('/api/ai/improve-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: "Your description here",
    mode: "improve" // or "extract" or "rewrite"
  }),
});

const data = await response.json();
console.log(data.improved);
```

### 5. Testing the Demo Component

Add this to any page in your app (e.g., create a new page at `/src/app/ai-demo/page.tsx`):

```tsx
import DescriptionImprover from '@/components/DescriptionImprover';

export default function AIDemoPage() {
  return <DescriptionImprover />;
}
```

Then visit `http://localhost:3000/ai-demo` in your browser.

### 6. API Modes

- **improve**: Makes the description clearer, more concise, and professional
- **extract**: Extracts key points as a bulleted list
- **rewrite**: Completely rewrites the description in a more engaging way

### 7. Cost Considerations

- Uses `gpt-4o-mini` model (cost-effective)
- Approximate cost: $0.00015 per request (varies by length)
- Set max_tokens to 500 to control costs
- Monitor usage in OpenAI dashboard

### 8. Security Notes

- Never commit your `.env.local` file
- Keep your API key secret
- Consider adding rate limiting for production
- The API route runs server-side, so the key is never exposed to clients

### 9. Integration with Your App

You can integrate this into your location/photo description fields by:

1. Adding an "Improve with AI" button next to the description input
2. Using the hook to call the API
3. Replacing or suggesting the improved text to the user

Example integration:

```tsx
const [description, setDescription] = useState('');
const { improveDescription, isLoading } = useImproveDescription();

const handleImprove = async () => {
  const improved = await improveDescription(description, 'improve');
  if (improved) {
    setDescription(improved); // or show as suggestion
  }
};
```

## Troubleshooting

- **"OpenAI API key is not configured"**: Make sure your `.env.local` has the key and restart your dev server
- **Rate limit errors**: You've exceeded OpenAI's rate limit, wait a moment and try again
- **Network errors**: Check your internet connection and OpenAI service status

## Next Steps

- Add rate limiting to prevent abuse
- Add user authentication checks
- Store usage metrics for monitoring
- Consider caching similar requests
- Add more AI modes (summarize, translate, etc.)
