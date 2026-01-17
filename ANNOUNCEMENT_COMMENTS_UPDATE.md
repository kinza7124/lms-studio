# Announcement Comments & Permissions Update

## Changes Made

### 1. Database Migration
- **File**: `backend/migrations/add_announcement_comments.sql`
- **New Table**: `announcement_comments`
  - Stores comments on announcements
  - Links to announcements and users
  - Includes timestamps for created/updated

### 2. Backend Updates

#### New Model
- **`backend/src/models/announcementCommentModel.js`**
  - `createComment` - Create new comment
  - `getCommentsByAnnouncement` - Get all comments for an announcement
  - `updateComment` - Update comment content
  - `deleteComment` - Delete comment
  - `getCommentById` - Get single comment

#### Updated Models
- **`backend/src/models/announcementModel.js`**
  - Added `getAnnouncementById` to fetch announcement with creator details
  - Updated `getAnnouncementsByCourse` to include creator role

#### New Controller
- **`backend/src/controllers/announcementCommentController.js`**
  - `createCommentHandler` - Create comment
  - `getCommentsHandler` - Get comments for announcement
  - `updateCommentHandler` - Update comment (owner only)
  - `deleteCommentHandler` - Delete comment (owner or admin)

#### Updated Controllers
- **`backend/src/controllers/announcementController.js`**
  - **`updateAnnouncementHandler`** - Now checks permissions:
    - Admin can update any announcement
    - User can update their own announcement
    - Teacher can update any announcement in their assigned courses
  - **`deleteAnnouncementHandler`** - Now checks permissions:
    - Admin can delete any announcement
    - User can delete their own announcement
    - Teacher can delete any announcement in their assigned courses

#### Updated Routes
- **`backend/src/routes/announcementRoutes.js`**
  - Removed role restrictions from update/delete (permission check in handler)
  - Added comment routes:
    - `POST /announcements/:announcementId/comments` - Create comment
    - `GET /announcements/:announcementId/comments` - Get comments
    - `PUT /announcements/comments/:id` - Update comment
    - `DELETE /announcements/comments/:id` - Delete comment

### 3. Frontend Updates

#### Updated Types
- **`frontend/src/types/index.ts`**
  - Added `AnnouncementComment` type
  - Updated `Announcement` type to include `creator_role`

#### Updated Course Detail Page
- **`frontend/src/app/course/[id]/page.tsx`**
  - **Fixed User Loading**: User now loads before data, ensuring buttons show correctly
  - **Announcement Display**:
    - Shows creator email alongside name
    - Edit/Delete buttons with proper permissions
    - Inline editing for announcements
  - **Comments Section**:
    - Displays all comments below each announcement
    - Shows commenter name and email
    - Add comment form for each announcement
    - Delete button for own comments (or admin)
    - Comments load automatically with announcements
  - **Permission Checks**:
    - `canDeleteAnnouncement()` - Checks if user can delete
    - `canEditAnnouncement()` - Checks if user can edit
    - Teachers can delete/edit announcements in their assigned courses
    - Users can delete/edit their own announcements

## Permission Rules

### Announcements
1. **Admin**: Can delete/edit any announcement
2. **Creator**: Can delete/edit their own announcement
3. **Teacher**: Can delete/edit any announcement in their assigned courses (status = 'approved')

### Comments
1. **Admin**: Can delete any comment
2. **Creator**: Can delete/edit their own comment
3. **Others**: Can only view comments

## Features

### Google Classroom-like Announcements
- ✅ Post announcements (admin, teacher, student)
- ✅ Edit announcements (with permissions)
- ✅ Delete announcements (with permissions)
- ✅ Comments section below each announcement
- ✅ Commenter name and email displayed
- ✅ Delete own comments
- ✅ Real-time comment updates

### Add Quiz/Assignment Buttons
- ✅ Buttons now show correctly for teachers/admins
- ✅ User state loads before checking permissions
- ✅ Forms appear in respective tabs

## Migration Instructions

Run the database migration:
```sql
-- Using psql
psql -d lms_db -f backend/migrations/add_announcement_comments.sql

-- Or using pgAdmin
-- Open the file and execute it
```

## Testing Checklist

- [ ] Run database migration
- [ ] Restart backend server
- [ ] Test creating announcement as student
- [ ] Test editing own announcement as student
- [ ] Test deleting own announcement as student
- [ ] Test teacher editing/deleting student announcement in their course
- [ ] Test teacher editing/deleting own announcement
- [ ] Test admin editing/deleting any announcement
- [ ] Test adding comment to announcement
- [ ] Test deleting own comment
- [ ] Test admin deleting any comment
- [ ] Verify "Add Quiz" and "Add Assignment" buttons show for teachers/admins
- [ ] Verify comments show with name and email
- [ ] Verify comments load when page loads

## API Endpoints

### Announcements
- `POST /api/announcements` - Create (all authenticated users)
- `GET /api/announcements/course/:courseId` - Get all for course
- `PUT /api/announcements/:id` - Update (permission check)
- `DELETE /api/announcements/:id` - Delete (permission check)

### Comments
- `POST /api/announcements/:announcementId/comments` - Create comment
- `GET /api/announcements/:announcementId/comments` - Get comments
- `PUT /api/announcements/comments/:id` - Update comment (owner only)
- `DELETE /api/announcements/comments/:id` - Delete comment (owner or admin)

