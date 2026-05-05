# Relations Features - Implementation Guide

## 📋 Overview
This implementation adds comprehensive relationship management features between users.

## 🎯 Features Implemented

### 1. Relations Model & Database
**Backend Structure:**
- Relation model stores bidirectional relationships
- Automatic reverse relationship creation
- 20+ predefined relation types

**Relation Types:**
- Family: mother, father, sister, brother, daughter, son, grandmother, grandfather, granddaughter, grandson, aunt, uncle, cousin
- Partners: wife, husband, fiancée, fiancé
- Social: friend, colleague, other

**Bidirectional Mapping:**
```
mother ↔ son
father ↔ daughter
sister ↔ brother
wife ↔ husband
friend ↔ friend
```

### 2. Relations Card on Profile
**Features:**
- Shows maximum 4 relations in horizontal scroll
- Click any relation to view their profile
- Displays user avatar, name, and relation type
- Shows "+N more" indicator when relations exceed 4

**Location:** Profile page, top section

### 3. Explore Page Enhancements
**New Features:**
- **Verified Filter:** Checkbox to show only verified users
- **Auto-Sorting:** Verified users always appear first
- **Search:** Filter by name, username, or email
- **Add Relation Button:** Quick relation connection from explore page
- **User Counter:** Shows X of Y total users

**Buttons:**
- "View Profile" - Navigate to user profile
- "Add Relation" - Open relation selection modal

### 4. Add Relation Modal
**Workflow:**
1. Click "Add Relation" on any user card
2. Select relation type from dropdown
3. Click "Add Relation" to create
4. Reverse relationship is automatically created

**Example:**
- User A adds User B as "Mother"
- System automatically creates: User B is "Son" of User A

### 5. Backend API

**Create Relation:**
```bash
POST /api/relations/
{
  "from_user_id": 1,
  "to_user_username": "john_doe",
  "relation_type": "mother"
}
```

**Get User Relations:**
```bash
GET /api/users/{username}/
# Returns: relations_from array with all relations
```

**Filter by Verified:**
```bash
GET /api/users/?verified=true
# Returns: verified users only, sorted by date
```

## 🚀 Getting Started

### Backend Setup
1. Create and apply migrations:
```bash
cd backend
python manage.py makemigrations users
python manage.py migrate
```

2. Test the API:
```bash
# Get users (sorted by verified first)
curl http://localhost:8000/api/users/

# Create a relation
curl -X POST http://localhost:8000/api/relations/ \
  -H "Content-Type: application/json" \
  -d '{
    "from_user_id": 1,
    "to_user_username": "jane_doe",
    "relation_type": "mother"
  }'
```

### Frontend Usage
1. Navigate to "Explore" in sidebar
2. Use search or verified filter
3. Click "Add Relation" on desired user
4. Select relation type and confirm
5. View relations on user's profile

## 📝 Notes

- Relations are bidirectional and automatically managed
- User cannot create relation with themselves
- Relation type determines the reverse type automatically
- All relation changes are reflected immediately
- Verified status is shown with a ✓ badge

## ⚠️ Important
- Backend migrations MUST be run before using the feature
- Relations table will be created with proper constraints
- Ensure user IDs and usernames are valid before creating relations
