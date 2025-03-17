# Missing Features and Unused Pages

This document outlines features that are not fully implemented, API endpoints that are defined but not working, and pages that appear to be unused or incomplete in the current codebase.

## API Endpoints with Implementation Issues

### Dashboard Endpoints

The following dashboard endpoints are defined in the routes but appear to be experiencing issues:

1. **`/api/dashboard/stats`** - Endpoint is defined and implemented in `dashboardController.js` but returns 404 errors when accessed from the frontend
2. **`/api/dashboard/activity`** - Endpoint is defined and implemented but returns 404 errors
3. **`/api/dashboard/time-analytics`** - Endpoint is defined and implemented but returns 404 errors

The issue appears to be a connection problem rather than missing implementation. The frontend is unable to connect to these endpoints even though they are properly implemented in the backend. This could be due to:

- Port misconfigurations
- API URL settings
- Missing proxy settings in the Next.js configuration
- Backend server not running when these endpoints are accessed

## Missing Features

### Authentication

1. **Token Refresh** - Token refresh functionality is not implemented, which could lead to user sessions expiring unexpectedly
2. **Password Reset** - No functionality for password reset or recovery
3. **Two-Factor Authentication** - No 2FA support for enhanced security

### Dashboard

1. **Real-time Updates** - Dashboard doesn't update in real-time without manual refresh
2. **Customizable View** - Users cannot customize which metrics appear on their dashboard
3. **Dashboard Filters** - No filtering options for viewing statistics for specific time periods

### Client Management

1. **Bulk Actions** - No functionality for performing actions on multiple clients at once
2. **Client Segmentation** - Limited ability to segment clients based on behavior or attributes
3. **Client History Timeline** - No comprehensive timeline view of a client's history

### Flow Management

1. **Flow Templates** - No pre-built templates for common conversation flows
2. **Flow Testing** - No testing functionality for conversation flows before deployment
3. **Flow Analytics** - Limited analytics on flow performance and completion rates

### Telegram Integration

1. **Multiple Bot Support** - System only supports a single Telegram bot
2. **Media Message Handling** - Limited support for managing media messages (photos, videos, etc.)
3. **Inline Query Support** - No support for Telegram's inline query feature

## Unused or Incomplete Pages

### Frontend

1. **`/ru/dashboard/*` Routes** - Russian localization routes appear to be incomplete or unused
2. **`/dashboard/bulk-messaging`** - Page exists but may not be fully functional
3. **`/dashboard/flows/responses`** - Page exists but may not be tied to a complete feature
4. **`/tickets` (Root Level)** - This folder appears to be a duplicate or unused version of `/dashboard/tickets`
5. **`/(dashboard)` Alternative Route Group** - Appears to be a duplicate of the main dashboard routes

### Backend

1. **`/src/dto`** - Directory exists but may not be fully utilized across the application 
2. **`/src/middlewares` vs `/src/middleware`** - Two similar directories that may cause confusion
3. **`/src/entities`** - Directory exists but may have been replaced by `/src/models`

## Integration Issues

1. **API URL Configuration** - Appears to be a misconfiguration between the frontend API client and backend server
2. **Error Handling** - Inconsistent error handling across the application
3. **Localization** - Partial implementation of localization with some hardcoded Russian strings

## Development Recommendations

### High Priority

1. **Fix Dashboard API Connection** - Resolve the 404 errors when accessing dashboard endpoints
2. **Unify Middleware Directories** - Consolidate `/src/middleware` and `/src/middlewares` 
3. **Fix API URL Configuration** - Ensure proper connection between frontend and backend

### Medium Priority

1. **Complete Localization** - Finish the localization implementation or remove partial implementation
2. **Implement Token Refresh** - Add JWT token refresh functionality
3. **Enhance Client Management** - Add missing client management features

### Low Priority

1. **Clean Up Unused Routes** - Remove or complete unused route implementations
2. **Implement Advanced Features** - Add flow templates, testing, and analytics
3. **Support Multiple Telegram Bots** - Extend the system to support multiple bots 