# Sociee

Sociee is a React viewer portal and an Express/MongoDB creator dashboard.

## Requirements

- Node.js 20 or newer
- MongoDB Atlas cluster (or local MongoDB for development)
- A MongoDB database user with access to the application database

## Local development

1. Install frontend dependencies from the project root:

   ```sh
   npm install
   ```

2. Configure the backend:

   ```sh
   cd backend
   npm install
   ```

   Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` to the MongoDB connection string and replace `JWT_SECRET` with a long random secret. Never commit `.env` files.

3. Start the API in `backend`:

   ```sh
   npm start
   ```

   The API listens on port 5000 by default. Check `http://localhost:5000/health`.

4. In a separate terminal, start the React app from the project root:

   ```sh
   npm start
   ```

   The frontend uses `http://localhost:5000/api` by default. To override this, copy `.env.example` to `.env.local` and set `REACT_APP_API_URL`.

5. Open `/login` to sign in or choose **Create account** to register another creator. Use a unique email address and a password of at least 12 characters. Each creator account has its own private content-management dashboard; published content remains public in the viewer portal. If you forget your login, register another account to start a separate workspace. Password recovery by email is not configured.

Existing content is not deleted. On backend startup, unowned legacy content is assigned to the oldest creator account; new registrations get their own workspace. If you create a new account because you forgot the old credentials, the old account's drafts and management data remain attached to that old account and are not transferred.

## API overview

Public:

- `GET /health`
- `GET /api/profile`
- `GET /api/profile/:creatorId` (public creator profile and published-post engagement counts)
- `GET /api/profile/me` and `PUT /api/profile/me` (view and update the signed-in creator profile)
- `GET /api/contents`
- `GET /api/contents/:id`
- `POST /api/contents/:id/view`
- `GET /api/media/:id` (view an uploaded public media file)
- `GET /api/comments/:contentId`
- `POST /api/comments`
- `POST /api/likes`
- `GET /api/auth/setup-status`
- `POST /api/auth/register` (create a creator account)
- `POST /api/auth/setup` (backward-compatible account registration route)
- `POST /api/auth/login`

Creator-only (JWT bearer token required):

- `GET /api/contents?all=true`
- `POST /api/contents`
- `POST /api/media/upload` (upload up to 10 device files, maximum 12 MB each)
- `PUT /api/contents/:id`
- `DELETE /api/contents/:id`
- `GET /api/comments`
- `PATCH /api/comments/:id`
- `DELETE /api/comments/:id`
- `GET /api/dashboard/stats`

Creators can upload up to 10 photos/videos/audio files with each content item from their device (12 MB per file); files are stored in MongoDB so they persist with the application data. Each creator can also save a profile name, bio, and uploaded profile picture from the dashboard; public posts show the creator name, profile picture, and publication time. Comments are submitted as pending and are only shown publicly after creator approval. Scheduled content is published automatically when its scheduled time arrives.

Viewers can open a creator profile from a post or the navigation profile chip. The public profile displays the creator's profile details, published posts, and each post's likes and approved-comment count; opening a post provides the like and comment actions.

## Tests and production build

From the project root:

```sh
npm test -- --watchAll=false
npm run build
```

Backend syntax can be checked with:

```sh
cd backend
node --check server.js
```

## Deployment

Deploy the backend folder as a Node web service (for example on Render), with build command `npm install` and start command `npm start`. Configure `MONGODB_URI`, a strong persistent `JWT_SECRET`, `NODE_ENV=production`, `PORT` (if required by the host), and `FRONTEND_URL` with the deployed frontend origin. For multiple frontend domains, `FRONTEND_URL` accepts comma-separated origins.

Deploy the React project root (for example to Vercel or Netlify), with build command `npm run build`, publish directory `build`, and `REACT_APP_API_URL` set to the deployed API base URL ending in `/api`. Configure the host to rewrite unknown routes to `index.html` so React Router routes load on refresh.

After deployment, register a creator account through the public login page and test the public content, creator login, and moderation flows. A deployed URL and GitHub repository must be supplied separately; this project cannot publish itself without the relevant accounts and permissions.
