# Fotolokashen - Social Collaboration & Sharing Implementation Plan
- Jan 7, 2026 3:39pm

> **Project:** Fotolokashen (formerly fotolokashen)
> **Feature:** User Invites, Friends, Teams, and Location Sharing  
> **Priority:** High - Core Growth Feature  
> **Estimated Timeline:** 3-4 weeks (phased approach)

---

## 🎯 **Feature Overview**

Transform Fotolokashen from a personal location manager into a **collaborative platform** where users can:
- Invite friends with personalized shareable links
- Connect with other users (friends/followers)
- Create teams/groups for projects
- Share locations with specific people or teams
- Collaborate on location scouting for productions

---

## 🚀 **Phase 1: User Invites & Dynamic OG Images** (Week 1)

### **Goals:**
- Enable viral growth through personalized invite links
- Create dynamic Open Graph images per user
- Track referrals and user acquisition

### **User Story:**
```
As a user, I want to invite my colleagues to Fotolokashen
So that we can collaborate on location scouting together
And see a personalized preview when I share my invite link
```

### **Technical Implementation:**

#### **1.1 Database Schema Updates**

```sql
-- Add referral tracking
ALTER TABLE users ADD COLUMN invited_by INT NULL;
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN invite_count INT DEFAULT 0;

-- Create invitations table
CREATE TABLE invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inviter_id INT NOT NULL,
    email VARCHAR(255),
    referral_code VARCHAR(20) NOT NULL,
    status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referral_code (referral_code),
    INDEX idx_inviter (inviter_id)
);
```

#### **1.2 API Endpoints**

```typescript
// src/app/api/invites/generate/route.ts
POST /api/invites/generate
- Generates unique referral code for user
- Returns shareable invite link
- Response: { inviteUrl: "https://fotolokashen.com/invite/abc123" }

// src/app/api/invites/[code]/route.ts
GET /api/invites/[code]
- Validates referral code
- Returns inviter info for OG image
- Tracks invite view analytics

// src/app/api/invites/accept/route.ts
POST /api/invites/accept
- Links new user to inviter
- Updates invitation status
- Increments inviter's invite_count
```

#### **1.3 Dynamic OG Image Generation**

```typescript
// src/app/invite/[code]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const alt = 'Join me on Fotolokashen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { code: string } }) {
  // Fetch inviter data
  const inviter = await getInviterByCode(params.code);
  
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
          padding: '60px',
        }}
      >
        {/* Inviter Avatar/Name */}
        <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>
          {inviter.name} invited you to
        </div>
        
        {/* Logo */}
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 30 }}>
          📍 Fotolokashen
        </div>
        
        {/* Tagline */}
        <div style={{ fontSize: 36, opacity: 0.9, textAlign: 'center' }}>
          Discover and share amazing locations together
        </div>
        
        {/* Stats (optional) */}
        <div style={{ fontSize: 24, marginTop: 40, opacity: 0.8 }}>
          Join {inviter.invite_count}+ others already collaborating
        </div>
      </div>
    ),
    { ...size }
  );
}
```

#### **1.4 Invite Landing Page**

```typescript
// src/app/invite/[code]/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata({ 
  params 
}: { 
  params: { code: string } 
}): Promise<Metadata> {
  const inviter = await getInviterByCode(params.code);
  
  return {
    title: `Join ${inviter.name} on Fotolokashen`,
    description: `${inviter.name} invited you to discover and share amazing locations for your next project.`,
    openGraph: {
      title: `${inviter.name} invited you to Fotolokashen`,
      description: 'Discover and share amazing locations together',
      images: [`/invite/${params.code}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Join ${inviter.name} on Fotolokashen`,
      images: [`/invite/${params.code}/opengraph-image`],
    },
  };
}

export default async function InvitePage({ 
  params 
}: { 
  params: { code: string } 
}) {
  const session = await getServerSession();
  const invitation = await validateInviteCode(params.code);
  
  if (!invitation) {
    redirect('/404');
  }
  
  // If already logged in, accept invite and redirect
  if (session?.user) {
    await acceptInvite(params.code, session.user.id);
    redirect('/map?invite_accepted=true');
  }
  
  // Show registration page with pre-filled referral code
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {invitation.inviter.name} invited you!
          </h1>
          <p className="text-gray-600">
            Join Fotolokashen to discover and share amazing locations
          </p>
        </div>
        
        {/* Registration Form */}
        <RegistrationForm referralCode={params.code} />
        
        {/* Already have account */}
        <div className="mt-6 text-center">
          <Link href={`/login?ref=${params.code}`} className="text-purple-600">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### **1.5 User Dashboard - Invite Section**

```typescript
// src/app/dashboard/page.tsx - Add invite section
<Card>
  <CardHeader>
    <CardTitle>Invite Friends</CardTitle>
    <CardDescription>
      Share Fotolokashen with your team and colleagues
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Invite Link */}
      <div className="flex gap-2">
        <Input 
          value={`https://fotolokashen.com/invite/${user.referralCode}`}
          readOnly
        />
        <Button onClick={copyInviteLink}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
      </div>
      
      {/* Share Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={shareToTwitter}>
          <Twitter className="w-4 h-4 mr-2" />
          Share on X
        </Button>
        <Button variant="outline" onClick={shareToLinkedIn}>
          <LinkedIn className="w-4 h-4 mr-2" />
          Share on LinkedIn
        </Button>
        <Button variant="outline" onClick={shareViaEmail}>
          <Mail className="w-4 h-4 mr-2" />
          Email Invite
        </Button>
      </div>
      
      {/* Stats */}
      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {user.invite_count} friends joined through your invite
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 👥 **Phase 2: Friends & Connections** (Week 2)

### **Goals:**
- Enable users to connect with each other
- Follow/friend system
- Activity feed of friends' locations

### **Database Schema:**

```sql
-- Friendships/Connections table
CREATE TABLE connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (user_id, friend_id),
    INDEX idx_user_connections (user_id, status),
    INDEX idx_friend_connections (friend_id, status)
);

-- Activity feed
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('location_saved', 'location_shared', 'friend_added', 'team_created') NOT NULL,
    entity_type VARCHAR(50), -- 'location', 'team', etc.
    entity_id INT,
    metadata JSON, -- Additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_activity (user_id, created_at),
    INDEX idx_activity_type (activity_type, created_at)
);
```

### **API Endpoints:**

```typescript
// Friend Management
POST /api/friends/request - Send friend request
POST /api/friends/accept/:id - Accept friend request
POST /api/friends/reject/:id - Reject friend request
DELETE /api/friends/:id - Remove friend
GET /api/friends - Get user's friends list
GET /api/friends/requests - Get pending requests
GET /api/friends/suggestions - Get friend suggestions (based on invites, mutual friends)

// Activity Feed
GET /api/activity/feed - Get activity feed from friends
GET /api/activity/user/:id - Get specific user's public activity
```

### **UI Components:**

```typescript
// src/components/social/FriendsList.tsx
// src/components/social/FriendRequests.tsx
// src/components/social/ActivityFeed.tsx
// src/components/social/UserSearchDialog.tsx
```

---

## 🏢 **Phase 3: Teams & Groups** (Week 3)

### **Goals:**
- Create teams for projects/productions
- Assign roles (owner, admin, member)
- Team-specific location collections

### **Database Schema:**

```sql
-- Teams table
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL,
    avatar_url VARCHAR(500),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_public (is_public)
);

-- Team members
CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_member (team_id, user_id),
    INDEX idx_team_members (team_id, role),
    INDEX idx_user_teams (user_id)
);

-- Team invitations
CREATE TABLE team_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    inviter_id INT NOT NULL,
    invitee_email VARCHAR(255),
    invitee_id INT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_team_invites (team_id, status),
    INDEX idx_invitee (invitee_email, status)
);
```

### **API Endpoints:**

```typescript
// Team Management
POST /api/teams - Create new team
GET /api/teams - Get user's teams
GET /api/teams/:id - Get team details
PATCH /api/teams/:id - Update team
DELETE /api/teams/:id - Delete team

// Team Members
POST /api/teams/:id/invite - Invite user to team
GET /api/teams/:id/members - Get team members
PATCH /api/teams/:id/members/:userId - Update member role
DELETE /api/teams/:id/members/:userId - Remove member

// Team Invitations
GET /api/teams/invitations - Get user's team invitations
POST /api/teams/invitations/:id/accept - Accept invitation
POST /api/teams/invitations/:id/reject - Reject invitation
```

---

## 📍 **Phase 4: Location Sharing** (Week 4)

### **Goals:**
- Share locations with friends or teams
- Permission levels (view, edit)
- Collaborative location notes

### **Database Schema:**

```sql
-- Location sharing
CREATE TABLE location_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    shared_by INT NOT NULL,
    shared_with_type ENUM('user', 'team') NOT NULL,
    shared_with_id INT NOT NULL,
    permission ENUM('view', 'edit') DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_location_shares (location_id),
    INDEX idx_shared_with (shared_with_type, shared_with_id)
);

-- Collaborative notes
CREATE TABLE location_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_location_comments (location_id, created_at)
);
```

### **API Endpoints:**

```typescript
// Location Sharing
POST /api/locations/:id/share - Share location
GET /api/locations/:id/shares - Get location shares
DELETE /api/locations/:id/shares/:shareId - Revoke share
GET /api/locations/shared-with-me - Get locations shared with user

// Comments
POST /api/locations/:id/comments - Add comment
GET /api/locations/:id/comments - Get comments
PATCH /api/locations/:id/comments/:commentId - Edit comment
DELETE /api/locations/:id/comments/:commentId - Delete comment
```

---

## 🎨 **UI/UX Enhancements**

### **Navigation Updates:**

```typescript
// Add to main navigation
- Friends (with notification badge)
- Teams
- Shared Locations
- Activity Feed
```

### **Map Page Updates:**

```typescript
// Location markers show sharing status
- Personal locations: Blue
- Shared with me: Green
- Team locations: Purple

// Quick share button on location cards
// "Share with..." dropdown (friends/teams)
```

### **Dashboard Widgets:**

```typescript
- Recent Activity Feed
- Friend Requests (pending)
- Team Invitations (pending)
- Shared Locations Count
- Invite Stats
```

---

## 📊 **Analytics & Metrics**

### **Track:**
- Invite conversion rate
- Friend connection rate
- Team creation rate
- Location sharing activity
- User engagement (DAU/MAU)
- Viral coefficient (K-factor)

### **Implementation:**

```typescript
// src/lib/analytics.ts
export async function trackInvite(inviterId: number, inviteCode: string) {
  // Track invite generation
}

export async function trackInviteAccepted(inviterId: number, newUserId: number) {
  // Track successful referral
  // Calculate viral coefficient
}

export async function trackLocationShare(locationId: number, shareType: string) {
  // Track sharing behavior
}
```

---

## 🔒 **Privacy & Permissions**

### **User Privacy Settings:**

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN privacy_settings JSON DEFAULT '{}';

-- Example privacy_settings structure:
{
  "profile_visibility": "public|friends|private",
  "location_visibility": "public|friends|private",
  "allow_friend_requests": true,
  "show_activity": true,
  "discoverable": true
}
```

### **Permission Checks:**

```typescript
// src/lib/permissions.ts
export async function canViewLocation(userId: number, locationId: number): Promise<boolean>
export async function canEditLocation(userId: number, locationId: number): Promise<boolean>
export async function canShareLocation(userId: number, locationId: number): Promise<boolean>
export async function canInviteToTeam(userId: number, teamId: number): Promise<boolean>
```

---

## 🚀 **Deployment Checklist**

### **Before Launch:**
- [ ] Database migrations tested
- [ ] API endpoints secured with auth
- [ ] Rate limiting on invite generation
- [ ] Email templates for invitations
- [ ] OG images tested on all platforms
- [ ] Privacy settings UI complete
- [ ] Analytics tracking implemented
- [ ] Mobile responsive design
- [ ] Performance testing (N+1 queries)
- [ ] Security audit (SQL injection, XSS)

### **Post-Launch:**
- [ ] Monitor invite conversion rates
- [ ] A/B test OG image variations
- [ ] Collect user feedback
- [ ] Iterate on team features
- [ ] Add gamification (badges, leaderboards)

---

## 🎯 **Success Metrics**

### **Phase 1 (Invites):**
- 30% invite acceptance rate
- 50% of users generate invite link
- 20% viral coefficient (K-factor)

### **Phase 2 (Friends):**
- Average 5 friends per user
- 60% friend request acceptance rate
- Daily activity feed engagement

### **Phase 3 (Teams):**
- 40% of users create or join a team
- Average 4 members per team
- 80% team invite acceptance rate

### **Phase 4 (Sharing):**
- 50% of locations shared at least once
- Average 3 shares per active location
- 70% of teams actively sharing locations

---

## 💡 **Future Enhancements**

### **Gamification:**
- Badges for invites (Bronze: 5, Silver: 20, Gold: 50)
- Leaderboards for most locations shared
- Team challenges and competitions

### **Advanced Collaboration:**
- Real-time collaborative editing
- Location collections (curated lists)
- Project management integration
- Calendar integration for shoots

### **Monetization:**
- Premium teams (unlimited members)
- Advanced analytics for teams
- Priority support for teams
- White-label for agencies

---

## 📝 **Notes**

- **Brand Name:** Fotolokashen (update all references from "fotolokashen")
- **Domain:** fotolokashen.com (update environment variables)
- **Social Handles:** Secure @fotolokashen on major platforms
- **Email Domain:** Use @fotolokashen.com for system emails

---

## 🔗 **Related Documents**

- `DEPLOYMENT_QUICK_REF.md` - Deployment procedures
- `PRODUCTION_READINESS_CHECKLIST.md` - Pre-launch checklist
- `DATABASE_SCHEMA.md` - Current database structure
- `API_DOCUMENTATION.md` - API reference (to be created)

---

**Last Updated:** January 7, 2026  
**Status:** Planning Phase  
**Next Steps:** Review and approve implementation plan
