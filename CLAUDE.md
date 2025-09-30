# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 PWA application called "Pannello Stufa" (Stove Panel) that provides remote control functionality for a Thermorossi stove through their cloud API. The app integrates with Auth0 for authentication, Firebase Realtime Database for logging, and Netatmo API for temperature monitoring.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Core Components
- **StovePanel** (`app/components/StovePanel.js`) - Main control interface with dashboard layout
  - **Layout**: Modern dashboard with hero section (status card), 2-column grid (actions + settings), and Netatmo footer
  - **Hero Section**: Full-width status card with state badge, mode indicator, and refresh button
  - **Quick Actions Card**: Large buttons (h-24) for ignite/shutdown with visual feedback (✓ in funzione / ○ spenta)
  - **Regolazioni Card**: Fan and power controls with live display showing current levels (X/6, X/5)
  - **Netatmo Section**: Bottom card with dashed border indicating "work in progress", shows temperature if available
  - Uses: Card, Button, Select, StatusBadge, ModeIndicator, Skeleton
  - Implements loading state with `initialLoading` flag
  - Shows `Skeleton.StovePanel` until all initial data (status, fan, power, scheduler mode) is fetched
  - Responsive: Full dashboard on desktop (max-w-7xl), stacked on mobile
  - Real-time status polling every 5 seconds
- **Navbar** (`app/components/Navbar.js`) - Navigation with Auth0 integration, glassmorphism design with backdrop blur

### Reusable UI Components (`app/components/ui/`)
Modular component system for consistent UI across the application:

- **Card** (`Card.js`) - Base container component
  - Props: `children`, `className`, `...props`
  - Usage: `<Card className="p-6">content</Card>`

- **Button** (`Button.js`) - Standardized button with variants
  - Props: `variant` (primary|secondary|success|danger|accent|outline|ghost), `size` (sm|md|lg), `icon`, `disabled`, `loading`
  - Usage: `<Button variant="success" icon="🔥" onClick={handleClick}>Accendi</Button>`

- **Input** (`Input.js`) - Text input with label and icon support
  - Props: `type`, `label`, `icon`, `className`, `containerClassName`
  - Usage: `<Input type="time" label="⏰ Dalle" value={start} onChange={handleChange} />`

- **Select** (`Select.js`) - Dropdown select with label and icon support
  - Props: `label`, `icon`, `options` (array of `{value, label, disabled?}`), `className`, `containerClassName`
  - Usage: `<Select label="💨 Ventola" options={fanOptions} value={level} onChange={handleChange} />`

- **StatusBadge** (`StatusBadge.js`) - Status display with dynamic colors and icons
  - Props: `status`, `icon`, `size` (sm|md|lg)
  - Automatically determines color and icon based on status keywords (WORK, OFF, ERROR, etc.)
  - Usage: `<StatusBadge status="WORK" />`

- **ModeIndicator** (`ModeIndicator.js`) - Scheduler mode indicator
  - Props: `enabled`, `semiManual`, `returnToAutoAt`, `onConfigClick`, `showConfigButton`, `compact`
  - Displays current mode (Manual/Automatic/Semi-manual) with icon and colors
  - Optional configure button and return time display
  - Usage: `<ModeIndicator enabled={schedulerEnabled} semiManual={semiManualMode} returnToAutoAt={returnToAutoAt} onConfigClick={() => router.push('/scheduler')} />`

- **Pagination** (`Pagination.js`) - Page navigation controls
  - Props: `currentPage`, `totalPages`, `onPrevious`, `onNext`, `hasPrev`, `hasNext`
  - Usage: `<Pagination currentPage={0} totalPages={10} onPrevious={handlePrev} onNext={handleNext} hasPrev={true} hasNext={true} />`

- **Skeleton** (`Skeleton.js`) - Loading placeholder component with shimmer animation
  - Props: `className` (for generic skeleton), `children` (for Skeleton.Card)
  - Pre-built specialized loaders:
    - `Skeleton.StovePanel` - Full skeleton for StovePanel component (home page)
    - `Skeleton.Scheduler` - Full skeleton for Scheduler page
    - `Skeleton.LogPage` - Full skeleton for Log page
    - `Skeleton.Card` - Card wrapper for custom skeleton content
    - `Skeleton.LogEntry` - Single log entry skeleton
  - Design: Gradient shimmer animation following app's neutral color palette
  - Usage:
    ```javascript
    // Generic skeleton
    <Skeleton className="h-8 w-32" />

    // Page-specific skeleton (shown during data fetch)
    if (loading) return <Skeleton.StovePanel />;

    // Custom card skeleton
    <Skeleton.Card>
      <Skeleton className="h-6 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full" />
    </Skeleton.Card>
    ```

### Scheduler Components (`app/components/scheduler/`)
Specialized components for weekly schedule management:

- **TimeBar** (`TimeBar.js`) - 24-hour visual timeline with interactive features
  - Props: `intervals`, `hoveredIndex`, `selectedIndex`, `onHover`, `onClick`
  - Shows colored bars for scheduled intervals with hover/selection states
  - Displays time labels and reference hours
  - **Interactive tooltip**: Shows interval details (time range, power, fan) on hover
  - **Visual feedback**: Hovered/selected intervals scale up and change color
  - **Click to select**: Click on interval bar to toggle persistent selection
  - Usage: `<TimeBar intervals={schedule[day]} hoveredIndex={0} selectedIndex={1} onHover={setHover} onClick={handleClick} />`

- **ScheduleInterval** (`ScheduleInterval.js`) - Single time interval editor
  - Props: `range`, `onRemove`, `onChange`, `isHighlighted`, `onMouseEnter`, `onMouseLeave`, `onClick`
  - Editable time inputs (start/end), power (1-5) and fan (1-6) selects, remove button
  - **Validation on blur**: Time inputs validate only when user leaves the field
  - **Highlighted state**: Visual emphasis when hovered or selected (pink background, border, ring, scale)
  - **Bidirectional sync**: Syncs with TimeBar for hover/selection states
  - Usage: `<ScheduleInterval range={interval} isHighlighted={true} onRemove={handleRemove} onChange={handleChange} />`

- **DayScheduleCard** (`DayScheduleCard.js`) - Complete day schedule card with state management
  - Props: `day`, `intervals`, `onAddInterval`, `onRemoveInterval`, `onChangeInterval`
  - Manages hover and selection state for synchronization between TimeBar and ScheduleInterval cards
  - Combines TimeBar, list of ScheduleIntervals, and add button
  - **State tracking**: `hoveredIndex` and `selectedIndex` for interactive highlighting
  - Usage: `<DayScheduleCard day="Lunedì" intervals={schedule['Lunedì']} onAddInterval={addInterval} onRemoveInterval={removeInterval} onChangeInterval={changeInterval} />`

- **DayAccordionItem** (`DayAccordionItem.js`) - Collapsible day schedule card with preview
  - Props: `day`, `intervals`, `isExpanded`, `onToggle`, `onAddInterval`, `onRemoveInterval`, `onChangeInterval`
  - **Accordion UI**: Clickable header to expand/collapse day content
  - **Compact preview**: When collapsed, shows time range coverage and total hours
  - **Smart preview**: Displays "08:00 - 22:00 • 3 intervalli • 6.5h totali" in collapsed state
  - **Empty state**: Shows friendly message when no intervals configured
  - **Smooth animations**: 300ms transition for expand/collapse with opacity fade
  - Includes all DayScheduleCard features (TimeBar, intervals, hover/selection)
  - Usage: `<DayAccordionItem day="Lunedì" intervals={schedule['Lunedì']} isExpanded={true} onToggle={toggleDay} ... />`

### Log Components (`app/components/log/`)
Components for user action log display:

- **LogEntry** (`LogEntry.js`) - Single log entry display
  - Props: `entry`, `formatDate`, `getIcon`
  - Shows user avatar, name, timestamp, action, and optional metadata
  - Usage: `<LogEntry entry={logEntry} formatDate={formatFn} getIcon={getIconFn} />`

### Component Export Structure
All UI components are exported from `app/components/ui/index.js` for clean imports:
```javascript
import { Card, Button, Select, StatusBadge, ModeIndicator, Pagination, Skeleton } from '@/app/components/ui';
```

Scheduler components from `app/components/scheduler/index.js`:
```javascript
import { TimeBar, ScheduleInterval, DayScheduleCard, DayAccordionItem } from '@/app/components/scheduler';
```

Log components from `app/components/log/index.js`:
```javascript
import { LogEntry } from '@/app/components/log';
```

### Pages
- `/` (`app/page.js`) - Main StovePanel interface for controlling the stove
  - **Dashboard Layout**:
    - Hero: Full-width status card with badge, mode indicator, refresh button
    - Grid: 2 columns on desktop (Quick Actions + Regolazioni), stacked on mobile
    - Footer: Netatmo card (dashed border, "in development" style)
  - Real-time status polling every 5 seconds
  - **Quick Actions**: Large ignite/shutdown buttons with visual status feedback
  - **Regolazioni**: Fan (1-6) and power (0-5) controls with live level display
  - Netatmo temperature display (if available) and connection management in bottom section
  - Scheduler mode indicator with link to scheduler page
  - Force dynamic rendering for real-time data
  - **Loading state**: Shows `Skeleton.StovePanel` during initial data fetch
  - Responsive: max-w-7xl container, grid adapts mobile/desktop
  - Note: Power level 0 available in manual control (allows setting stove to standby while on)
- `/scheduler` (`app/scheduler/page.js`) - Weekly schedule configuration
  - Weekly timeline view (7 days × 24 hours) with interactive TimeBar
  - **Accordion UI**: Collapsible days with preview (time range, intervals count, total hours)
  - **Expand/Collapse controls**: Buttons to expand/collapse all days at once
  - Add/remove time intervals per day
  - Configure power (1-5) and fan (1-6) levels per interval
  - Manual/Automatic mode toggle
  - Semi-manual status display with return time
  - Firebase integration for schedule persistence
  - **Interactive features**:
    - Hover on TimeBar or interval card to see tooltip and highlight both
    - Click to toggle persistent selection
    - Automatic interval sorting by start time
    - Bidirectional linking of adjacent intervals (on blur)
    - Automatic removal of completely overlapped intervals (on blur)
    - Validation: minimum 15-minute interval duration (on blur)
  - **Loading state**: Shows `Skeleton.Scheduler` during initial data fetch
  - **Default state**: All days collapsed on page load for compact view
- `/log` (`app/log/page.js`) - User action logs viewer
  - Real-time display of all user actions from Firebase
  - Shows user information (name/email, avatar)
  - Timestamped entries with action details
  - Icons for different action types (🔥 ignite, ❄️ shutdown, 💨 fan, ⚡ power, ⏰ scheduler, 🌡️ netatmo, 📅 intervals)
  - Pagination (50 entries per page)
  - Reverse chronological order (newest first)
  - **Loading state**: Shows `Skeleton.LogPage` during initial data fetch from Firebase
- `/netatmo/authorized` (`app/netatmo/authorized/page.js`) - Netatmo OAuth success page
  - Confirmation page after Netatmo authorization
  - Shows authorization status

### API Routes Structure
All API routes are in `app/api/` with the following organization:

#### Stove Control (`/api/stove/*`)
- `GET /api/stove/status` - Get current stove status from Thermorossi API
  - Returns: `StatusDescription`, operational state (WORK, START, etc.)
- `POST /api/stove/ignite` - Turn on the stove
  - Triggers semi-manual mode if scheduler is active
  - Sets `returnToAutoAt` to next scheduled change
- `POST /api/stove/shutdown` - Turn off the stove
  - Triggers semi-manual mode if scheduler is active
  - Sets `returnToAutoAt` to next scheduled change
- `POST /api/stove/setFan` - Set fan level (1-6)
  - Body: `{ level: number }`
- `POST /api/stove/setPower` - Set power level (0-5)
  - Body: `{ level: number }`
- `GET /api/stove/getFan` - Get current fan level
  - Returns: `{ Result: number }`
- `GET /api/stove/getPower` - Get current power level
  - Returns: `{ Result: number }`
- `GET /api/stove/settings` - Get all stove settings
  - Calls: `GetSettings/${API_KEY}`
- `POST /api/stove/setSettings` - Update stove settings
  - Body: `{ fanLevel: number, powerLevel: number }`

#### Authentication (`/api/auth/*`)
- `/api/auth/[...auth0]` - Auth0 dynamic routes for login/logout/callback
  - Handled by `@auth0/nextjs-auth0` package

#### Netatmo Integration (`/api/netatmo/*`)
- `POST /api/netatmo/devices` - Get list of Netatmo devices
  - Body: `{ refresh_token: string }`
  - Returns: Array of devices with modules
- `POST /api/netatmo/temperature` - Get temperature from configured device
  - Uses `refresh_token` from Firebase (`netatmo/refresh_token`)
  - Reads `device_id` and `module_id` from Firebase (`netatmo/deviceConfig`)
  - Calls Netatmo `getthermstate` API
  - Saves temperature to Firebase (`netatmo/temperature`)
- `GET /api/netatmo/callback` - OAuth2 callback handler
  - Query param: `code` (authorization code)
  - Exchanges code for refresh token
  - Saves refresh token to Firebase
  - Redirects to `/netatmo/authorized`
- `GET /api/netatmo/devices-temperatures` - Get all devices with temperatures
  - Returns array of all modules with current temperature readings
  - Format: `{ device_id, module_id, name, temperature }`

#### Scheduler System (`/api/scheduler/*`)
- `GET /api/scheduler/check?secret=<CRON_SECRET>` - Cron endpoint for automatic control
  - Called every minute by external cron job
  - Checks scheduler mode (manual/automatic/semi-manual)
  - Returns `MODALITA_MANUALE` if scheduler disabled
  - Returns `MODALITA_SEMI_MANUALE` if waiting for next scheduled change
  - Compares current time with schedule intervals
  - Executes stove commands (ignite/shutdown/setFan/setPower) as needed
  - Clears semi-manual mode when scheduled change is applied
  - Uses `Europe/Rome` timezone for scheduling

#### Logging (`/api/log/*`)
- `POST /api/log/add` - Add user action log entry to Firebase
  - Body: `{ action: string, value?: any, ...metadata }`
  - Automatically adds:
    - `timestamp`: Current timestamp (Date.now())
    - `user`: Auth0 user object with email, name, picture, sub
    - `source`: Always 'user' for manual actions
  - Only tracks manual user actions (not automated scheduler actions)
  - Saves to `log/` path in Firebase

#### User Management (`/api/user/*`)
- `GET /api/user` - Get current authenticated user info
  - Returns Auth0 session user object
  - Returns `{ user: null }` if not authenticated

### External Integrations
- **Thermorossi Cloud API** (`lib/stoveApi.js`) - Contains API endpoints and key for stove control
- **Firebase Realtime Database** (`lib/firebase.js`) - Used for logging stove operations and scheduler data storage
- **Auth0** - User authentication and session management with middleware protection
- **Netatmo API** - Temperature monitoring from smart thermostats

### Logging System
- **Log Service** (`lib/logService.js`) - Centralized logging service for user actions
  - `logUserAction(action, value?, metadata?)` - Generic logging function
  - `logStoveAction` - Pre-configured functions for stove operations:
    - `ignite()`, `shutdown()`, `setFan(level)`, `setPower(level)`
  - `logSchedulerAction` - Pre-configured functions for scheduler operations:
    - `toggleMode(enabled)`, `updateSchedule(day)`, `addInterval(day)`, `removeInterval(day, index)`, `clearSemiManual()`
  - `logNetatmoAction` - Pre-configured functions for Netatmo operations:
    - `connect()`, `disconnect()`, `selectDevice(deviceId)`
  - All logs automatically include Auth0 user information (email, name, picture, sub)
  - Only tracks manual user actions, not automated scheduler actions
  - Usage: `import { logStoveAction } from '@/lib/logService'`

### Route Management System
- **Route Configuration** (`lib/routes.js`) - Centralized API route definitions
  - All API routes are defined in a single source of truth
  - Prevents hardcoded URLs throughout the codebase
  - Makes route changes easier to manage and maintain

  **Exported Constants:**
  - `STOVE_ROUTES`: All stove control endpoints
    - `status`, `ignite`, `shutdown`, `getFan`, `getPower`, `setFan`, `setPower`, `getSettings`, `setSettings`
  - `SCHEDULER_ROUTES`: Scheduler system endpoints
    - `check(secret)` - Function that returns cron endpoint with secret parameter
  - `NETATMO_ROUTES`: Netatmo integration endpoints
    - `devices`, `temperature`, `callback`, `devicesTemperatures`
  - `LOG_ROUTES`: Logging endpoints
    - `add`
  - `USER_ROUTES`: User management endpoints
    - `me`
  - `AUTH_ROUTES`: Authentication endpoints
    - `login`, `logout`, `callback`, `me`
  - `API_ROUTES`: Combined export of all route groups

  **Usage Examples:**
  ```javascript
  // Frontend component
  import { STOVE_ROUTES, LOG_ROUTES } from '@/lib/routes';

  await fetch(STOVE_ROUTES.status);
  await fetch(STOVE_ROUTES.ignite, { method: 'POST' });
  await fetch(LOG_ROUTES.add, { method: 'POST', body: JSON.stringify(data) });
  ```

  ```javascript
  // Backend endpoint
  import { STOVE_ROUTES } from '@/lib/routes';

  const response = await fetch(`${baseUrl}${STOVE_ROUTES.status}`);
  ```

### Firebase Structure
- `stoveScheduler/{day}` - Weekly schedule data (Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato, Domenica)
  - Each day contains array of time ranges with: `start`, `end`, `power` (1-5), `fan` (1-6)
  - Intervals are automatically sorted by start time before saving
  - Note: Power level 0 not used in scheduler (stove would be off)
- `stoveScheduler/mode` - Scheduler mode state object:
  - `enabled`: boolean (manual/automatic toggle)
  - `timestamp`: when mode was last changed
  - `semiManual`: boolean (temporary manual override)
  - `returnToAutoAt`: ISO timestamp for automatic return to scheduled mode
- `log/` - User action logs with full traceability:
  - `action`: Description of the action performed
  - `value`: Optional value associated with action (e.g., fan level)
  - `timestamp`: Unix timestamp (Date.now())
  - `user`: Auth0 user object:
    - `email`: User email address
    - `name`: User display name
    - `picture`: User avatar URL
    - `sub`: Auth0 user ID
  - `source`: Always 'user' for manual actions
  - Additional metadata fields (e.g., `day` for scheduler actions)
- Firebase uses client SDK for all operations (no Admin SDK currently)

### Key Configuration
- PWA enabled via `next-pwa` plugin (disabled in development)
- **Tailwind CSS** for styling with custom design system
- App Router architecture (Next.js 15)
- Force dynamic rendering on main page for real-time data

### Design System (Tailwind)
Modern, minimal design with warm color palette reflecting the stove's purpose:
- **Primary** (red #ef4444): Fire/heat theme, used for critical actions and error states
- **Accent** (orange #f97316): Warmth emphasis, used for manual mode and secondary highlights
- **Neutral** (grays): Text, backgrounds, and borders
- **Success** (green #10b981): Positive states, stove working, automatic mode
- **Warning** (yellow #f59e0b): Semi-manual mode, standby states
- **Info** (blue #3b82f6): Information and links

Custom utility classes in `app/globals.css`:
- `.card`: Modern white cards with soft shadow and border
- `.btn-primary`, `.btn-secondary`: Consistent button styles
- `.input-modern`, `.select-modern`: Form controls with custom styling
- `@keyframes shimmer`: Animation for Skeleton loading states (1.5s ease-in-out infinite)
- Gradient background on body for depth
- Mobile-first responsive approach throughout

### Environment Variables Required
- Firebase config variables (`NEXT_PUBLIC_FIREBASE_*`)
- Auth0 configuration (`AUTH0_*`)
- Netatmo API credentials (`NEXT_PUBLIC_NETATMO_*`, `NETATMO_*`)
- `CRON_SECRET=cazzo` - Secret for scheduler cron endpoint authentication

## Important Notes

- The stove API key is hardcoded in `lib/stoveApi.js:15` - consider moving to environment variables for security
- Main component uses polling every 5 seconds for status updates
- PWA configuration generates service worker in `public/` directory
- Italian language interface ("it" locale)
- All UI text and labels are in Italian
- Theme color for PWA: `#ef4444` (primary red)
- **Route system**: All API routes are centralized in `lib/routes.js` for consistency
  - Frontend components import routes from this file
  - Backend endpoints also use the same route definitions
  - Makes route changes easier to manage and prevents hardcoded URLs

## Component Architecture Philosophy

### Component Strategy
The application follows a **balanced component approach**:
- **Atomic UI components** (`app/components/ui/`) for basic elements (Card, Button, Input, Select, etc.)
- **Composite domain components** (`app/components/scheduler/`, `app/components/log/`) for feature-specific functionality
- **Presentation-focused**: Components handle UI and user interaction, business logic stays in parent components
- **Prop-based communication**: All data and callbacks passed via props, no internal state for data fetching

### When to Create New Components
✅ **DO create components for:**
- Repeated UI patterns across multiple pages
- Complex UI sections that benefit from encapsulation
- Elements that need variant support (buttons, badges, etc.)
- Standalone features that can be tested independently

❌ **DON'T create components for:**
- One-off UI sections used in a single place
- Trivial wrappers that don't add value
- Over-abstracting simple HTML structures

### Component Best Practices
- **Props over configuration**: Pass behavior via props, not internal config
- **Composition over inheritance**: Combine small components to build complex ones
- **Single responsibility**: Each component should do one thing well
- **Predictable props**: Use consistent naming (e.g., `onClick`, `onChange`, `className`)
- **Forward ...props**: Allow parent to override any HTML attributes
- **TypeScript-ready**: Structure components for easy future TypeScript migration

## UI/UX Guidelines

When modifying components, maintain these design principles:
- **Mobile-first**: Always design for mobile screens first, then scale up
- **Consistent spacing**: Use Tailwind spacing scale (gap-2, gap-4, p-6, p-8, etc.)
- **Icon usage**: Emoji icons throughout for visual clarity and simplicity
- **Color semantics**: Follow the design system colors for consistent meaning
- **Smooth transitions**: All interactive elements should have `transition-all duration-200`
- **Card-based layout**: Main content areas use the `.card` utility class
- **Active states**: Buttons should have hover, active, and disabled states clearly defined
- **Accessibility**: Maintain proper contrast ratios and semantic HTML
- **Reusable components**: Always use existing UI components from `app/components/ui/` instead of duplicating styles
- **Visual hierarchy**: Use size and spacing to create clear information hierarchy
  - Hero sections: Large text (text-3xl), prominent icons (text-6xl), ample padding (p-8)
  - Action buttons: Increased height for touch targets (h-24 for primary actions)
  - Status feedback: Immediate visual confirmation below actions (✓/○ indicators)
  - Live data display: Large numbers with labels (text-2xl for values, text-sm for labels)
- **Dashboard layouts**: Use responsive grids (lg:grid-cols-2, lg:grid-cols-3) with mobile stacking
- **Development states**: Mark incomplete features with dashed borders and "In fase di sviluppo" labels
- **Loading states**: All pages/components that fetch external data should implement skeleton loading states
  - Use component-specific skeletons (`Skeleton.StovePanel`, `Skeleton.Scheduler`, `Skeleton.LogPage`)
  - Loading states should occupy the exact space of the final content
  - Only show skeleton during initial data fetch, not on subsequent updates
  - Pattern: Add `loading` state, show skeleton if `loading === true`, set to `false` in `finally` block

## Scheduler System

### Manual/Automatic Mode
- **Manual Mode** 🔧: User controls stove directly via StovePanel interface (accent color)
- **Automatic Mode** ⏰: Cron job controls stove based on weekly schedule (success color)
- **Semi-Manual Mode** ⚙️: Temporary manual override with automatic return scheduled (warning color)
- Mode toggle available in `/scheduler` page with visual indication
- Current mode displayed on home page with corresponding icon and color coding
- `semiManualMode` state with `returnToAutoAt` timestamp for automatic return

### Cron Integration
- External cron calls `/api/scheduler/check?secret=cazzo` every minute
- Route checks scheduler mode before executing any stove actions
- If mode disabled, returns "MODALITA_MANUALE" status
- Automatic ignition/shutdown and fan/power level adjustments when enabled

### Components
- `lib/schedulerService.js` - Firebase operations for schedule and mode management
  - `saveSchedule(day, schedule)` - Save day's schedule to Firebase
  - `getWeeklySchedule()` - Fetch all 7 days of schedule
  - `setSchedulerMode(enabled)` - Toggle automatic/manual mode
  - `getFullSchedulerMode()` - Get complete mode state including semi-manual
  - `setSemiManualMode(returnToAutoAt)` - Enable semi-manual with return time
  - `clearSemiManualMode()` - Exit semi-manual mode
  - `getNextScheduledChange()` - Calculate next scheduled time change
- `app/scheduler/page.js` - Weekly schedule configuration interface
  - Visual timeline bar showing 24-hour schedule per day
  - Add/remove time intervals with power and fan settings
  - Mode toggle between manual/automatic
  - Shows semi-manual status and return time if active
- `app/components/StovePanel.js` - Home interface with mode indication
  - Real-time status display with dynamic colors
  - Manual control buttons (ignite/shutdown)
  - Fan level (1-6) and power level (0-5) controls
  - Netatmo connection management
  - Mode indicator with link to scheduler
- `app/api/scheduler/check/route.js` - Cron endpoint for automatic control
  - Called every minute by external cron
  - Checks current time against schedule
  - Executes stove commands based on schedule
  - Respects manual mode (returns "MODALITA_MANUALE")

### Scheduler Validation Logic
The scheduler implements smart validation and synchronization rules:

#### Interval Sorting
- All intervals are automatically sorted by start time (ascending)
- Sorting occurs at: data load from Firebase, after adding new interval, and on blur of time fields
- During typing (onChange), no sorting to preserve input focus and avoid index shifts

#### Time Validation (on blur only)
- **Minimum duration**: End time must be > start time by at least 15 minutes
- **Auto-increment**: If end ≤ start, end is automatically set to start + 15 minutes
- Validation triggers only when user leaves the time field (onBlur), not during typing

#### Adjacent Interval Linking (bidirectional, on blur only)
When modifying time boundaries:
- **Start time change**: If previous interval's end was equal to old start → previous end updates to new start
- **End time change**: If next interval's start was equal to old end → next start updates to new end
- **Gap creation allowed**: If you create a time gap between intervals, it stays (no automatic closing)
- **Example**: Intervals 08:00-12:00 and 12:00-16:00
  - Change first end to 13:00 → second becomes 13:00-16:00
  - Change first end to 11:00 → second stays 12:00-16:00 (gap: 11:00-12:00)

#### Overlap Detection and Removal (on blur only)
- When an interval is extended to completely contain another interval, the contained one is automatically removed
- **Example**: Intervals 08:00-12:00, 14:00-16:00, 18:00-20:00
  - Extend first to 08:00-19:00 → middle interval (14:00-16:00) is deleted
  - Last interval stays because only partially overlapped

#### Power and Fan Levels
- **Power**: Levels 1-5 (Level 0 removed from scheduler as stove would be off during scheduled operation)
- **Fan**: Levels 1-6
- Changes to power/fan trigger save on blur but don't affect time-based validations

#### onChange vs onBlur Behavior
- **onChange** (during typing):
  - Updates local state only
  - No validation
  - No sorting
  - No linking with adjacent intervals
  - No Firebase save
  - Visual feedback only

- **onBlur** (when leaving field):
  - Validates end > start (+15min minimum)
  - Links adjacent intervals if applicable
  - Removes completely overlapped intervals
  - Sorts all intervals
  - Saves to Firebase
  - Updates semi-manual returnToAutoAt if in semi-manual mode (for time fields only)

This design ensures smooth typing experience while maintaining data integrity.

## Security & Middleware

- Auth0 middleware (`middleware.js`) protects all routes except:
  - `/api/auth/*` - Authentication endpoints
  - `/api/scheduler/check` - Cron endpoint (protected by CRON_SECRET)
  - `/api/stove/*` - Stove control endpoints
  - Static assets (`_next`, `favicon.ico`)

## Firebase Permissions Issue

- Current Firebase rules may block write access to `stoveScheduler/mode`
- Error: "PERMISSION_DENIED: Permission denied"
- Solution: Update Firebase security rules or implement Firebase Admin SDK for server operations