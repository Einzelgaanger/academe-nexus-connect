
# Stratizens - Educational Platform

Stratizens is a comprehensive web application built for Strathmore University students to access course materials, participate in discussions, and collaborate with peers and lecturers in a centralized digital environment.

## Project Overview

This platform serves as a central hub for educational resources and collaboration, providing features like:

- User authentication for students and administrative roles
- Course content management organized by units
- File uploads and sharing
- Social interaction through comments and likes
- Gamification through points and ranking system
- Profile customization and settings

## Technical Architecture

### Frontend

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **Routing**: React Router v6
- **State Management**: Context API for authentication, React Query for data fetching
- **Component Structure**: Modular components with clear separation of concerns

### Backend

- **Database & Auth**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for file management
- **API**: RESTful endpoints through Supabase clients

## Core Features

### Authentication System

The authentication system uses a custom implementation with Supabase:

- Multi-role support (students, admins, super admins)
- Session persistence with localStorage
- Protected routes with role-based access control
- Password management with default password detection

### Content Management

Content is organized by:

- Units/courses
- Content types (notes, assignments, past papers)
- User contributions

### User Interaction

- Comments on content
- Likes/dislikes on content
- Points system for engagement and contributions

## Project Structure

```
stratizens/
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/           # Context providers (auth, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   ├── pages/              # Page components
│   ├── routes/             # Routing configuration
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── .env                    # Environment variables
```

## Key Components

### Auth Context

The `AuthContext` provides authentication state and methods throughout the application:

- User data
- Class instance data
- Login/logout functionality
- Points management

### Routing

The application uses React Router with a centralized routing configuration (`AppRoutes.tsx`) that includes:

- Public routes (login, index)
- Protected routes (dashboard, unit content, etc.)
- Not found handling

### Database Schema

The database is structured with the following main tables:

- `users`: User profiles, credentials, and metadata
- `class_instances`: Course groupings and metadata
- `content`: Educational resources and materials
- `comments`: User interactions on content
- `likes`: User reactions to content
- `announcements`: System and instructor announcements

## Environment Setup

The application requires the following environment variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Critical Integration Points and Potential Issues

### Router and Auth Context Relationship

**IMPORTANT**: The `AuthProvider` must be wrapped by `BrowserRouter` for the navigation to work properly. This ensures that the `useNavigate` hook can be used within the auth context.

Correct setup in App.tsx:
```jsx
<QueryClientProvider>
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
</QueryClientProvider>
```

Common errors:
- `useNavigate() may be used only in the context of a <Router> component`: This occurs when trying to use `useNavigate` in a component that is not wrapped by `BrowserRouter`.

### Supabase Connection

**IMPORTANT**: The Supabase URL and anonymous key must be valid for the application to function. Invalid values will result in runtime errors.

Common errors:
- `Failed to construct 'URL': Invalid URL`: This occurs when the Supabase URL is invalid or missing.
- Connection failures can occur if the anonymous key is incorrect.

### File Upload Considerations

When implementing file uploads to Supabase Storage:

- The `onUploadProgress` property is not supported in the current Supabase Storage API. Progress tracking must be implemented differently.
- Ensure proper bucket policies are configured in Supabase.

## Development Workflow

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with Supabase credentials
4. Run the development server: `npm run dev`

## Deployment

### Supabase Setup Requirements

1. Create the required tables using the schema in `supabase/schema.sql`
2. Configure storage buckets:
   - `content-files`: For educational content
   - `profile-pictures`: For user avatars
   - `announcement-media`: For announcement attachments
3. Set appropriate bucket policies for read/write access

### Frontend Deployment

The application can be deployed on various platforms:

1. **Render**: Recommended for simplicity
   - Set build command: `npm install && npm run build`
   - Start command: `npm run serve`
   - Add environment variables

2. **Vercel/Netlify**: Alternative options with similar setup

## Testing

For testing login functionality during development:

- Default super admin: `000000`
- Default admin: `000001`
- Any student admission number from the database
- Any password (authentication is simulated for demo)

## Common Issues and Solutions

1. **Authentication Errors**:
   - Ensure Supabase credentials are correct
   - Check that `AuthProvider` is wrapped with `BrowserRouter`
   - Verify localStorage is accessible

2. **Routing Issues**:
   - Make sure all paths in `AppRoutes.tsx` are correct
   - Verify `ProtectedRoute` is used for secure pages

3. **File Upload Errors**:
   - Check Supabase bucket configurations
   - Ensure file size limits are appropriate
   - Verify CORS settings if accessing from different domains

4. **Type Errors**:
   - Ensure consistent types are used throughout the application
   - Check that Supabase types match your database schema

## Future Enhancements

Potential areas for expansion:

- Real-time notifications with Supabase Realtime
- Enhanced analytics for instructors
- Mobile application with React Native
- Integration with LMS platforms

## Contributing

Guidelines for contributing:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with a clear description of changes

## License

[Your chosen license]
