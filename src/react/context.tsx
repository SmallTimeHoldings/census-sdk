import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createCensus, CensusClient } from '../client';
import type { CensusProviderProps, CensusTheme, UserIdentity } from '../types';

/**
 * Context value for the Census provider
 */
interface CensusContextValue {
  client: CensusClient;
  theme: CensusTheme;
  isReady: boolean;
  isIdentified: boolean;
}

const CensusContext = createContext<CensusContextValue | null>(null);

/**
 * Provider component for the Census SDK.
 * Wrap your app with this to use Census hooks and components.
 *
 * @example
 * ```tsx
 * import { CensusProvider } from '@census-ai/census-sdk/react';
 *
 * function App() {
 *   return (
 *     <CensusProvider
 *       apiKey="cs_live_xxx"
 *       user={{ userId: 'user_123', email: 'user@example.com' }}
 *     >
 *       <YourApp />
 *     </CensusProvider>
 *   );
 * }
 * ```
 */
export function CensusProvider({
  apiKey,
  baseUrl,
  debug,
  user,
  theme = {},
  children,
}: CensusProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);

  const client = useMemo(() => {
    return createCensus({ apiKey, baseUrl, debug });
  }, [apiKey, baseUrl, debug]);

  // Automatically identify user if provided
  useEffect(() => {
    if (user) {
      client
        .identify(user)
        .then(() => {
          setIsIdentified(true);
          setIsReady(true);
        })
        .catch((error) => {
          console.error('[Census] Failed to identify user:', error);
          setIsReady(true);
        });
    } else {
      setIsReady(true);
    }
  }, [client, user]);

  const value: CensusContextValue = useMemo(
    () => ({
      client,
      theme,
      isReady,
      isIdentified,
    }),
    [client, theme, isReady, isIdentified]
  );

  return <CensusContext.Provider value={value}>{children}</CensusContext.Provider>;
}

/**
 * Hook to access the Census client directly.
 *
 * @returns The Census client instance
 * @throws If used outside of CensusProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const census = useCensus();
 *
 *   const handleClick = async () => {
 *     await census.track('button_clicked');
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useCensus(): CensusClient {
  const context = useContext(CensusContext);
  if (!context) {
    throw new Error('useCensus must be used within a CensusProvider');
  }
  return context.client;
}

/**
 * Hook to access the Census context (client, theme, and state).
 *
 * @returns The full Census context
 * @throws If used outside of CensusProvider
 */
export function useCensusContext(): CensusContextValue {
  const context = useContext(CensusContext);
  if (!context) {
    throw new Error('useCensusContext must be used within a CensusProvider');
  }
  return context;
}

/**
 * Hook to identify a user.
 *
 * @returns Object with identify function and state
 *
 * @example
 * ```tsx
 * function LoginHandler() {
 *   const { identify, isIdentifying } = useIdentify();
 *
 *   const handleLogin = async (user) => {
 *     await identify({
 *       userId: user.id,
 *       email: user.email,
 *       name: user.name,
 *     });
 *   };
 * }
 * ```
 */
export function useIdentify() {
  const { client } = useCensusContext();
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const identify = async (user: UserIdentity) => {
    setIsIdentifying(true);
    setError(null);
    try {
      await client.identify(user);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to identify user'));
      throw err;
    } finally {
      setIsIdentifying(false);
    }
  };

  const reset = () => {
    client.reset();
  };

  return {
    identify,
    reset,
    isIdentifying,
    isIdentified: client.isIdentified(),
    error,
  };
}
