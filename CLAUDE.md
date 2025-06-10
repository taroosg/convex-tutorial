# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start both backend and frontend in parallel
- `npm run dev:backend` - Start only the Convex backend development server  
- `npm run dev:frontend` - Start only the Vite frontend development server
- `npm run build` - Build the project (TypeScript compilation + Vite build)
- `npx convex dev` - Run Convex backend development server
- `npx convex dev --once` - Run Convex once (used in predev script)

## Architecture Overview

This is a chat application built with Convex (backend-as-a-service) and React/Vite frontend:

**Backend (Convex):**
- Functions are defined in `convex/chat.ts`
- Uses Convex's query/mutation/action pattern
- Database operations use `ctx.db` API
- Special `/wiki` command triggers Wikipedia API integration via scheduled actions

**Frontend (React/Vite):**
- Main chat interface in `src/App.tsx`
- Uses Convex React hooks (`useQuery`, `useMutation`)
- Real-time updates through Convex subscriptions
- Fake user names generated with Faker.js

**Key Patterns:**
- Queries for reading data (`getMessages`)
- Mutations for writing data (`sendMessage`) 
- Internal actions for external API calls (`getWikipediaSummary`)
- Scheduler for async operations

The app demonstrates real-time chat with Wikipedia integration when messages start with `/wiki`.