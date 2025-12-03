# Firebase Quick Start Checklist

Follow these steps in order to set up Firebase correctly.

## ✅ Step-by-Step Checklist

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Verify Project Connection
```bash
firebase use anas-9f395
firebase projects:list
```

### 4. Deploy Security Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules  
firebase deploy --only storage:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Or deploy everything at once:
firebase deploy --only firestore,storage
```

### 5. Firebase Console Setup

#### 5.1 Enable Authentication
1. Go to: https://console.firebase.google.com/project/anas-9f395/authentication
2. Click **"Sign-in method"**
3. Enable **"Email/Password"**
4. Click **"Save"**

#### 5.2 Create Firestore Database
1. Go to: https://console.firebase.google.com/project/anas-9f395/firestore
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose location (e.g., `europe-west` or `us-central`)
5. Click **"Enable"**

#### 5.3 Enable Storage
1. Go to: https://console.firebase.google.com/project/anas-9f395/storage
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Use same location as Firestore
5. Click **"Done"**

### 6. Create Initial Data

#### 6.1 Create Branch
1. Go to Firestore Database
2. Click **"Start collection"**
3. Collection ID: `branches`
4. Document ID: (auto-generate)
5. Add fields:
   - `name` (string): `Downtown Branch`
   - `address` (string): `123 Main St, Amman`
   - `created_at` (timestamp): Click "Set" → "Current timestamp"
6. Click **"Save"**
7. **Copy the Document ID** (you'll need it)

#### 6.2 Create Admin User in Authentication
1. Go to: https://console.firebase.google.com/project/anas-9f395/authentication/users
2. Click **"Add user"**
3. Email: `admin@restaurant.com` (or your email)
4. Password: (choose a strong password)
5. Click **"Add user"**
6. **Copy the User UID** (you'll need it)

#### 6.3 Create User Document in Firestore
1. Go to Firestore Database
2. Click **"Start collection"**
3. Collection ID: `users`
4. Document ID: **Paste the User UID from step 6.2**
5. Add fields:
   - `name` (string): `Admin User`
   - `email` (string): `admin@restaurant.com`
   - `password_hash` (string): `` (empty string)
   - `role` (string): `admin`
   - `branch_id` (string): **Paste the Branch ID from step 6.1**
   - `created_at` (timestamp): Current timestamp
6. Click **"Save"**

### 7. Test Your Setup

#### 7.1 Test Login
1. Start your app: `npm run dev`
2. Go to: http://localhost:3000/login
3. Login with the credentials from step 6.2
4. You should be redirected to the dashboard

#### 7.2 Verify Data Access
- Check browser console for errors
- Try accessing inventory page
- Verify you can see your branch data

### 8. (Optional) Create Sample Data

#### Create a Supplier:
- Collection: `suppliers`
- Fields:
  ```
  name: "Al-Rasheed Poultry"
  phone: "+962791234567"
  email: "orders@alrasheed.jo"
  created_at: (timestamp)
  ```

#### Create an Ingredient:
- Collection: `ingredients`
- Fields:
  ```
  name: "Chicken Breast"
  unit: "g"
  cost_per_unit: 0.05
  supplier_id: (supplier document ID)
  created_at: (timestamp)
  ```

#### Create Stock:
- Collection: `ingredient_stock`
- Fields:
  ```
  branch_id: (your branch ID)
  ingredient_id: (ingredient document ID)
  quantity: 5000
  expiry_date: (future date)
  last_updated: (timestamp)
  ```

---

## 🚨 Common Issues & Solutions

### Issue: "Permission denied" when reading data
**Solution:** 
- Make sure you're logged in
- Verify your user document has correct `branch_id` and `role`
- Check that security rules are deployed

### Issue: Rules not deploying
**Solution:**
```bash
# Check if logged in
firebase login

# Verify project
firebase use anas-9f395

# Try deploying again
firebase deploy --only firestore:rules
```

### Issue: Authentication not working
**Solution:**
- Verify Email/Password is enabled in Firebase Console
- Check that user document exists in Firestore with correct structure
- Verify `branch_id` matches an existing branch

### Issue: Missing indexes error
**Solution:**
- Firestore will show you the exact index needed
- Copy the index definition
- Add it to `firestore.indexes.json`
- Deploy: `firebase deploy --only firestore:indexes`

---

## 📝 Verification Commands

```bash
# Check current project
firebase use

# View deployed rules
firebase firestore:rules

# View indexes
firebase firestore:indexes

# Open Firebase Console
firebase open
```

---

## ✅ Final Checklist

- [ ] Firebase CLI installed and logged in
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Indexes deployed
- [ ] Email/Password auth enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Branch created
- [ ] Admin user created in Authentication
- [ ] User document created in Firestore
- [ ] Login tested successfully
- [ ] Data access verified

---

## 🎉 You're Done!

Once all checkboxes are complete, your Firebase setup is correct and ready to use!

For detailed information, see `FIREBASE_SETUP.md`

