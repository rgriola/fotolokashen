# Database Index Strategy

**Status**: 🟡 READY TO IMPLEMENT (When schema is finalized)  
**Date Created**: December 25, 2024

---

## ⏸️ **Why Not Implemented Yet**

Database schema is still being designed and modified. Indexes should be added as one of the **final optimization steps** after:

1. ✅ Schema is finalized
2. ✅ All tables and columns are stable
3. ✅ Application is tested with real data
4. ✅ Slow queries are identified

---

## 📋 **Recommended Indexes (When Ready)**

### **User Table**
```sql
-- Already has indexes on:
-- ✅ email (UNIQUE)
-- ✅ username (UNIQUE)

-- Recommended to add:
CREATE INDEX idx_users_is_active ON users(isActive);
CREATE INDEX idx_users_created_at ON users(createdAt);
CREATE INDEX idx_users_email_verified ON users(emailVerified);
```

**Rationale**:
- `isActive` - Filter active users
- `createdAt` - Sort by registration date, analytics
- `emailVerified` - Find unverified users

---

### **Location Table**
```sql
-- Already has index on:
-- ✅ userId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_locations_created_by ON locations(createdBy);
CREATE INDEX idx_locations_lat_lng ON locations(lat, lng);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_created_at ON locations(createdAt);
CREATE INDEX idx_locations_indoor_outdoor ON locations(indoorOutdoor);
```

**Rationale**:
- `createdBy` - Fast lookup of user's created locations
- `lat, lng` - Geospatial queries (nearby locations)
- `type` - Filter by location type
- `createdAt` - Sort by date, pagination
- `indoorOutdoor` - Filter indoor/outdoor

---

### **UserSave Table**
```sql
-- Already has indexes on:
-- ✅ userId (FOREIGN KEY)
-- ✅ locationId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_usersaves_is_favorite ON userSaves(isFavorite);
CREATE INDEX idx_usersaves_saved_at ON userSaves(savedAt);
CREATE INDEX idx_usersaves_user_favorite ON userSaves(userId, isFavorite);
```

**Rationale**:
- `isFavorite` - Filter favorites
- `savedAt` - Sort by save date
- `userId, isFavorite` - Compound index for "user's favorites" query

---

### **Session Table**
```sql
-- Already has index on:
-- ✅ userId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expiresAt);
CREATE INDEX idx_sessions_is_active ON sessions(isActive);
CREATE INDEX idx_sessions_user_active ON sessions(userId, isActive);
```

**Rationale**:
- `token` - Fast session lookup (authentication)
- `expiresAt` - Cleanup old sessions
- `isActive` - Filter active sessions
- `userId, isActive` - Compound index for "user's active sessions"

---

### **Photo Table**
```sql
-- Already has index on:
-- ✅ placeId (FOREIGN KEY)
-- ✅ userId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_photos_is_primary ON photos(isPrimary);
CREATE INDEX idx_photos_uploaded_at ON photos(uploadedAt);
CREATE INDEX idx_photos_place_primary ON photos(placeId, isPrimary);
```

**Rationale**:
- `isPrimary` - Find primary photos
- `uploadedAt` - Sort by upload date
- `placeId, isPrimary` - Compound index for "location's primary photo"

---

### **Project Table**
```sql
-- Already has index on:
-- ✅ userId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_projects_created_at ON projects(createdAt);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_user_status ON projects(userId, status);
```

**Rationale**:
- `createdAt` - Sort by date
- `status` - Filter by project status
- `userId, status` - Compound index for "user's active projects"

---

### **ProjectLocation Table**
```sql
-- Already has indexes on:
-- ✅ projectId (FOREIGN KEY)
-- ✅ locationId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_project_locations_added_at ON projectLocations(addedAt);
```

**Rationale**:
- `addedAt` - Sort by when location was added to project

---

### **LocationContact Table**
```sql
-- Already has index on:
-- ✅ locationId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_location_contacts_contact_type ON locationContacts(contactType);
```

**Rationale**:
- `contactType` - Filter by contact type (owner, manager, etc.)

---

### **TeamMember Table**
```sql
-- Already has indexes on:
-- ✅ projectId (FOREIGN KEY)
-- ✅ userId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_team_members_role ON teamMembers(role);
CREATE INDEX idx_team_members_project_role ON teamMembers(projectId, role);
```

**Rationale**:
- `role` - Filter by team member role
- `projectId, role` - Compound index for "project's admins/editors"

---

### **SecurityLog Table**
```sql
-- Already has index on:
-- ✅ userId (FOREIGN KEY)

-- Recommended to add:
CREATE INDEX idx_security_logs_event_type ON securityLogs(eventType);
CREATE INDEX idx_security_logs_timestamp ON securityLogs(timestamp);
CREATE INDEX idx_security_logs_user_event ON securityLogs(userId, eventType);
```

**Rationale**:
- `eventType` - Filter by event type (login, password_reset, etc.)
- `timestamp` - Sort by time, analytics
- `userId, eventType` - Compound index for "user's login history"

---

## 🎯 **Implementation Guide (When Ready)**

### **Step 1: Add Indexes to Prisma Schema**

Edit `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields ...
  
  @@index([isActive])
  @@index([createdAt])
  @@index([emailVerified])
}

model Location {
  // ... existing fields ...
  
  @@index([createdBy])
  @@index([lat, lng])
  @@index([type])
  @@index([createdAt])
  @@index([indoorOutdoor])
}

// ... add for other models ...
```

### **Step 2: Create Migration**

```bash
npx prisma migrate dev --name add_performance_indexes
```

### **Step 3: Test Query Performance**

```bash
# Before and after comparison
npx prisma studio
# Run queries and check execution time
```

---

## 📊 **Expected Performance Improvements**

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| User lookup (email) | Fast | Fast | Already indexed |
| User's locations | Slow | Fast | ✅ +90% |
| Nearby locations (geo) | Slow | Fast | ✅ +95% |
| User's favorites | Medium | Fast | ✅ +80% |
| Session lookup | Slow | Fast | ✅ +99% |
| Photo by location | Medium | Fast | ✅ +70% |
| Project filtering | Slow | Fast | ✅ +85% |

---

## ⚠️ **Index Considerations**

### **Trade-offs**:
- ✅ **Pros**: Faster SELECT queries
- ❌ **Cons**: Slower INSERT/UPDATE/DELETE
- ❌ **Cons**: More storage space

### **When to Add**:
- ✅ After schema is stable
- ✅ When query performance becomes an issue
- ✅ Based on actual slow queries (not premature optimization)

### **When NOT to Add**:
- ❌ On small tables (< 1000 rows)
- ❌ On columns that change frequently
- ❌ Before testing with realistic data

---

## 🧪 **Testing Plan (When Ready)**

1. **Baseline**: Run slow queries, record times
2. **Add indexes**: Run migration
3. **Retest**: Run same queries, compare times
4. **Monitor**: Check INSERT/UPDATE performance
5. **Adjust**: Remove unnecessary indexes

---

## 📝 **Notes**

- All PRIMARY KEYs automatically have indexes ✅
- All FOREIGN KEYs automatically have indexes ✅
- UNIQUE constraints automatically have indexes ✅
- Only need to add indexes for frequently queried non-key columns

---

## ✅ **When You're Ready**

1. Finalize your database schema
2. Test with real data
3. Identify slow queries with Prisma query logging
4. Come back to this document
5. Add indexes based on actual performance needs

**This document will be ready when you are!** 🚀

---

**Last Updated**: December 25, 2024  
**Status**: Ready to implement when schema is finalized
