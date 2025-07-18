# OutboundAI - Replit Configuration

## Overview

OutboundAI is a modern full-stack web application designed for AI-powered outbound marketing automation. The application helps businesses manage prospects, create automated sequences, score leads, and integrate with various marketing tools. Built with a React frontend and Express.js backend, it leverages PostgreSQL for data persistence and integrates with OpenAI for intelligent features.

## User Preferences

Preferred communication style: Simple, everyday language.

**Project Focus:**
- Solving tedious lead identification processes for sales teams (account-based marketing)
- Enabling continual outreach and full-cycle outbound programs
- Providing customizable lead scoring tailored to client needs
- Targeting enterprise and mid-market brands with 50M+ sales
- Focus on heads of social, marketing, community roles

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Build Process**: esbuild for production bundling

### Design System
- **Component Library**: shadcn/ui (New York variant)
- **CSS Framework**: Tailwind CSS with custom IBM Design System colors
- **Typography**: IBM Plex Sans font family
- **Theme**: Light mode with neutral base colors and IBM blue primary

## Key Components

### Database Schema (Drizzle ORM)
The application uses a comprehensive schema with the following main entities:
- **Users**: Authentication and user management
- **Prospects**: Lead information with scoring and engagement tracking
- **Sequences**: AI-powered outreach campaigns with steps and targeting
- **Activities**: Audit trail of all system actions
- **Integrations**: Third-party service connections
- **Lead Scoring Rules**: Configurable scoring criteria

### Core Features
1. **Dashboard**: Real-time metrics and activity overview
2. **Lead Pipeline**: Prospect management and tracking
3. **AI Sequences**: Automated outreach campaign creation
4. **Lead Scoring**: AI-powered prospect qualification
5. **Integrations**: Connections to Apollo, Clay, SmartLead, RB2B
6. **Analytics**: Performance reporting and insights

### Storage Layer
- **Interface**: IStorage abstraction for data operations
- **Implementation**: DatabaseStorage using direct Drizzle ORM queries
- **Database**: PostgreSQL with connection pooling via Neon Database
- **Migrations**: Drizzle Kit for schema management
- **CSV Upload**: Full support for prospect import with validation and duplicate checking

## Data Flow

### Client-Side Data Flow
1. React components use TanStack Query for API calls
2. Query client handles caching, background updates, and error states
3. API requests use custom fetch wrapper with error handling
4. UI components automatically update when data changes

### Server-Side Data Flow
1. Express routes handle incoming API requests
2. Route handlers validate input using Zod schemas
3. Storage layer abstracts database operations
4. OpenAI service integration for AI-powered features
5. Response data formatted and returned to client

### AI Integration Flow
1. Lead scoring triggered on prospect creation/update
2. OpenAI GPT-4 analyzes prospect data for scoring
3. Personalized outreach generation based on prospect information
4. Intent analysis for high-value prospect identification

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm with drizzle-kit for migrations
- **Validation**: Zod for schema validation
- **AI**: OpenAI SDK for GPT-4 integration
- **UI**: Radix UI primitives and shadcn/ui components

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full type safety across frontend and backend
- **Styling**: PostCSS with Tailwind CSS and Autoprefixer
- **Linting**: Built-in TypeScript checking

### Third-Party Integrations
- **Apollo**: Lead data sourcing
- **Clay**: Data enrichment
- **SmartLead**: Email automation
- **RB2B**: Website visitor identification
- **OpenAI**: AI-powered features

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Environment variable configuration
- **Hot Reload**: Full-stack development with live updates

### Production Build
- **Frontend**: Vite production build to dist/public
- **Backend**: esbuild bundling to dist/index.js
- **Static Assets**: Served by Express in production
- **Environment**: NODE_ENV-based configuration

### Database Management
- **Schema**: Centralized in shared/schema.ts
- **Migrations**: Generated in ./migrations directory
- **Deployment**: `db:push` command for schema updates
- **Connection**: Environment variable-based configuration

### Replit Integration
- **Development**: Replit-specific Vite plugins for debugging
- **Banner**: Development mode banner injection
- **Cartographer**: File mapping for Replit environment
- **Error Overlay**: Runtime error modal for development

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and integrated AI capabilities for intelligent marketing automation.