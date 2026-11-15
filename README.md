# Taskflow, Personal Task Manager

A lightweight task management app built with Next.js, React and TypeScript. It is designed for deployment on Vercel and version control with GitHub.

## Features

- Create, edit and delete tasks
- Add descriptions and project/category names
- Set start dates and due dates
- Set Low, Medium or High priority
- Track status: Not started, In progress or Completed
- Track progress from 0% to 100%
- Dashboard with total, in-progress, completed and overdue counts
- Overall completion percentage
- Views for My day, Upcoming, Overdue, In progress and Completed
- Search and sort tasks
- Automatic due-today, due-soon and overdue labels
- Saves tasks in the browser using localStorage

## Run locally

1. Install Node.js (LTS).
2. Extract this ZIP and open the project folder in a terminal.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Deploy with GitHub and Vercel

1. Create a new repository on GitHub.
2. Upload the contents of this project folder to the repository. The `package.json` file should be at the repository root.
3. Sign in to Vercel and choose **Add New → Project**.
4. Import your GitHub repository.
5. Keep the detected framework as **Next.js** and click **Deploy**.
6. Vercel will build and publish the app. Future pushes to the connected branch can trigger deployments automatically.

No environment variables or database setup are required for this starter version.

## Important data note

This version stores tasks in the browser where the app is being used. It does not sync tasks between different browsers, devices or users. Clearing browser storage can remove saved tasks. For multi-device access, user accounts, cloud backup and shared task updates, connect a database such as Supabase or Neon in a future version.

## Suggested next enhancements

- Cloud database and sign-in
- Email or browser push reminders
- Recurring tasks
- Subtasks and task comments
- Weekly/monthly calendar view
- Export tasks to CSV
