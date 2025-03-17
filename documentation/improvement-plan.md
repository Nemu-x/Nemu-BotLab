# Improvement Plan

This document outlines key improvements for the Telegram Bot application, focusing on performance optimization, code cleanup, and proper localization implementation.

## Performance Optimizations

### Eliminating UI Flickering

The application currently suffers from noticeable flickering during updates, particularly in the chat interface and when navigating between pages. Here are solutions to address this issue:

1. **Implement React Query**
   - Replace direct API calls with React Query for data fetching and caching
   - Benefits: Automatic caching, background refreshes, optimistic updates
   - Implementation:
     ```javascript
     // Install the package
     npm install @tanstack/react-query

     // Setup in _app.tsx or layout.tsx
     import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
     const queryClient = new QueryClient();

     // Wrap your application
     <QueryClientProvider client={queryClient}>
       <App />
     </QueryClientProvider>
     
     // In components, use useQuery instead of direct fetch calls
     const { data, isLoading } = useQuery({
       queryKey: ['messages', clientId],
       queryFn: () => getMessages(clientId),
     });
     ```

2. **Add Proper Loading States**
   - Implement skeleton loaders instead of empty states
   - Use transition animations between loading states
   - Maintain consistent layout dimensions to prevent layout shifts
   
3. **Optimize Data Updates with SWR**
   - Implement the SWR library for real-time updates without full page refreshes
   - Example implementation for chat messages:
     ```javascript
     const { data, mutate } = useSWR(`/api/messages/client/${clientId}`, fetcher, {
       refreshInterval: 3000,
       revalidateOnFocus: true,
     });
     ```

4. **Implement CSS Transitions**
   - Add smooth transitions when components update
   - Use opacity and transform transitions rather than display changes
   - Example:
     ```css
     .message-container {
       transition: opacity 0.3s ease;
     }
     
     .message-container.loading {
       opacity: 0.7;
     }
     ```

5. **Add Server-Sent Events for Real-time Updates**
   - Implement SSE for live updates without constant polling
   - This will reduce the need for refreshing and prevent flickering

## Code Cleanup

Based on the analysis in the missing-features.md document, here are specific items that can be removed or consolidated:

### Frontend Cleanup

1. **Remove Duplicate Routes**
   - Delete the `/ru/dashboard/*` routes as they're incomplete and should be handled through proper localization
   - Remove or repurpose the `/(dashboard)` alternative route group

2. **Consolidate Component Structure**
   - Move components from `/app/components` to `/app/shared/components`
   - Ensure page-specific components are stored in their respective page directories

3. **Remove Unused Pages**
   - `/dashboard/flows/responses` - either complete the implementation or remove it
   - `/tickets` (Root Level) - consolidate with `/dashboard/tickets`
   - `/dashboard/bulk-messaging` - if not fully functional, remove or complete it

4. **Refine API Client**
   - Consolidate API calls in the `/src/config/api.ts` file
   - Remove any duplicate or unused API methods
   - Implement better error handling and retry logic

### Backend Cleanup

1. **Consolidate Middleware Directories**
   - Move all middleware from `/src/middlewares` to `/src/middleware`
   - Update imports accordingly
   - Example command to find all imports that need updating:
     ```bash
     grep -r "require('../middlewares/" telegram-bot-backend/src
     ```

2. **Remove Unused Directories**
   - `/src/entities` - If models are now in `/src/models`, remove this directory
   - `/src/dto` - If not being used consistently, either fully implement or remove

3. **Fix API Routing**
   - Consolidate route definitions in `/src/routes/index.js`
   - Fix the dashboard routes to properly connect to the controller

4. **Audit and Remove Dead Code**
   - Run a dead code detection tool:
     ```bash
     npx depcruise --output-type dot --do-not-follow "node_modules" telegram-bot-backend/src | dot -T svg > dependency-graph.svg
     ```
   - Review and remove unused functions and modules

## Localization Implementation

To properly implement localization without duplicating routes:

1. **Reset Russian Localization**
   - Remove the `/ru` directory structure
   - Implement proper Next.js internationalization using the i18n config

2. **Configure Next.js Internationalization**
   - Update `next.config.js`:
     ```javascript
     module.exports = {
       i18n: {
         locales: ['en', 'ru'],
         defaultLocale: 'en',
         localeDetection: true,
       },
     }
     ```

3. **Create Localization Files**
   - Create structured JSON files for translations:
     ```
     /public/locales/
     ├── en/
     │   ├── common.json
     │   ├── dashboard.json
     │   └── ...
     └── ru/
         ├── common.json
         ├── dashboard.json
         └── ...
     ```

4. **Implement Translation Hook**
   - Create a robust translation hook:
     ```javascript
     // hooks/useTranslation.js
     import { useRouter } from 'next/router';
     import en from '../public/locales/en';
     import ru from '../public/locales/ru';

     export const useTranslation = () => {
       const router = useRouter();
       const { locale } = router;
       const translations = locale === 'ru' ? ru : en;
       
       const t = (key) => {
         const keys = key.split('.');
         let value = translations;
         
         for (const k of keys) {
           value = value?.[k];
           if (!value) return key;
         }
         
         return value;
       };
       
       return { t, locale };
     };
     ```

5. **Add Language Switcher**
   - Add a language toggle in the user interface
   - Persist language preference in localStorage

## Dashboard Analytics Integration

To properly connect the dashboard with analytics:

1. **Fix API URL Configuration**
   - Update the frontend API client to use the correct backend URL
   - Check all environment variables in both frontend and backend

2. **Configure Proxy in Next.js**
   - Add proxy configuration in `next.config.js`:
     ```javascript
     module.exports = {
       // ... other config
       async rewrites() {
         return [
           {
             source: '/api/:path*',
             destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
           },
         ];
       },
     };
     ```

3. **Implement Missing Dashboard Endpoints**
   - Ensure all backend controller methods are properly exposed in routes
   - Check API URL paths match between frontend and backend

## Implementation Priority

1. **High Priority**
   - Fix UI flickering by implementing React Query
   - Fix API URL configuration to connect dashboard to backend
   - Consolidate middleware directories

2. **Medium Priority**
   - Clean up unused routes and pages
   - Implement proper localization
   - Add loading states and transitions

3. **Low Priority**
   - Remove all dead code
   - Implement SSE for real-time updates
   - Add advanced analytics features

## Strategy for Implementation

For each component or feature:

1. Create a branch for the specific improvement
2. Implement and test changes in isolation
3. Create comprehensive tests to verify functionality
4. Merge back to main branch once verified
5. Deploy incrementally to minimize disruption 