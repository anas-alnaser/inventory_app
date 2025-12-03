# Firebase Setup Guide for KitchenSync

This guide will walk you through setting up Firebase correctly for your KitchenSync application.

## Prerequisites

- Node.js installed
- Firebase account (Google account)
- Your Firebase project ID: `anas-9f395`

---

## Step 1: Install Firebase CLI

Open your terminal and install Firebase CLI globally:

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

---

## Step 2: Login to Firebase

Login to your Firebase account:

```bash
firebase login
```

This will open a browser window for authentication. After logging in, verify:
```bash
firebase projects:list
```

You should see your project `anas-9f395` listed.

---

## Step 3: Initialize Firebase in Your Project (if not done)

If Firebase isn't initialized yet, run:

```bash
firebase init
```

**Select the following options:**
- ✅ Firestore: Configure security rules and indexes files
- ✅ Storage: Configure security rules files
- ✅ Hosting: Configure files for Firebase Hosting (optional, for deployment)

**When prompted:**
- Use existing project: `anas-9f395`
- Firestore rules file: `firestore.rules` (already exists)
- Firestore indexes file: `firestore.indexes.json` (already exists)
- Storage rules file: `storage.rules` (already exists)

---

## Step 4: Set Up Firebase Console

### 4.1 Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `anas-9f395`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

### 4.2 Create Firestore Database

1. Navigate to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (rules will be deployed separately)
4. Select a location (choose closest to your users, e.g., `europe-west` or `us-central`)
5. Click **Enable**

### 4.3 Enable Storage

1. Navigate to **Storage**
2. Click **Get started**
3. Start in **production mode**
4. Use the same location as Firestore
5. Click **Done**

---

## Step 5: Deploy Security Rules

Deploy your Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

Deploy your Storage security rules:

```bash
firebase deploy --only storage:rules
```

Deploy Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

**Or deploy everything at once:**
```bash
firebase deploy --only firestore,storage
```

---

## Step 6: Create Initial Data Structure

You need to create initial data in Firestore. You can do this manually or use a script.

### Option A: Manual Setup (Recommended for first time)

1. Go to **Firestore Database** in Firebase Console
2. Create the following collections and documents:

#### Create a Branch:
- Collection: `branches`
- Document ID: (auto-generate)
- Fields:
  ```
  name: "Downtown Branch" (string)
  address: "123 Main St, Amman" (string)
  created_at: (timestamp - use current time)
  ```

#### Create an Admin User:
- Collection: `users`
- Document ID: (use your Firebase Auth UID - see Step 7)
- Fields:
  ```
  name: "Admin User" (string)
  email: "admin@restaurant.com" (string)
  password_hash: "" (string - Firebase handles passwords)
  role: "admin" (string)
  branch_id: (the branch ID you created above)
  created_at: (timestamp)
  ```

### Option B: Use a Setup Script

Create a setup script to initialize your database (see `scripts/setup-firebase.ts` below).

---

## Step 7: Create Your First Admin User

### 7.1 Create User in Firebase Authentication

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Add user**
5. **Copy the User UID** (you'll need this)

### 7.2 Create User Document in Firestore

1. Go to **Firestore Database**
2. Navigate to `users` collection
3. Create a document with the **User UID** as the document ID
4. Add fields:
   ```
   name: "Your Name"
   email: "your-email@example.com"
   password_hash: ""
   role: "admin"
   branch_id: "YOUR_BRANCH_ID"
   created_at: (timestamp)
   ```

---

## Step 8: Test Your Setup

### 8.1 Test Authentication

Try logging in with your admin credentials in your app:
- Email: The email you created
- Password: The password you set

### 8.2 Test Firestore Connection

Check browser console for any Firestore errors. You should be able to:
- Read branches
- Read users
- Read/write inventory data (if you have permissions)

### 8.3 Verify Security Rules

Test that rules are working:
- Try accessing data without being logged in (should fail)
- Try accessing data from a different branch (should fail if you're not admin)

---

## Step 9: Create Sample Data (Optional)

You can create sample suppliers, ingredients, and stock data manually or use a script.

### Sample Supplier:
```
Collection: suppliers
Fields:
  name: "Al-Rasheed Poultry"
  phone: "+962791234567"
  email: "orders@alrasheed.jo"
  created_at: (timestamp)
```

### Sample Ingredient:
```
Collection: ingredients
Fields:
  name: "Chicken Breast"
  unit: "g"
  cost_per_unit: 0.05
  supplier_id: (supplier ID)
  created_at: (timestamp)
```

### Sample Stock:
```
Collection: ingredient_stock
Fields:
  branch_id: (your branch ID)
  ingredient_id: (ingredient ID)
  quantity: 5000
  expiry_date: (future date)
  last_updated: (timestamp)
```

---

## Step 10: Environment Variables (if needed)

If you need to use environment variables for Firebase config (recommended for production), create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=anas-9f395.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=anas-9f395
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=anas-9f395.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=375882098172
NEXT_PUBLIC_FIREBASE_APP_ID=1:375882098172:web:1e2c6977645b3794173e79
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DK0E6GSLT0
```

---

## Troubleshooting

### Issue: "Permission denied" errors
- **Solution**: Make sure you're logged in and your user document exists in Firestore with correct `branch_id` and `role`

### Issue: Rules not deploying
- **Solution**: Check that you're logged in: `firebase login`
- Verify project: `firebase use anas-9f395`

### Issue: Index errors
- **Solution**: Firestore will suggest missing indexes. Copy the index definition and add it to `firestore.indexes.json`, then deploy

### Issue: Authentication not working
- **Solution**: 
  - Verify Email/Password is enabled in Firebase Console
  - Check that user document exists in Firestore
  - Verify `branch_id` matches an existing branch

---

## Next Steps

1. ✅ Deploy rules and indexes
2. ✅ Create initial branch and admin user
3. ✅ Test authentication
4. ✅ Add sample data
5. ✅ Connect your app pages to real Firestore data (replace mock data)

---

## Useful Commands

```bash
# View current project
firebase use

# Switch projects
firebase use anas-9f395

# Deploy everything
firebase deploy

# Deploy only rules
firebase deploy --only firestore:rules,storage:rules

# View Firestore data
firebase firestore:indexes

# Open Firebase Console
firebase open
```

---

## Security Checklist

- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Indexes deployed
- [ ] Email/Password auth enabled
- [ ] Admin user created with correct role
- [ ] Branch created and linked to admin user
- [ ] Test authentication works
- [ ] Test branch isolation (users can only see their branch data)

---

## Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Check browser console for client-side errors
3. Verify all rules are deployed correctly
4. Ensure user documents have correct structure

