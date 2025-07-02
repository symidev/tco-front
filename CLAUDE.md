# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Server
```bash
npm run dev
```
Starts Vite development server with HTTPS on port 5173 using SSL certificates in `/ssl/` directory.

### Build Commands
```bash
npm run build
```
Production build with backup and deployment to `public_html/` directory. Includes cleanup of existing assets and restoration from `bck/` directory.

```bash
npm run firstbuild
```
Simple Vite build without deployment logic.

### Preview
```bash
npm run preview
```
Preview production build locally.

## Architecture Overview

### Tech Stack
- **Frontend Framework**: Vue 3 with Composition API
- **Build Tool**: Vite with Tailwind CSS integration
- **State Management**: Vuex 4 with modular store architecture
- **Routing**: Vue Router 4 with route-based authentication
- **UI Components**: PrimeVue with custom "tcoTheme" preset based on Nora
- **Styling**: Tailwind CSS + DaisyUI + custom PrimeVue theme

### Project Structure

#### Core Application Files
- `src/main.js`: Application entry point with PrimeVue theme configuration
- `src/App.vue`: Root component with layout routing
- `src/router/index.js`: Route definitions with authentication guards

#### State Management (`src/store/`)
Modular Vuex store with three main modules:
- `auth/`: Authentication state, tokens, login/logout logic
- `user/`: User profile and account management
- `siteData/`: Application-wide data and configuration

#### Layout System (`src/layouts/`)
Dynamic layout switching based on route meta:
- `DefaultLayout`: Authenticated users (Navbar + Sidebar)
- `NoAuthLayout`: Login/register pages
- `EmptyLayout`: Special pages like auto-connect

#### API Integration (`src/services/api/`)
- `apiService.js`: Base HTTP client with interceptors
- `comparoService.js`: Vehicle comparison functionality
- `siteDataService.js`: Site-wide data fetching

#### Business Logic (`src/views/`)
Feature-focused views:
- **Vehicle Management**: `VehiculesView.vue`, `VehiculeForm.vue`
- **Comparisons**: `ComparosView.vue`, `ComparoForm.vue`, `ComparoAnalyseView.vue`
- **Authentication**: `auth/` directory with login/register flows
- **User Account**: `account/` directory with profile management

### Key Patterns

#### Authentication Flow
- JWT tokens stored in localStorage
- Route guards check `requiresAuth` meta property
- API interceptors handle token refresh
- Automatic logout on token expiration

#### Layout Switching
Routes define layout via meta property:
```javascript
meta: { layout: 'DefaultLayout', requiresAuth: true }
```

#### Form Handling
Multi-step forms with validation (see registration flow in `src/views/auth/register/`)

#### Theme Management
Custom PrimeVue theme with light/dark mode support using `.dark` CSS class selector.

## Development Notes

### SSL Configuration
Development server uses HTTPS with certificates in `/ssl/` directory. Ensure certificates are valid for local development.

### API Integration
API interceptors are configured in `src/lib/utils.js` and initialized in store setup. All API calls go through centralized services.

### State Management
Use Vuex modules for feature isolation. Site data is loaded on app initialization and cached in the store.