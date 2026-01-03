# Testing Guide - User-Specific Locations

## ✅ Quick Verification Test

After the migration, test that locations are now user-specific:

### **Step 1: Log in as Admin**
- Email: `rodczaro@gmail.com`
- This is the only user in the database after reset

### **Step 2: Save a Location**
1. Search for a Google place (e.g., "Central Park, New York")
2. Click "Save Location"
3. Add notes or photos
4. Verify it appears in "My Locations"

### **Step 3: Verify Database Structure**
Run this query to see the location:
```sql
SELECT id, "placeId", name, "createdBy" FROM locations;
```

You should see:
```
id | placeId  | name         | createdBy
---+----------+--------------+-----------
1  | ChIJ...  | Central Park | <user_id>
```

### **Step 4: Upload Photos**
1. Upload a photo to the location
2. Run this query:
```sql
SELECT id, "locationId", "placeId", "userId" FROM photos;
```

You should see:
```
id | locationId | placeId  | userId
---+------------+----------+--------
1  | 1          | ChIJ...  | <user_id>
```

Notice `locationId` matches the location `id` (not just placeId).

### **Step 5: Test with Second User (Future)**
When you have a second user:
1. Second user saves the SAME Google place
2. They should get a NEW location record (different id)
3. Their photos should link to THEIR location (different locationId)
4. First user should NOT see second user's photos

---

## 🧪 API Testing

### **Test Location Creation:**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "placeId": "ChIJAbc123...",
    "name": "Test Location",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

Expected: Creates location with `createdBy` = current user ID

### **Test Photo Upload:**
```bash
curl -X POST http://localhost:3000/api/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "locationId": 1,
    "placeId": "ChIJAbc123...",
    "imagekitFileId": "file_123",
    "imagekitFilePath": "/users/1/photo.jpg"
  }'
```

Expected: Creates photo linked to `locationId=1`

### **Test Photo Fetch:**
```bash
curl http://localhost:3000/api/photos?locationId=1 \
  -H "Authorization: Bearer <token>"
```

Expected: Returns ONLY photos for that specific locationId

---

## 🔍 What to Look For

### **✅ Success Indicators:**
- Each user gets their own location record (even for same Google place)
- Photos have `locationId` field populated
- Photo queries use `locationId` not `placeId`
- No data sharing between users
- Deleting a location cascades to delete its photos

### **❌ Failure Indicators:**
- Multiple users sharing one location record
- Photos missing `locationId`
- Users seeing each other's photos
- Error: "locationId is required"

---

## 📊 Database Queries for Verification

### **Check Unique Constraint:**
```sql
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'locations' AND constraint_type = 'UNIQUE';
```

Should show: `locations_createdBy_placeId_key`

### **Check Photo Foreign Key:**
```sql
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'photos' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'locationId';
```

Should show FK constraint: `photos.locationId → locations.id`

---

## 🚀 Ready to Test!

The migration is complete. Start the development server and test the flow:

```bash
npm run dev
```

Then navigate to http://localhost:3000 and test saving locations and uploading photos.
