# Chat Application with Admin Dashboard

## Overview

This is a full-stack chat application built with React and Express, featuring an AI-powered chatbot with comprehensive admin management capabilities. The application provides a customer-facing chat interface and a secure admin dashboard for managing content, AI instructions, and system settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with comprehensive CRUD operations

### Database Strategy
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Connection**: Connection pooling with @neondatabase/serverless
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Chat System
- **AI Integration**: OpenAI GPT-4 for intelligent responses
- **Message Management**: Session-based conversation tracking
- **Context Awareness**: Smart suggestions based on conversation patterns
- **Quick Actions**: Predefined responses for common queries
- **File Attachments**: Support for PDF and image uploads

### Admin Dashboard
- **Content Management**: Documents, AI instructions, quick actions
- **User Management**: Secure authentication with password hashing
- **Analytics**: Chat completion tracking and reporting
- **File Management**: Upload and organize business documents
- **System Configuration**: AI behavior settings and response templates

### Authentication System
- **Strategy**: Local username/password authentication
- **Security**: Scrypt password hashing with salt
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Authorization**: Role-based access control for admin features

## Data Flow

1. **User Interaction**: Customer sends message through chat interface
2. **Context Analysis**: System analyzes conversation for intent and context
3. **AI Processing**: OpenAI API generates response using business context
4. **Response Enhancement**: System adds relevant quick actions and suggestions
5. **Storage**: Messages and session data stored in PostgreSQL
6. **Admin Monitoring**: Completed chats tracked for analytics

### Database Schema
- **Users**: Admin authentication and management
- **Chat Messages**: Conversation history with session tracking
- **Documents**: Business knowledge base for AI context
- **AI Instructions**: Customizable AI behavior and responses
- **Quick Actions**: Predefined responses and suggestions
- **File Assets**: Uploaded documents and media files

## External Dependencies

### Core Technologies
- **OpenAI API**: GPT-4 integration for intelligent responses
- **Neon Database**: Serverless PostgreSQL hosting
- **SendGrid**: Email service integration (configured but not actively used)

### Development Tools
- **Vite**: Frontend build tool with hot reload
- **Drizzle Kit**: Database schema management
- **TypeScript**: Type safety across the entire stack
- **ESLint/Prettier**: Code quality and formatting

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **React Hook Form**: Form handling with validation

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles server code to `dist/index.js`
3. **Database**: Drizzle pushes schema changes to PostgreSQL

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Optimized builds with static file serving
- **Database**: Environment-based connection strings
- **API Keys**: Secure environment variable management

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── dist/           # Build output
```

### Session Management
- PostgreSQL-backed sessions for scalability
- Configurable session timeouts and security settings
- Cross-request state persistence for complex workflows

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, making it maintainable and scalable for future enhancements.