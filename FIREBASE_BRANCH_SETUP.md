# Firebase Branch ID Setup Guide

This guide will help you add `branchId` and `restaurantId` to your Firebase database for proper data isolation.

## Step 1: Create Branches

First, you need to create branch documents in the `branches` collection.

### Option A: Via Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the `branches` collection (create it if it doesn't exist)
5. Click **Add document**
6. For each branch, add:
   - **Document ID**: Use a meaningful ID (e.g., `branch-1`, `downtown`, `main-store`)
   - **Fields**:
     - `name` (string): e.g., "Downtown Branch"
     - `address` (string): e.g., "123 Main Street, Amman"
     - `created_at` (timestamp): Current date/time

**Example:**
```
Document ID: branch-1
Fields:
  name: "Downtown Branch"
  address: "123 Main Street, Amman"
  created_at: [Current timestamp]
```

### Option B: Via Script (Recommended)

Run the setup script provided below to create branches programmatically.

## Step 2: Add branchId to Users

Each user document needs a `branchId` field pointing to their assigned branch.

### Via Firebase Console:

1. Go to **Firestore Database** → `users` collection
2. For each user document:
   - Click on the document
   - Click **Add field**
   - Field name: `branchId` (or `branch_id`)
   - Field type: **string**
   - Value: The document ID of the branch (e.g., `branch-1`)
   - Optionally add `restaurantId` (string) if you have multiple restaurants

**Example:**
```
Document: users/{userId}
Add field:
  branchId: "branch-1"
  restaurantId: "restaurant-1" (optional)
```

### Important Notes:
- If a user is an **Owner** and should have access to all branches, you can leave `branchId` as `null` (but the app will require it for now)
- For now, **all users must have a branchId** for the app to work
- The `branchId` should match the document ID from the `branches` collection

## Step 3: Update Existing Data (if needed)

If you have existing data in these collections, you'll need to add `branch_id`:

### Collections that need `branch_id`:
- `ingredient_stock` - Each stock record needs `branch_id`
- `purchase_orders` - Each order needs `branch_id`
- `invoices` - Each invoice needs `branch_id`
- `stock_logs` - Each log needs `branch_id`
- `restaurants` - Each restaurant needs `branch_id` (optional, links restaurant to branch)

### Via Firebase Console:

1. Go to each collection
2. For each document, add:
   - Field: `branch_id` (string)
   - Value: The branch document ID (e.g., `branch-1`)

## Step 4: Create a Default Branch (Quick Start)

If you're just getting started and have a single location:

1. Create one branch document:
   ```
   Document ID: default
   Fields:
     name: "Main Branch"
     address: "Your Address"
     created_at: [Current timestamp]
   ```

2. Update all users to have `branchId: "default"`

3. Update all existing data to have `branch_id: "default"`

## Recommended: Use the Setup Script

### Quick Setup (Recommended)

1. **Set up Firebase Admin credentials:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file (e.g., `serviceAccountKey.json`)
   - Place it in the `scripts/` folder (or set `GOOGLE_APPLICATION_CREDENTIALS` env var)

2. **Run the setup script:**
   
   **Easiest method (no environment variable needed):**
   - Place `serviceAccountKey.json` in the `scripts/` folder
   - Then run:
   ```powershell
   cd scripts
   npm install
   npx ts-node setup-branches.ts setup
   ```
   
   **Alternative: Using environment variable**
   
   **For Windows PowerShell:**
   ```powershell
   cd scripts
   npm install
   $env:GOOGLE_APPLICATION_CREDENTIALS=".\serviceAccountKey.json"
   npx ts-node setup-branches.ts setup
   ```
   
   **For Windows CMD:**
   ```cmd
   cd scripts
   npm install
   set GOOGLE_APPLICATION_CREDENTIALS=.\serviceAccountKey.json
   npx ts-node setup-branches.ts setup
   ```
   
   **For Linux/Mac:**
   ```bash
   cd scripts
   npm install
   export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
   npx ts-node setup-branches.ts setup
   ```

   This will:
   - Create a default branch
   - Assign all existing users to the default branch

### Manual Commands

```bash
# List all branches
npx ts-node scripts/setup-branches.ts list-branches

# List all users
npx ts-node scripts/setup-branches.ts list-users

# Create a custom branch
npx ts-node scripts/setup-branches.ts create branch-1 "Downtown Branch" "123 Main St"

# Assign all users to a branch
npx ts-node scripts/setup-branches.ts assign-all branch-1

# Assign specific user to branch
npx ts-node scripts/setup-branches.ts assign-user <userId> branch-1
```

## Alternative: Manual Setup via Firebase Console

If you prefer to set up manually:

1. **Create branches:**
   - Firestore → `branches` collection
   - Add document with ID (e.g., `default`)
   - Fields: `name`, `address`, `created_at`

2. **Update users:**
   - Firestore → `users` collection
   - For each user, add field: `branchId` (string) = branch document ID

3. **Update existing data** (if you have existing stock, orders, etc.):
   - Add `branch_id` field to documents in:
     - `ingredient_stock`
     - `purchase_orders`
     - `invoices`
     - `stock_logs`

