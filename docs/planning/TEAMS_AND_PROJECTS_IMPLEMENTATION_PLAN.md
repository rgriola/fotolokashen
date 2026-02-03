# Teams & Projects - Complete Implementation Plan

**Date:** February 2, 2026  
**Status:** 📋 Planning  
**Priority:** High  
**Estimated Time:** 3-4 weeks  
**Dependencies:** Requires follow system from Social Features Plan

---

## Overview

Build a comprehensive collaboration system that allows users to:
- Form persistent **Teams** (e.g., production crews, photography groups)
- Create time-bound **Projects** (e.g., "Summer 2026 Campaign", "Location Scouting NYC")
- Assign **Tasks** to team/project members
- Share locations, photos, and notes within teams/projects
- Track project progress and deliverables

Should we allow custom data fields for teams and projects? This could provide flexibility for different types of teams and projects to track specific information relevant to their workflows. 

How do we impliment these custom fields? 


---

## Core Concepts

### Three-Tier Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ TEAM (Persistent)                                   │
│ "Vibecode Film Crew"                               │
│ ├── Team Members (Alice, Bob, Carol)               │
│ │                                                   │
│ └── PROJECTS (Time-bound)                          │
│     ├── Project A: "Nike Campaign"                 │
│     │   ├── Project Members: [Alice, Bob]          │
│     │   ├── Locations: [Beach, Studio, Park]       │
│     │   └── ASSIGNMENTS (Tasks)                    │
│     │       ├── "Scout beach access" → Bob         │
│     │       └── "Book studio time" → Alice         │
│     │                                               │
│     └── Project B: "Fashion Week Coverage"         │
│         └── ...                                     │
└─────────────────────────────────────────────────────┘

STANDALONE PROJECT (No Team)
┌─────────────────────────────────────────────────────┐
│ PROJECT (Personal)                                  │
│ "My Portfolio 2026"                                │
│ ├── Owner: Alice                                    │
│ ├── Project Members: [Alice, Guest User Dave]      │
│ ├── Locations: [Location 1, Location 2]            │
│ └── ASSIGNMENTS                                     │
│     ├── "Edit photos" → Alice                       │
│     └── "Review edits" → Dave                       │
└─────────────────────────────────────────────────────┘
```

**Key Rules:**
- **Teams** are optional but persistent (same crew works together long-term)
- **Projects** can be standalone (personal) OR belong to a team
- **Assignments** always belong to a project (task-specific)
- **Locations** are shared at the project level
- **Project members** can be a subset of team members + guests {how are guests defined? all memebers must have registered accounts , should team leader project leader send invites - a limited type admin for only their team/project?} 

Team leaders should be able to assign roles and manage project memberships within their teams.

Since locations are an important concept of this app, Teams and Projects should have a collective view of locations tied to their specific projects.

---

## Database Schema

### 1. Team Model (NEW)

Think about admin UX for managing teams and project. 
We need a calendar view, task deadlines, and project milestones. Consider how these will be represented in the database and UI.

```prisma
model Team {
  id          Int           @id @default(autoincrement())
  name        String        // "Film Crew A", "Photography Collective"
  description String?       // Team purpose/bio
  ownerId     Int           // Who created/leads the team
  avatar      String?       // Team logo/image
  avatarFileId String?      // ImageKit file ID
  color       String?       // Brand color for UI
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?     // Soft delete
  
  owner       User          @relation("OwnedTeams", fields: [ownerId], references: [id])
  members     TeamMember[]
  projects    Project[]
  invitations TeamInvitation[]
  
  @@index([ownerId])
  @@index([isActive])
  @@map("teams")
}
```

### 2. Team Member Model (UPDATED)

Can we add memeber schedules, availability, and time-off tracking? This would help in planning project timelines and assigning tasks more effectively. 

```prisma
model TeamMember {
  id        Int       @id @default(autoincrement())
  teamId    Int       // ✅ References Team, not User
  userId    Int
  role      String    @default("member") // owner, admin, member, viewer
  title     String?   // "Lead Cinematographer", "Location Scout"
  joinedAt  DateTime  @default(now())
  addedBy   Int
  isActive  Boolean   @default(true)
  
  team      Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User      @relation("TeamMemberships", fields: [userId], references: [id], onDelete: Cascade)
  inviter   User      @relation("InvitedTeamMembers", fields: [addedBy], references: [id])
  
  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@map("team_members")
}
```

### 3. Team Invitation Model (NEW)

Team invites will require a new email template. This template should include the inviter's name, the team name, and a unique link for the invitee to accept or decline the invitation.

```prisma
model TeamInvitation {
  id          Int       @id @default(autoincrement())
  teamId      Int
  invitedBy   Int       // User who sent invite
  invitedEmail String?  // For users not yet on platform
  invitedUserId Int?    // For existing users
  role        String    @default("member")
  token       String    @unique // For email invites
  status      String    @default("pending") // pending, accepted, declined, expired
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  respondedAt DateTime?
  
  team        Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  inviter     User      @relation("SentTeamInvitations", fields: [invitedBy], references: [id])
  invitedUser User?     @relation("ReceivedTeamInvitations", fields: [invitedUserId], references: [id])
  
  @@index([teamId])
  @@index([invitedUserId])
  @@index([token])
  @@map("team_invitations")
}
```

### 4. Project Model (UPDATED)

```prisma
model Project {
  id          Int                  @id @default(autoincrement())
  teamId      Int?                 // ✅ Optional: null = personal project
  ownerId     Int                  // Project creator/manager
  name        String               // "Summer 2026 Campaign"
  description String?              // Project brief
  startDate   DateTime?
  endDate     DateTime?
  budget      Decimal?             // Changed from Float for precision
  currency    String?              @default("USD")
  status      String               @default("planning") // planning, active, on_hold, completed, cancelled
  color       String?              // Visual identifier
  coverImage  String?              // Project thumbnail
  coverFileId String?
  priority    String               @default("medium") // low, medium, high
  isArchived  Boolean              @default(false)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  deletedAt   DateTime?
  
  team        Team?                @relation(fields: [teamId], references: [id], onDelete: SetNull)
  owner       User                 @relation("OwnedProjects", fields: [ownerId], references: [id])
  locations   ProjectLocation[]
  members     ProjectMember[]
  assignments ProjectAssignment[]
  
  @@index([teamId])
  @@index([ownerId])
  @@index([status])
  @@map("projects")
}
```

### 5. Project Member Model (KEEP)

```prisma
model ProjectMember {
  id        Int      @id @default(autoincrement())
  projectId Int
  userId    Int
  role      String   @default("viewer") // owner, manager, contributor, viewer
  addedAt   DateTime @default(now())
  addedBy   Int?
  
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation("ProjectMemberships", fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
  @@map("project_members")
}
```

### 6. Project Assignment Model (NEW)


```prisma
model ProjectAssignment {
  id          Int       @id @default(autoincrement())
  projectId   Int
  locationId  Int?      // Optional: assignment tied to specific location
  assignedTo  Int       // Who needs to do this
  assignedBy  Int       // Who created the task
  title       String    // "Scout beach access", "Book permits"
  description String?   // Task details
  dueDate     DateTime?
  priority    String    @default("medium") // low, medium, high, urgent
  status      String    @default("pending") // pending, in_progress, completed, cancelled
  estimatedHours Float?  // Time estimate
  actualHours Float?    // Time tracked
  completedAt DateTime? 
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  location    Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
  assignee    User      @relation("AssignedTasks", fields: [assignedTo], references: [id])
  creator     User      @relation("CreatedAssignments", fields: [assignedBy], references: [id])
  comments    AssignmentComment[]
  
  @@index([projectId])
  @@index([assignedTo])
  @@index([locationId])
  @@index([status])
  @@index([dueDate])
  @@map("project_assignments")
}
```

### 7. Assignment Comment Model (NEW) 

```prisma
model AssignmentComment {
  id           Int               @id @default(autoincrement())
  assignmentId Int
  userId       Int
  comment      String
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  
  assignment   ProjectAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  user         User              @relation(fields: [userId], references: [id])
  
  @@index([assignmentId])
  @@map("assignment_comments")
}
```

### 8. Project Location Model (UPDATED)

```prisma
model ProjectLocation {
  id         Int       @id @default(autoincrement())
  projectId  Int
  locationId Int
  shootDate  DateTime? // Scheduled date
  notes      String?   // Project-specific location notes
  status     String    @default("pending") // pending, confirmed, completed, cancelled
  addedAt    DateTime  @default(now())
  addedBy    Int?      // Who added this location to project
  
  location   Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  project    Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, locationId])
  @@index([locationId])
  @@index([projectId])
  @@map("project_locations")
}
```

### 9. User Model Updates (REQUIRED)

```prisma
model User {
  // ...existing fields...
  
  // Team Relations
  ownedTeams              Team[]              @relation("OwnedTeams")
  teamMemberships         TeamMember[]        @relation("TeamMemberships")
  invitedTeamMembers      TeamMember[]        @relation("InvitedTeamMembers")
  sentTeamInvitations     TeamInvitation[]    @relation("SentTeamInvitations")
  receivedTeamInvitations TeamInvitation[]    @relation("ReceivedTeamInvitations")
  
  // Project Relations
  ownedProjects           Project[]           @relation("OwnedProjects")
  projectMemberships      ProjectMember[]     @relation("ProjectMemberships")
  
  // Assignment Relations
  assignedTasks           ProjectAssignment[] @relation("AssignedTasks")
  createdAssignments      ProjectAssignment[] @relation("CreatedAssignments")
  assignmentComments      AssignmentComment[]
}
```

---

## Role-Based Permissions
Remember App Admins need to have view access to all teams and projects for support and oversight. This access should be read-only and not allow modifications to team or project data.

### Team Roles

| Role    | Create Projects | Invite Members | Remove Members | Edit Team | Delete Team |
|---------|----------------|----------------|----------------|-----------|-------------|
| Owner   | ✅              | ✅              | ✅              | ✅         | ✅           |
| Admin   | ✅              | ✅              | ✅              | ✅         | ❌           |
| Member  | ✅              | ❌              | ❌              | ❌         | ❌           |
| Viewer  | ❌              | ❌              | ❌              | ❌         | ❌           |

### Project Roles

| Role        | Add Locations | Create Assignments | Edit Project | Invite Members | Delete Project |
|-------------|--------------|------------------- |-------------- |---------------- |----------------|
| Owner       | ✅            | ✅                 | ✅            | ✅              | ✅              |
| Manager     | ✅            | ✅                 | ✅            | ✅              | ❌              |
| Contributor | ✅            | ❌                 | ❌            | ❌              | ❌              |
| Viewer      | ❌            | ❌                 | ❌            | ❌              | ❌              |

---

## User Workflows

### Workflow 1: Create Team & First Project

```
1. User clicks "Create Team" from dashboard
   └─> Opens CreateTeamModal
       - Enter team name (required)
       - Add description (optional)
       - Upload team avatar (optional)
       - Choose team color (optional)
       
2. Team created → Redirect to Team Dashboard
   └─> Shows empty state: "Create your first project"
   
3. Click "Create Project"
   └─> Opens CreateProjectModal
       - Enter project name (required)
       - Add description (optional)
       - Set start/end dates (optional)
       - Set budget (optional)
       - Choose project color (optional)
       
4. Project created → Redirect to Project Dashboard
   └─> Shows: "Add team members" and "Add locations"
   
5. Click "Invite Members"
   └─> Opens InviteMembersModal
       - Search existing users (username/email)
       - Or enter email for new users
       - Set role per member
       - Send invitations
       
6. Members accept → Now can add locations & create assignments - 
```

### Workflow 2: Create Personal Project (No Team)

```
1. User clicks "Create Project" from personal dashboard
   └─> Opens CreateProjectModal
       - No team selected (personal project)
       
2. Project created → Can invite guests as project members
   └─> Guests only have access to this specific project
```

### Workflow 3: Add Location to Project 

```
1. User viewing location on map
2. Clicks "Add to Project"
   └─> Dropdown: Select from user's projects
   └─> Or: "Create New Project"
   
3. Location added → Shows in project location list
4. Can add project-specific notes
5. Can set shoot date
6. Can create assignments related to this location
```

### Workflow 4: Create & Assign Task 

```
1. From Project Dashboard → "Assignments" tab
2. Click "New Assignment"
   └─> CreateAssignmentModal
       - Title (required)
       - Description (optional)
       - Assign to project member (required)
       - Set due date (optional)
       - Set priority (default: medium)
       - Link to location (optional)
       - Estimate hours (optional)
       
3. Assignment created → Assignee receives notification
4. Assignee can:
   - Update status (pending → in_progress → completed)
   - Add comments
   - Log hours worked
   - Upload related photos 
```

---

## API Endpoints

### Teams

```
GET    /api/v1/teams                    # List user's teams
POST   /api/v1/teams                    # Create team
GET    /api/v1/teams/:id                # Get team details
PATCH  /api/v1/teams/:id                # Update team
DELETE /api/v1/teams/:id                # Delete team (soft delete)

GET    /api/v1/teams/:id/members        # List team members
POST   /api/v1/teams/:id/members        # Add member (direct)
DELETE /api/v1/teams/:id/members/:userId # Remove member

POST   /api/v1/teams/:id/invite         # Send invitation
GET    /api/v1/teams/invitations        # My pending invitations
POST   /api/v1/teams/invitations/:id/accept   # Accept invite
POST   /api/v1/teams/invitations/:id/decline  # Decline invite

GET    /api/v1/teams/:id/projects       # List team projects
```

### Projects

```
GET    /api/v1/projects                 # List user's projects (team + personal)
POST   /api/v1/projects                 # Create project
GET    /api/v1/projects/:id             # Get project details
PATCH  /api/v1/projects/:id             # Update project
DELETE /api/v1/projects/:id             # Delete project
POST   /api/v1/projects/:id/archive     # Archive project

GET    /api/v1/projects/:id/members     # List project members
POST   /api/v1/projects/:id/members     # Add member
DELETE /api/v1/projects/:id/members/:userId # Remove member

GET    /api/v1/projects/:id/locations   # List project locations
POST   /api/v1/projects/:id/locations   # Add location to project
DELETE /api/v1/projects/:id/locations/:locationId # Remove location
PATCH  /api/v1/projects/:id/locations/:locationId # Update location notes/date

GET    /api/v1/projects/:id/assignments # List assignments
POST   /api/v1/projects/:id/assignments # Create assignment
GET    /api/v1/projects/assignments/:id # Get assignment details
PATCH  /api/v1/projects/assignments/:id # Update assignment
DELETE /api/v1/projects/assignments/:id # Delete assignment

POST   /api/v1/projects/assignments/:id/comments # Add comment
GET    /api/v1/projects/assignments/:id/comments # List comments
```

### User Queries

```
GET    /api/v1/users/me/teams           # My teams
GET    /api/v1/users/me/projects        # My projects
GET    /api/v1/users/me/assignments     # My assigned tasks
GET    /api/v1/users/me/team-invitations # Pending team invites
```

---

## UI Components & Pages

### New Pages

#### 1. `/teams` - Teams List Page
```
┌──────────────────────────────────────────────┐
│ My Teams                    [+ Create Team]  │
├──────────────────────────────────────────────┤
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ [Avatar] Vibecode Film Crew             │ │
│ │          5 members · 3 active projects  │ │
│ │          Created Jan 15, 2026           │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ [Avatar] Photography Collective         │ │
│ │          12 members · 7 active projects │ │
│ │          Created Dec 1, 2025            │ │
│ └─────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

#### 2. `/teams/:id` - Team Dashboard
```
┌──────────────────────────────────────────────┐
│ ← Back to Teams                              │
├──────────────────────────────────────────────┤
│ [Avatar] Vibecode Film Crew     [Edit Team]  │
│ 5 members · 3 active projects                │
├──────────────────────────────────────────────┤
│ [Projects] [Members] [Settings]              │
├──────────────────────────────────────────────┤
│                                              │
│ Active Projects              [+ New Project] │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Nike Campaign                           │ │
│ │ Planning · 12 locations · 8 tasks       │ │
│ │ Due: Mar 15, 2026                       │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Fashion Week Coverage                   │ │
│ │ Active · 5 locations · 3 tasks          │ │
│ │ Due: Feb 28, 2026                       │ │
│ └─────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

#### 3. `/projects` - Projects List Page
```
┌──────────────────────────────────────────────┐
│ My Projects                [+ Create Project]│
├──────────────────────────────────────────────┤
│ [All] [Team Projects] [Personal]             │
├──────────────────────────────────────────────┤
│                                              │
│ Team Projects                                │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Nike Campaign                           │ │
│ │ Vibecode Film Crew                      │ │
│ │ Planning · 12 locations · 8 tasks       │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Personal Projects                            │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ My Portfolio 2026                       │ │
│ │ Personal · 5 locations · 2 tasks        │ │
│ └─────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

#### 4. `/projects/:id` - Project Dashboard
```
┌──────────────────────────────────────────────┐
│ ← Back to Projects                           │
├──────────────────────────────────────────────┤
│ [Cover] Nike Campaign          [Edit Project]│
│ Team: Vibecode Film Crew                     │
│ Planning · Jan 15 - Mar 15, 2026             │
├──────────────────────────────────────────────┤
│ [Overview] [Locations] [Assignments] [Team]  │
├──────────────────────────────────────────────┤
│                                              │
│ Project Overview                             │
│                                              │
│ ┌──────────────┬──────────────┬───────────┐ │
│ │ 12 Locations │ 8 Tasks      │ $10,000   │ │
│ │              │ 3 Pending    │ Budget    │ │
│ └──────────────┴──────────────┴───────────┘ │
│                                              │
│ Upcoming Milestones                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Feb 10: Beach location scouting         │ │
│ │ Feb 20: Studio booking deadline         │ │
│ │ Mar 1:  First shoot day                 │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Recent Activity                              │
│ • Alice added "Venice Beach" location       │
│ • Bob completed "Scout parking access"      │
│ • Carol created "Book permits" assignment   │
│                                              │
└──────────────────────────────────────────────┘
```

#### 5. Project Locations Tab
```
┌──────────────────────────────────────────────┐
│ Locations (12)              [+ Add Location] │
├──────────────────────────────────────────────┤
│ [All] [Pending] [Confirmed] [Completed]      │
├──────────────────────────────────────────────┤
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ [Photo] Venice Beach                    │ │
│ │ Shoot Date: Feb 15, 2026                │ │
│ │ Status: Confirmed                       │ │
│ │ Notes: Sunrise shoot, 6am call time     │ │
│ │ Assignments: 2 tasks                    │ │
│ │ [View on Map] [Edit]                    │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ [Photo] Downtown Studio                 │ │
│ │ Shoot Date: Feb 20, 2026                │ │
│ │ Status: Pending                         │ │
│ │ Notes: Awaiting availability            │ │
│ │ Assignments: 1 task                     │ │
│ │ [View on Map] [Edit]                    │ │
│ └─────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

#### 6. Project Assignments Tab
```
┌──────────────────────────────────────────────┐
│ Assignments (8)          [+ New Assignment]  │
├──────────────────────────────────────────────┤
│ [All] [My Tasks] [Pending] [Completed]       │
├──────────────────────────────────────────────┤
│                                              │
│ High Priority                                │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ⚠️ Book studio time                      │ │
│ │ Assigned to: Alice                      │ │
│ │ Due: Feb 5, 2026 (3 days)               │ │
│ │ Location: Downtown Studio               │ │
│ │ Status: In Progress                     │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Medium Priority                              │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Scout parking access                    │ │
│ │ Assigned to: Bob                        │ │
│ │ Due: Feb 8, 2026                        │ │
│ │ Location: Venice Beach                  │ │
│ │ Status: Completed ✓                     │ │
│ └─────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

### New Components

```typescript
// Teams
<CreateTeamModal />
<TeamCard />
<TeamMemberList />
<InviteTeamMembersModal />
<TeamSettingsPanel />

// Projects
<CreateProjectModal />
<ProjectCard />
<ProjectDashboard />
<ProjectLocationsList />
<AddLocationToProjectModal />
<ProjectMemberList />

// Assignments
<CreateAssignmentModal />
<AssignmentCard />
<AssignmentDetailPanel />
<AssignmentCommentsList />
<MyTasksList />
```

### Enhanced Existing Components

```typescript
// LocationDetailPanel.tsx - Add "Add to Project" button
<Button onClick={handleAddToProject}>
  <Plus /> Add to Project
</Button>

// MapPage.tsx - Show project-specific location markers
// Different colors/icons for different projects

// ProfilePage.tsx - Add Teams & Projects sections
<Section title="Teams">
  {userTeams.map(team => <TeamCard key={team.id} team={team} />)}
</Section>
```

---

## Implementation Phases

### Phase 1: Database & Teams Foundation (Week 1)

**Day 1-2: Database Schema**
- [ ] Create Team model migration
- [ ] Update TeamMember model (fix teamId reference)
- [ ] Create TeamInvitation model
- [ ] Update Project model (add teamId)
- [ ] Create ProjectAssignment model
- [ ] Create AssignmentComment model
- [ ] Update User model relations
- [ ] Run migrations: `npx prisma migrate dev --name add_teams_and_projects`
- [ ] Test all relations in Prisma Studio

**Day 3-4: Teams API**
- [ ] `POST /api/v1/teams` - Create team
- [ ] `GET /api/v1/teams` - List user's teams
- [ ] `GET /api/v1/teams/:id` - Get team details
- [ ] `PATCH /api/v1/teams/:id` - Update team
- [ ] `DELETE /api/v1/teams/:id` - Soft delete team
- [ ] Add permission checks (owner/admin only)
- [ ] Write API tests

**Day 5: Team Members API**
- [ ] `GET /api/v1/teams/:id/members` - List members
- [ ] `POST /api/v1/teams/:id/invite` - Send invitation
- [ ] `DELETE /api/v1/teams/:id/members/:userId` - Remove member
- [ ] `GET /api/v1/teams/invitations` - My pending invites
- [ ] `POST /api/v1/teams/invitations/:id/accept` - Accept
- [ ] `POST /api/v1/teams/invitations/:id/decline` - Decline
- [ ] Email notifications for invitations

**Day 6-7: Teams UI**
- [ ] Create `/teams` page (teams list)
- [ ] Create `/teams/:id` page (team dashboard)
- [ ] `<CreateTeamModal />` component
- [ ] `<TeamCard />` component
- [ ] `<InviteTeamMembersModal />` component
- [ ] `<TeamMemberList />` component
- [ ] Team settings panel
- [ ] Navigation links from dashboard

### Phase 2: Projects System (Week 2)

**Day 1-2: Projects API**
- [ ] `POST /api/v1/projects` - Create project (team or personal)
- [ ] `GET /api/v1/projects` - List user's projects
- [ ] `GET /api/v1/projects/:id` - Get project details
- [ ] `PATCH /api/v1/projects/:id` - Update project
- [ ] `DELETE /api/v1/projects/:id` - Delete project
- [ ] `POST /api/v1/projects/:id/archive` - Archive project
- [ ] Permission checks (owner/manager)

**Day 3: Project Members & Locations API**
- [ ] `GET /api/v1/projects/:id/members` - List members
- [ ] `POST /api/v1/projects/:id/members` - Add member
- [ ] `DELETE /api/v1/projects/:id/members/:userId` - Remove
- [ ] `GET /api/v1/projects/:id/locations` - List locations
- [ ] `POST /api/v1/projects/:id/locations` - Add location
- [ ] `DELETE /api/v1/projects/:id/locations/:locationId` - Remove
- [ ] `PATCH /api/v1/projects/:id/locations/:locationId` - Update notes/date

**Day 4-7: Projects UI**
- [ ] Create `/projects` page (projects list)
- [ ] Create `/projects/:id` page (project dashboard)
- [ ] `<CreateProjectModal />` component
- [ ] `<ProjectCard />` component
- [ ] `<ProjectDashboard />` with tabs (Overview, Locations, Assignments, Team)
- [ ] `<ProjectLocationsList />` component
- [ ] `<AddLocationToProjectModal />` component
- [ ] `<ProjectMemberList />` component
- [ ] Add "Add to Project" button to location detail panel
- [ ] Add project filter to map view (show only project locations)

### Phase 3: Assignments & Tasks (Week 3)

**Day 1-2: Assignments API**
- [ ] `GET /api/v1/projects/:id/assignments` - List assignments
- [ ] `POST /api/v1/projects/:id/assignments` - Create assignment
- [ ] `GET /api/v1/projects/assignments/:id` - Get details
- [ ] `PATCH /api/v1/projects/assignments/:id` - Update assignment
- [ ] `DELETE /api/v1/projects/assignments/:id` - Delete assignment
- [ ] `POST /api/v1/projects/assignments/:id/comments` - Add comment
- [ ] `GET /api/v1/projects/assignments/:id/comments` - List comments
- [ ] `GET /api/v1/users/me/assignments` - My assigned tasks

**Day 3-5: Assignments UI**
- [ ] `<CreateAssignmentModal />` component
- [ ] `<AssignmentCard />` component
- [ ] `<AssignmentDetailPanel />` component
- [ ] `<AssignmentCommentsList />` component
- [ ] `<MyTasksList />` component (dashboard widget)
- [ ] Add assignments tab to project dashboard
- [ ] Add assignments to location detail (if location-specific)
- [ ] Kanban board view (optional)

**Day 6-7: Notifications & Email**
- [ ] Team invitation emails
- [ ] Project member added notifications
- [ ] New assignment notifications
- [ ] Assignment due date reminders
- [ ] Assignment completed notifications
- [ ] Comment on assignment notifications
- [ ] In-app notification center

### Phase 4: Polish & Integration (Week 4)

**Day 1-2: Dashboard Integration**
- [ ] Add "Teams" section to main dashboard
- [ ] Add "Projects" section to main dashboard
- [ ] Add "My Tasks" widget to dashboard
- [ ] Show upcoming project milestones
- [ ] Show overdue assignments

**Day 3-4: Map Integration**
- [ ] Project-specific map view (filter by project)
- [ ] Team-specific map view (all team project locations)
- [ ] Different marker colors per project
- [ ] "Add to Project" from map marker popup
- [ ] Show project name in location InfoWindow

**Day 5: Search & Filters**
- [ ] Search teams by name
- [ ] Search projects by name/description
- [ ] Filter projects by team
- [ ] Filter projects by status
- [ ] Filter assignments by status/priority
- [ ] Filter assignments by assignee

**Day 6-7: Testing & Documentation**
- [ ] Comprehensive unit tests
- [ ] Integration tests (full workflows)
- [ ] Mobile responsive testing
- [ ] Cross-browser testing
- [ ] API documentation
- [ ] User guide for teams/projects
- [ ] Admin documentation

---

## Testing Strategy

### Critical Test Scenarios

1. **Team Creation & Management**
   - Create team as user
   - Invite members (existing users)
   - Invite members (email only)
   - Accept invitation
   - Decline invitation
   - Remove team member (as admin)
   - Update team details
   - Delete team (soft delete)

2. **Project Workflows**
   - Create personal project
   - Create team project
   - Add locations to project
   - Add project members
   - Remove project member
   - Archive project
   - Delete project

3. **Assignment Management**
   - Create assignment
   - Assign to team member
   - Update assignment status
   - Add comment to assignment
   - Complete assignment
   - Delete assignment
   - Filter/search assignments

4. **Permissions**
   - Team owner can edit/delete
   - Team admin can manage members
   - Team member cannot remove others
   - Project owner can delete project
   - Project manager can edit settings
   - Project contributor can add locations only
   - Project viewer is read-only

5. **Integration**
   - Location added to project appears in project list
   - Assignment linked to location shows on location page
   - Team member can see team projects
   - Project member gets notifications

---

## Migration Strategy

### Existing Data

**Current State:**
- Users may have existing projects
- TeamMember table exists but references wrong model

**Migration Steps:**

1. **Create new Team model**
   ```sql
   -- Teams don't exist yet, so this is safe
   CREATE TABLE teams (...);
   ```

2. **Update existing TeamMember records**
   ```typescript
   // Data migration script
   // If any TeamMember records exist, need to:
   // 1. Create a default team for each "inviter"
   // 2. Update TeamMember.invitedBy to TeamMember.teamId
   // This is complex - may be easier to drop/recreate TeamMember
   ```

3. **Update existing Project records**
   ```sql
   -- Add teamId column (nullable)
   ALTER TABLE projects ADD COLUMN team_id INTEGER;
   
   -- All existing projects are personal (teamId = null)
   -- No data change needed
   ```

4. **Test thoroughly in development before production**

---

## Success Metrics

### Phase 1 (Teams)
- [ ] Users can create teams
- [ ] Users can invite members
- [ ] Invitations sent/received via email
- [ ] Team dashboard shows members
- [ ] Permissions enforced correctly

### Phase 2 (Projects)
- [ ] Users can create personal projects
- [ ] Users can create team projects
- [ ] Locations can be added to projects
- [ ] Project members can be managed
- [ ] Project dashboard shows all data

### Phase 3 (Assignments)
- [ ] Assignments can be created and assigned
- [ ] Users see their assigned tasks
- [ ] Assignment status updates work
- [ ] Comments can be added
- [ ] Notifications sent correctly

### Phase 4 (Integration)
- [ ] Teams/projects visible on dashboard
- [ ] Map shows project-specific locations
- [ ] All existing features still work
- [ ] Mobile responsive
- [ ] Performance acceptable

---

## Future Enhancements (Post-MVP)

### V2 Features
- [ ] Project templates (e.g., "Film Production", "Photography Portfolio")
- [ ] Gantt chart view for project timeline
- [ ] Budget tracking per project
- [ ] Time tracking integration
- [ ] File storage per project (documents, contracts)
- [ ] Calendar integration (sync shoot dates)
- [ ] Project reports/analytics
- [ ] Export project data (PDF, CSV)
- [ ] Recurring assignments (weekly tasks)
- [ ] Assignment dependencies (Task B after Task A)
- [ ] Team chat/messaging
- [ ] Public team profiles (portfolio showcase)

---

## Questions & Decisions

### ✅ Resolved
- **Q:** Team first or project first?  
  **A:** Teams optional. Support both team projects and personal projects.

- **Q:** Where do assignments live?  
  **A:** Always within a project. No team-level assignments.

- **Q:** Can projects exist without teams?  
  **A:** Yes. Personal projects have no teamId.

### 🤔 To Decide
- [ ] Should team members auto-join all team projects, or opt-in per project?
  - **Recommendation:** Auto-see all team projects, but only project members can edit
  
- [ ] Allow projects to be shared across multiple teams?
  - **Recommendation:** No for MVP. One team per project max.

- [ ] Team discovery (public teams, join requests)?
  - **Recommendation:** Phase 2. Start with invite-only.

---

## Dependencies

**Required Before Starting:**
- ✅ User authentication working
- ✅ Location system stable
- ✅ Basic role/permission system in place

**Nice to Have:**
- ⏳ Follow system (from Social Features Plan)
- ⏳ Notification system
- ⏳ Email templates

---

## Timeline Summary

**Week 1:** Teams foundation (database, API, UI)  
**Week 2:** Projects system (database, API, UI)  
**Week 3:** Assignments & tasks (API, UI, notifications)  
**Week 4:** Integration, testing, polish

**Total: 3-4 weeks** for complete MVP

---

## Next Steps

1. **Review this plan** - Get feedback on structure
2. **Decide on open questions** - Team auto-join behavior, etc.
3. **Set up feature branch** - `git checkout -b feature/teams-and-projects`
4. **Start Phase 1 Day 1** - Database schema migration
5. **Build incrementally** - Test each phase before moving forward

---

**Ready to build?** 🚀

**Last Updated:** February 2, 2026
