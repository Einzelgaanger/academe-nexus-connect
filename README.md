
# Stratizens - Educational Platform

Stratizens is a web application for Strathmore University students to access course materials, participate in discussions, and collaborate with peers and lecturers.

## Features

- User authentication for students, lecturers, and super admins
- Unit-specific content management (notes, assignments, past papers)
- File uploads to Supabase Storage
- Comments and likes on content
- Points and ranking system for engagement
- Profile management
- Responsive design

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- Shadcn UI components
- React Router for navigation
- Tanstack React Query for data fetching
- Supabase for backend, storage, and database

## Deployment Guide for Render

1. **Create a Render account**: Sign up at [render.com](https://render.com)

2. **Create a new Web Service**:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Name your service, e.g., "stratizens"

3. **Configure the build settings**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run serve`
   - Environment: Node
   - Node Version: 18 (or latest LTS)

4. **Set environment variables**:
   - Add the following environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

5. **Deploy the service**:
   - Click "Create Web Service"
   - Wait for the build and deployment to complete

6. **Set up the database**:
   - Log in to your Supabase dashboard
   - Navigate to the SQL Editor
   - Create a new query
   - Paste the contents of the `supabase/schema.sql` file
   - Run the query to set up the database schema

7. **Configure Storage Buckets**:
   - In your Supabase dashboard, go to Storage
   - Make sure the following buckets are created:
     - `content-files`
     - `profile-pictures` 
     - `announcement-media`
   - Check that the bucket policies allow public access for reading and authenticated access for writing

8. **Update your Supabase settings**:
   - Go to Authentication → URL Configuration
   - Add your Render deployment URL to the Site URL and Redirect URLs

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Login Instructions

- Use any admission number from the database and any password (authentication is simulated for demo purposes)
- Default super admin: `000000`
- Default admin: `000001` 
