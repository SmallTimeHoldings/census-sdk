# @census-ai/census-sdk

Official Census SDK for integrating feedback collection, knowledge base, and analytics into your application.

## Installation

```bash
npm install @census-ai/census-sdk
# or
yarn add @census-ai/census-sdk
# or
pnpm add @census-ai/census-sdk
```

## Quick Start

### Vanilla JavaScript/TypeScript

```typescript
import { createCensus } from '@census-ai/census-sdk';

// Initialize the SDK
const census = createCensus({
  apiKey: 'cs_live_your_key_here',
  debug: true, // Enable debug logging (optional)
});

// Identify users
await census.identify({
  userId: 'user_123',
  email: 'user@example.com',
  name: 'John Doe',
  organizationId: 'org_456',
  organizationName: 'Acme Inc',
});

// Submit feedback
await census.submitFeedback({
  type: 'bug_report',
  message: 'The submit button is not working on Firefox',
});

// Get knowledge base articles
const { articles } = await census.getArticles();
const article = await census.getArticle('getting-started');

// Track custom events
await census.track('button_clicked', { buttonId: 'cta' });
```

### React

```tsx
import { CensusProvider, FeedbackButton, KnowledgeBase } from '@census-ai/census-sdk/react';

function App() {
  return (
    <CensusProvider
      apiKey="cs_live_your_key_here"
      user={{ userId: 'user_123', email: 'user@example.com' }}
    >
      <YourApp />
      <FeedbackButton position="bottom-right" />
    </CensusProvider>
  );
}

function HelpPage() {
  return <KnowledgeBase showSearch showCategories />;
}
```

## API Reference

### Core Client

#### `createCensus(config)`

Creates a new Census client instance.

```typescript
const census = createCensus({
  apiKey: string;      // Required: Your Census API key
  baseUrl?: string;    // Optional: Custom API base URL
  debug?: boolean;     // Optional: Enable debug logging
});
```

#### `census.identify(user)`

Identify a user for tracking. Call this when a user logs in.

```typescript
await census.identify({
  userId: string;           // Required: Unique user ID
  email?: string;           // User's email
  name?: string;            // User's display name
  avatarUrl?: string;       // URL to avatar image
  metadata?: object;        // Custom properties
  organizationId?: string;  // User's organization ID
  organizationName?: string;
});
```

#### `census.submitFeedback(options)`

Submit feedback, bug reports, or feature requests.

```typescript
await census.submitFeedback({
  type: 'feedback' | 'bug_report' | 'feature_request' | 'article_rating';
  message?: string;     // Required for non-article_rating types
  rating?: number;      // 1-5, for article ratings
  helpful?: boolean;    // For article ratings
  articleId?: string;   // For article ratings
  metadata?: object;    // Additional data
});
```

#### `census.getArticles(options?)`

Fetch published articles from the knowledge base.

```typescript
const { articles, pagination } = await census.getArticles({
  category?: string;   // Filter by category
  search?: string;     // Search query
  limit?: number;      // Max results (default: 50)
  offset?: number;     // Pagination offset
});
```

#### `census.getArticle(slugOrId)`

Fetch a single article by slug or ID.

```typescript
const article = await census.getArticle('getting-started');
```

#### `census.track(eventType, properties?)`

Track custom analytics events.

```typescript
await census.track('page_viewed', { page: '/pricing' });
await census.track('button_clicked', { buttonId: 'signup' });
```

### React Components

#### `<CensusProvider>`

Wrap your app with this provider to use Census hooks and components.

```tsx
<CensusProvider
  apiKey="cs_live_xxx"
  user={{ userId: 'user_123', email: 'user@example.com' }}
  theme={{ primaryColor: '#6366f1' }}
>
  {children}
</CensusProvider>
```

#### `<FeedbackButton>`

Floating feedback button with modal form.

```tsx
<FeedbackButton
  position="bottom-right"     // Position on screen
  text="Feedback"             // Button text
  allowedTypes={['feedback', 'bug_report', 'feature_request']}
  onSubmit={(feedback) => console.log('Submitted:', feedback)}
/>
```

#### `<KnowledgeBase>`

Embeddable knowledge base component.

```tsx
<KnowledgeBase
  showSearch={true}
  showCategories={true}
  defaultCategory="getting-started"
  onArticleView={(article) => console.log('Viewed:', article.title)}
/>
```

### React Hooks

#### `useCensus()`

Access the Census client directly.

```tsx
const census = useCensus();
await census.track('event_name');
```

#### `useFeedback()`

Submit feedback with loading/success state.

```tsx
const { submitFeedback, isSubmitting, isSuccess, error } = useFeedback();
```

#### `useArticles(options?)`

Fetch articles with loading state.

```tsx
const { articles, isLoading, error, refetch } = useArticles({ category: 'guides' });
```

#### `useArticle(slugOrId)`

Fetch a single article.

```tsx
const { article, isLoading, error } = useArticle('getting-started');
```

#### `useIdentify()`

Identify users with loading state.

```tsx
const { identify, isIdentifying, isIdentified } = useIdentify();
```

#### `useTrack()`

Track events.

```tsx
const { track, trackBatch } = useTrack();
await track('button_clicked', { buttonId: 'cta' });
```

## TypeScript

The SDK is written in TypeScript and includes full type definitions. All types are exported from the main package:

```typescript
import type {
  CensusConfig,
  UserIdentity,
  FeedbackOptions,
  Article,
  ArticlesResponse,
} from '@census-ai/census-sdk';
```

## License

MIT
