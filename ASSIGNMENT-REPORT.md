# Sociee - Content Creator Management and Viewer Engagement Web Application

## Web Design II - DIWP3110

| Item | Details |
|---|---|
| Department | Faculty of Information Communication Technology |
| Course | Diploma in Software Engineering and Multimedia |
| Semester | Year 3, Semester 1 |
| Commence date | Week 12 |
| Submission deadline | Week 13 |
| Student name and number | **Complete before submission** |
| Lecturer/contact | **Complete if required** |
| GitHub repository | **Add the public repository URL after publishing** |
| Live application | **Add the deployed frontend URL after deployment** |
| Live API | **Add the deployed backend URL after deployment** |

## 1. Introduction

Content creators often publish across several platforms, making it difficult to organise content, keep track of publication status, understand audience engagement, and respond to viewer comments. This project provides a central web application with a public viewer portal and a private creator dashboard.

The application is built with React for the user interface, Node.js and Express for the API, and MongoDB with Mongoose for persistent data. Viewers can browse published work and interact with it. The creator can authenticate, manage content, review comments, and view dashboard statistics.

## 2. Problem statement

When content details, comments, and performance information are scattered across platforms, creators have to manage their work manually. This increases the chance of losing track of drafts and planned publications and makes viewer engagement harder to monitor. A single application is needed to organise the creator's content and provide viewers with a straightforward way to discover and discuss it.

## 3. Aim and objectives

The aim is to develop a database-backed content management and viewer engagement application.

The objectives are to:

1. Provide a responsive public portal for discovering published content.
2. Provide creator account setup and authenticated dashboard access.
3. Store content and engagement data persistently in MongoDB.
4. Support content creation, editing, deletion, drafting, publishing, and scheduling.
5. Let viewers submit comments and likes and record content views.
6. Give the creator tools to moderate comments and review content statistics.
7. Prepare the frontend and backend for separate online deployment.

## 4. System users and scope

### Viewer

- Browse published content and open a content detail page.
- Search and filter the content listing.
- Like content, submit a named comment, view approved comments, and share a content link.
- Increase a content item's view count by opening its detail page.

### Creator

- Register a creator account, then sign in with that account.
- Access protected dashboard and content-management pages.
- Create, edit, publish, schedule, and delete content, including device photos and media uploads.
- Review, approve, hide, or delete comments.
- View content, publication, and engagement statistics.

Multiple creators can register separate accounts. Creator content-management data is scoped to the signed-in account; published content remains visible in the public viewer portal with the creator's username, profile photo, and publication time. Viewers can open each creator's public profile to browse published posts and see likes and approved-comment counts, then open a post to like or comment. Creators can edit their profile name and bio and save a profile photo from the dashboard; uploaded pictures are stored in MongoDB. Public viewer registration is not required; viewers identify themselves by display name when commenting. Email-based password recovery is not configured.

## 5. Requirements and implementation

### 5.1 Viewer portal

The React application provides a home/content listing and content-detail routes. Published content is retrieved from the API; the detail page provides the item's information and engagement actions. The listing supports title/keyword search, category selection, and responsive card layouts. Creators can upload photos, videos, and audio from their device; uploaded files are stored in MongoDB and public media is displayed on the content detail page.

### 5.2 Creator dashboard

Creator-only screens provide dashboard statistics, content management, and comment moderation. Content has a title, description, category, type, thumbnail/media URLs or article text, status, timestamps, publication/scheduled date, view count, and like count. Management routes require a valid bearer token.

### 5.3 Database design

MongoDB stores application data in the following Mongoose collections:

| Collection/model | Purpose | Important data |
|---|---|---|
| `users` | Creator profile and login | Normalized unique email, password hash, display name, profile details, role |
| `contents` | Creator's material | Title, description, category, type, links/content, status, dates, view count |
| `comments` | Viewer comments | Content reference, display name, text, moderation status, timestamp |
| `likes` | Viewer likes | Content reference and viewer identity/key, timestamp |

Schemas use required fields, length and enum constraints, defaults, and references as appropriate. Passwords are hashed before storage; plaintext passwords are not stored.

### 5.4 API and backend

The Express API validates requests, returns JSON, uses appropriate HTTP status codes, and connects to MongoDB through environment configuration.

| Method and route | Purpose | Access |
|---|---|---|
| `GET /health` | Health and database status | Public |
| `GET /api/profile` | Creator profile shown in the portal | Public |
| `GET /api/profile/:creatorId` | Creator profile and published posts with engagement totals | Public |
| `GET /api/profile/me`, `PUT /api/profile/me` | View or update the signed-in creator's profile details and picture | Creator |
| `GET /api/contents` | List published content | Public |
| `GET /api/contents/:id` | Get a published content item | Public |
| `POST /api/contents/:id/view` | Record a view | Public |
| `GET /api/media/:id` | Retrieve an uploaded public media file | Public |
| `POST /api/media/upload` | Upload creator photos/videos/audio | Creator |
| `POST /api/auth/register` | Register a creator account | Public |
| `POST /api/auth/setup` | Backward-compatible creator registration route | Public |
| `GET /api/auth/setup-status` | Check account setup and registration availability | Public |
| `POST /api/auth/login` | Authenticate the creator | Public |
| `POST /api/comments` | Submit a pending viewer comment | Public |
| `GET /api/comments/:contentId` | List approved comments | Public |
| `POST /api/likes` | Like a content item | Public |
| `GET /api/contents?all=true` | List all content, including drafts | Creator |
| `POST /api/contents` | Create content | Creator |
| `PUT /api/contents/:id` | Update content | Creator |
| `DELETE /api/contents/:id` | Delete content and related engagement records | Creator |
| `GET /api/comments` | List comments for moderation | Creator |
| `PATCH /api/comments/:id` | Change a comment's moderation status | Creator |
| `DELETE /api/comments/:id` | Delete a comment | Creator |
| `GET /api/dashboard/stats` | Retrieve creator dashboard statistics | Creator |

### 5.5 Viewer engagement and moderation

Comments are stored as pending and are only returned to the public after creator approval. The creator can approve, hide, or delete comments. Likes are stored against content, and view counts are incremented through the content-view endpoint. The detail page provides a share/copy action using the current content URL.

### 5.6 Authentication and security

- Creator passwords are hashed with bcrypt before persistence.
- The backend issues time-limited JWTs after setup or login.
- Creator routes validate bearer tokens in middleware.
- Authentication requests are rate limited.
- Helmet adds standard HTTP security headers.
- CORS is configurable through `FRONTEND_URL`.
- MongoDB credentials and JWT configuration are supplied through environment variables; local `.env` files must not be committed.
- Creator registration is available for additional accounts.

## 6. Application configuration and running locally

Requirements: Node.js and a MongoDB instance (MongoDB Atlas or local MongoDB).

1. Install frontend packages from the project root using `npm install`.
2. In `backend`, run `npm install`.
3. Copy `backend/.env.example` to `backend/.env` and set a working `MONGODB_URI`, a strong `JWT_SECRET`, and `FRONTEND_URL`. Do not include the secret values in the report or source control.
4. Start the API from `backend` using `npm start`; check `http://localhost:5000/health`.
5. Start the frontend in a second terminal from the project root using `npm start`.
6. Open `/login` to sign in or choose **Create account** to register a creator account. Each account sees only its own drafts, comments, and dashboard data; published content remains public.

The frontend API base URL defaults to `http://localhost:5000/api`. For hosted deployments, configure `REACT_APP_API_URL` to the deployed API base URL ending in `/api`.

## 7. Testing and current verification

The frontend includes tests for the home page and invalid content responses. Login-flow tests cover creator registration, normal login mode, retrying after an unavailable API, and saving a successful authentication token.

Backend syntax can be checked with `node --check server.js` from the backend folder. The API can be smoke-checked through `/health` and `/api/auth/setup-status`.

**Current local check:** the backend health endpoint returned `ok`, MongoDB reported `connected`, and the registration endpoint reported `registrationAllowed=true`. Existing MongoDB data is retained. The first existing account owns any legacy content that did not have an owner; newly registered accounts get separate creator workspaces. These local checks do not prove that a separate production database or deployment is configured.

**Local test results:** The focused frontend suite passed: 2 suites and 7 tests. The React production build compiled successfully. Backend entry-point and authentication-route syntax checks passed. These checks were run locally; repeat them after final changes and verify the hosted application before submission.

## 8. Hosting and deployment

The project contains deployment configuration for a Render backend (`render.yaml`) and a React single-page application (`vercel.json`; `public/_redirects` is also provided for static hosts).

Deployment still requires the student to:

1. Push the source to a GitHub repository and add its URL above.
2. Create/choose a MongoDB Atlas cluster and database user.
3. Deploy the backend and configure `MONGODB_URI`, a persistent `JWT_SECRET`, `NODE_ENV=production`, and the frontend origin in `FRONTEND_URL`.
4. Deploy the frontend and set `REACT_APP_API_URL` to the live API base URL.
5. Confirm the production CORS origin and SPA route rewrites.
6. Register a creator account in the production database.
7. Test viewer browsing, creator login, CRUD, scheduling, comments, likes, moderation, and refresh/deep links using the public URLs.

**Deployment status:** This workspace has deployment configuration but no verified public application URL or GitHub URL. Add the real links and production test results before submission; localhost is not a substitute for the required public deployment.

## 9. Conclusion

The project brings creator content management and viewer engagement into one React and Express application backed by MongoDB. It includes a public content experience, protected creator operations, account-specific workspaces, database-backed engagement, comment moderation, and deployment configuration. The remaining submission work is to verify the final tests, deploy with the student's own hosting accounts and credentials, register a creator account in production, and fill in the real repository and public URLs.
