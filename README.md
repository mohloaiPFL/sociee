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
- `POST /api/media/upload` (upload one device file at a time, maximum 3 MB)
- `PUT /api/contents/:id`
- `DELETE /api/contents/:id`
- `GET /api/comments`
- `PATCH /api/comments/:id`
- `DELETE /api/comments/:id`
- `GET /api/dashboard/stats`

Creators can upload one photo/video/audio file at a time from their device (3 MB maximum); files are stored in MongoDB so they persist with the application data. Each creator can also save a profile name, bio, and uploaded profile picture from the dashboard; public posts show the creator name, profile picture, and publication time. Comments are submitted as pending and are only shown publicly after creator approval. Scheduled content is published when the public content API is requested after its scheduled time.

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

Deploy the repository root to Vercel on the Hobby plan. `vercel.json` installs both frontend and backend dependencies, builds the React app, and serves the Express API through `api/[...path].js`. Configure these server-side Vercel environment variables:

- `MONGODB_URI`: the MongoDB Atlas connection string; do not use a `REACT_APP_` prefix.
- `JWT_SECRET`: a strong, persistent random secret.
- `NODE_ENV`: `production`.

The React app uses same-origin `/api` requests in production, so `REACT_APP_API_URL` is not required. Vercel Hobby limits function request/response payloads; media uploads are therefore limited to one file up to 3 MB at a time. Scheduled items become published when the public content API is requested after their scheduled time; Vercel Hobby does not run the backend's persistent minute timer.

In MongoDB Atlas, configure Network Access to allow the Vercel deployment to connect. After deploying, check `/api/health`, then register a creator account and test the public content, creator login, and moderation flows.
