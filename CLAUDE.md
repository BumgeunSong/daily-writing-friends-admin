# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Admin dashboard for Daily Writing Friends platform - a social writing platform where users write daily, interact through comments, and participate in writing communities/boards.

**Tech Stack**: Next.js 15 + React 18 + TypeScript + Firebase + Tailwind CSS + shadcn/ui

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Production server  
npm run start

# Lint code
npm run lint
```

## Project Architecture

### Core Structure
- **Next.js App Router** with TypeScript and strict mode
- **Firebase integration**: Auth (Google OAuth), Firestore, FCM (push notifications), Admin SDK
- **State Management**: TanStack React Query v5 for server state
- **UI**: shadcn/ui components with Tailwind CSS v4, Radix UI primitives, Lucide icons
- **Authentication**: Admin-only access with automatic redirection

### Key Directories
```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   │   ├── boards/        # Board management
│   │   ├── messaging/     # FCM messaging admin  
│   │   ├── posts/         # Post management
│   │   ├── user-approval/ # User approval workflow
│   │   └── users/         # User management
│   ├── api/               # API routes (FCM endpoint)
│   └── login/             # Authentication page
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── apis/                 # API client functions
```

## Database Schema (Firestore)

### Main Collections
- **users**: User profiles with subcollections for notifications, writing histories, postings, comments, FCM tokens
- **boards**: Writing communities with posts, comments, replies, reviews

### Key Relationships
- Users have board permissions (read/write/admin)
- Posts belong to boards and users  
- Complex notification system tracking user interactions
- FCM token management for push notifications

## Configuration

### TypeScript Config
- Path aliases: `@/*` → `./src/*`
- Strict mode enabled

### shadcn/ui Setup
- New York style configuration
- Components in `src/components/ui/`

### Required Environment Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## Development Patterns

### Custom Hooks
- `useAuth`: Authentication state management
- `useCollection`/`useDocument`: Firestore data fetching  
- `useAllFCMTokens`: FCM token management

### Component Organization
- Separation of UI components (`components/ui/`) and feature components (`components/admin/`)
- Responsive design with mobile-first approach
- Consistent shadcn/ui design system usage

### Type Safety
- Comprehensive TypeScript types for Firestore schema
- Proper Firebase Timestamp handling
- Strong typing for all data structures

## Key Features

### User Management
- User approval workflow for new registrations
- User information management
- Board permission management per user

### Content Management  
- Board (writing community) management
- Post management and moderation
- Comment and reply oversight

### FCM Integration
- Push notification management
- Device token tracking and management  
- Bulk messaging capabilities

### Dashboard
- Admin dashboard with navigation sidebar
- User activity tracking (writing histories, postings, commenting)
- Responsive design for mobile and desktop

## Code Quality Tools

- **ESLint**: Next.js + TypeScript + Prettier integration
- **PostCSS**: With Tailwind CSS setup
- **TypeScript**: Strict mode with comprehensive typing

Use `npm run lint` before committing changes to ensure code quality.