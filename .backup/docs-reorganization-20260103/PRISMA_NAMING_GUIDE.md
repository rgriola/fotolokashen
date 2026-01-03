# Prisma Model & Table Naming Convention

**Last Updated**: December 26, 2024  
**Purpose**: Clarify the relationship between Prisma models, database tables, and code usage

---

## 🎯 **Quick Reference**

### **Three Different Names, One Entity:**

| Prisma Model (schema.prisma) | Database Table (MySQL) | Code Usage (TypeScript) |
|------------------------------|------------------------|-------------------------|
| `Photo`                      | `photos`               | `prisma.photo`          |
| `User`                       | `users`                | `prisma.user`           |
| `Location`                   | `locations`            | `prisma.location`       |
| `UserSave`                   | `user_saves`           | `prisma.userSave`       |
| `Session`                    | `sessions`             | `prisma.session`        |
| `Project`                    | `projects`             | `prisma.project`        |
| `ProjectLocation`            | `project_locations`    | `prisma.projectLocation`|
| `LocationContact`            | `location_contacts`    | `prisma.locationContact`|
| `TeamMember`                 | `team_members`         | `prisma.teamMember`     |
| `SecurityLog`                | `security_logs`        | `prisma.securityLog`    |

---

## 📚 **Why Three Different Names?**

### **1. Prisma Model Name** (PascalCase)
- **Where**: `prisma/schema.prisma`
- **Format**: `Photo`, `User`, `UserSave`
- **Purpose**: TypeScript class name
- **Example**:
```prisma
model Photo {
  id Int @id
  // ...
  @@map("photos")  // ← Maps to database table
}
```

### **2. Database Table Name** (snake_case)
- **Where**: MySQL database
- **Format**: `photos`, `users`, `user_saves`
- **Purpose**: Actual table in database
- **Example**:
```sql
DESCRIBE photos;  -- lowercase, plural
```

### **3. Code Usage** (camelCase)
- **Where**: TypeScript/JavaScript code
- **Format**: `prisma.photo`, `prisma.user`, `prisma.userSave`
- **Purpose**: Prisma Client API
- **Example**:
```typescript
const photo = await prisma.photo.findUnique({ where: { id: 1 } });
```

---

## 🔍 **Examples in Practice**

### **Example 1: Photos**

#### **In Prisma Schema:**
```prisma
model Photo {
  id                 Int       @id @default(autoincrement())
  placeId            String
  gpsLatitude        Float?
  // ...
  
  @@map("photos")  // ← This is the actual MySQL table name
}
```

#### **In MySQL:**
```sql
-- Table name is lowercase plural
SELECT * FROM photos WHERE gpsLatitude IS NOT NULL;
```

#### **In TypeScript Code:**
```typescript
// Prisma Client uses camelCase singular
const photosWithGPS = await prisma.photo.findMany({
  where: { hasGpsData: true }
});
```

#### **In Prisma Studio:**
```
Displays: "Photo" (model name)
Actual table: "photos"
```

---

### **Example 2: User Saves**

#### **In Prisma Schema:**
```prisma
model UserSave {
  id         Int      @id
  userId     Int
  locationId Int
  // ...
  
  @@map("user_saves")  // ← MySQL table name
}
```

#### **In MySQL:**
```sql
-- Use snake_case table name
SELECT * FROM user_saves WHERE userId = 1;
```

#### **In TypeScript Code:**
```typescript
// Use camelCase
const saves = await prisma.userSave.findMany({
  where: { userId: 1 }
});
```

---

## 🛠️ **How the Mapping Works**

### **The `@@map()` Directive:**

```prisma
model Photo {      // ← TypeScript type name (PascalCase)
  // fields...
  
  @@map("photos")  // ← Database table name (snake_case)
}
```

**What this does:**
1. **Prisma generates** a TypeScript type called `Photo`
2. **Prisma Client creates** `prisma.photo` (camelCase)
3. **Database queries use** `photos` table (snake_case)

---

## 📖 **Complete Model Mapping Table**

| What You See in... | Prisma Studio | Database (MySQL) | TypeScript Code | Prisma Schema |
|-------------------|---------------|------------------|-----------------|---------------|
| **Photos**        | `Photo`       | `photos`         | `prisma.photo`  | `model Photo` |
| **Users**         | `User`        | `users`          | `prisma.user`   | `model User` |
| **Locations**     | `Location`    | `locations`      | `prisma.location` | `model Location` |
| **User Saves**    | `UserSave`    | `user_saves`     | `prisma.userSave` | `model UserSave` |
| **Sessions**      | `Session`     | `sessions`       | `prisma.session` | `model Session` |
| **Projects**      | `Project`     | `projects`       | `prisma.project` | `model Project` |
| **Project Locations** | `ProjectLocation` | `project_locations` | `prisma.projectLocation` | `model ProjectLocation` |
| **Location Contacts** | `LocationContact` | `location_contacts` | `prisma.locationContact` | `model LocationContact` |
| **Team Members**  | `TeamMember`  | `team_members`   | `prisma.teamMember` | `model TeamMember` |
| **Security Logs** | `SecurityLog` | `security_logs`  | `prisma.securityLog` | `model SecurityLog` |

---

## ✅ **Best Practices**

### **When Writing Code:**

```typescript
// ✅ CORRECT - Use Prisma Client camelCase
const photo = await prisma.photo.findUnique({ where: { id: 1 } });
const user = await prisma.user.findFirst({ where: { email: "test@example.com" } });
const userSave = await prisma.userSave.create({ data: { ... } });

// ❌ WRONG - Don't try to use table names
const photo = await prisma.photos.findUnique({ ... }); // Error!
const userSave = await prisma.user_saves.create({ ... }); // Error!
```

### **When Writing SQL:**

```sql
-- ✅ CORRECT - Use actual table names (lowercase)
SELECT * FROM photos WHERE hasGpsData = 1;
SELECT * FROM user_saves WHERE userId = 1;
SELECT * FROM location_contacts WHERE locationId = 5;

-- ❌ WRONG - Don't use model names
SELECT * FROM Photo WHERE hasGpsData = 1; -- Error!
SELECT * FROM UserSave WHERE userId = 1; -- Error!
```

### **When Using Prisma Studio:**

- **What you see**: `Photo`, `User`, `UserSave` (model names)
- **What's in database**: `photos`, `users`, `user_saves` (table names)
- **They're the same data**, just different display names!

---

## 🤔 **Common Questions**

### **Q: Why not make them all the same name?**
**A**: This follows standard conventions:
- **TypeScript/JavaScript**: Uses camelCase and PascalCase
- **SQL databases**: Use snake_case
- **Prisma**: Bridges both worlds elegantly

### **Q: Can I change the model names to match tables?**
**A**: Yes, but you'd lose TypeScript conventions:
```prisma
// NOT recommended
model photos {  // lowercase model name - breaks conventions
  @@map("photos")
}
```

### **Q: How do I know which name to use?**
**A**: Simple rules:
- **Writing TypeScript?** → Use `prisma.photo` (camelCase)
- **Writing SQL?** → Use `photos` (snake_case)
- **In Prisma schema?** → Use `model Photo` (PascalCase)
- **Looking at Prisma Studio?** → See `Photo` but know it's `photos` table

### **Q: What if I forget the table name?**
**A**: Look in the schema:
```prisma
model Photo {
  // fields...
  @@map("photos")  // ← Here's the table name!
}
```

---

## 📊 **Visual Guide**

```
┌─────────────────────────────────────────────────────────┐
│                  PRISMA NAMING LAYERS                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Prisma Schema (schema.prisma)                         │
│  ┌─────────────────────────┐                           │
│  │ model Photo {           │  ← PascalCase             │
│  │   id Int                │                           │
│  │   @@map("photos")  ─────┼──┐                        │
│  └─────────────────────────┘  │                        │
│                                │                        │
│  TypeScript Code               │                        │
│  ┌─────────────────────────┐  │                        │
│  │ prisma.photo.create()   │  ← camelCase              │
│  │ const photos = await... │                           │
│  └─────────────────────────┘  │                        │
│                                │                        │
│  Prisma Studio Display         │                        │
│  ┌─────────────────────────┐  │                        │
│  │ Model: Photo            │  ← PascalCase (display)   │
│  │ Records: [...]          │                           │
│  └─────────────────────────┘  │                        │
│                                │                        │
│                                ▼                        │
│  MySQL Database                                         │
│  ┌─────────────────────────┐                           │
│  │ TABLE: photos           │  ← snake_case (actual)    │
│  │ COLUMNS: id, placeId... │                           │
│  └─────────────────────────┘                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 **Quick Cheat Sheet**

**Print this out and keep it handy!**

```
WHEN YOU SEE          REMEMBER IT'S ACTUALLY       USE IN CODE AS
─────────────────────────────────────────────────────────────────
Photo                 photos table                 prisma.photo
User                  users table                  prisma.user
Location              locations table              prisma.location
UserSave              user_saves table             prisma.userSave
Session               sessions table               prisma.session
Project               projects table               prisma.project
ProjectLocation       project_locations table      prisma.projectLocation
LocationContact       location_contacts table      prisma.locationContact
TeamMember            team_members table           prisma.teamMember
SecurityLog           security_logs table          prisma.securityLog
```

---

## 📝 **Summary**

- ✅ **Prisma Studio shows**: Model names (Photo, User, UserSave)
- ✅ **MySQL database has**: Table names (photos, users, user_saves)
- ✅ **Your code uses**: Prisma Client (prisma.photo, prisma.user)
- ✅ **They're all connected** via the `@@map()` directive
- ✅ **This is standard** Prisma convention - not a mistake!

---

**Remember**: Different tools, different naming conventions, same data! 🎯
