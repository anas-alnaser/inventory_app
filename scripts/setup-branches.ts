/**
 * Script to set up branches and add branchId to users in Firebase
 * 
 * Prerequisites:
 *   1. Install dependencies: cd scripts && npm install
 *   2. Set up Firebase Admin credentials (see FIREBASE_BRANCH_SETUP.md)
 * 
 * Usage:
 *   cd scripts
 *   npx ts-node setup-branches.ts <command> [args]
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
// You need to set up service account credentials
// Option 1: Use environment variable with path to service account JSON
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  if (fs.existsSync(credPath)) {
    const serviceAccount = require(credPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.error(`❌ Service account file not found: ${credPath}`);
    process.exit(1);
  }
} else {
  // Option 2: Try to load from default location (scripts/serviceAccountKey.json)
  const defaultPath = path.join(__dirname, 'serviceAccountKey.json');
  
  if (fs.existsSync(defaultPath)) {
    const serviceAccount = require(defaultPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Loaded service account from default location');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Option 3: Use Application Default Credentials (for Firebase CLI)
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Using Application Default Credentials');
  } else {
    console.error('❌ Firebase Admin not initialized. Please set up credentials.');
    console.error('\nOptions:');
    console.error('  1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.error('  2. Place serviceAccountKey.json in the scripts/ folder');
    console.error('  3. Use Firebase CLI with: firebase login');
    console.error('\nSee FIREBASE_BRANCH_SETUP.md for instructions.');
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Create a default branch
 */
async function createDefaultBranch() {
  const branchId = 'default';
  const branchRef = db.collection('branches').doc(branchId);
  
  await branchRef.set({
    name: 'Main Branch',
    address: 'Your Main Address',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log(`✅ Created branch: ${branchId}`);
  return branchId;
}

/**
 * Create a custom branch
 */
async function createBranch(branchId: string, name: string, address: string) {
  const branchRef = db.collection('branches').doc(branchId);
  
  await branchRef.set({
    name,
    address,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log(`✅ Created branch: ${branchId} - ${name}`);
  return branchId;
}

/**
 * Add branchId to all users (assigns them to default branch)
 */
async function assignUsersToBranch(branchId: string = 'default') {
  const usersSnapshot = await db.collection('users').get();
  
  let updated = 0;
  let skipped = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    
    // Skip if already has branchId
    if (userData.branchId || userData.branch_id) {
      console.log(`⏭️  User ${userDoc.id} already has branchId, skipping...`);
      skipped++;
      continue;
    }
    
    // Update user with branchId
    await userDoc.ref.update({
      branchId: branchId,
      // Also set restaurantId if you want (optional)
      // restaurantId: 'restaurant-1',
    });
    
    console.log(`✅ Updated user ${userDoc.id} with branchId: ${branchId}`);
    updated++;
  }
  
  console.log(`\n📊 Summary: Updated ${updated} users, skipped ${skipped} users`);
}

/**
 * Assign a specific user to a specific branch
 */
async function assignUserToBranch(userId: string, branchId: string) {
  const userRef = db.collection('users').doc(userId);
  
  await userRef.update({
    branchId: branchId,
  });
  
  console.log(`✅ Assigned user ${userId} to branch ${branchId}`);
}

/**
 * List all branches
 */
async function listBranches() {
  const branchesSnapshot = await db.collection('branches').get();
  
  console.log('\n📋 Available Branches:');
  branchesSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`  - ${doc.id}: ${data.name} (${data.address})`);
  });
}

/**
 * List all users and their branch assignments
 */
async function listUsers() {
  const usersSnapshot = await db.collection('users').get();
  
  console.log('\n👥 Users:');
  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    const branchId = data.branchId || data.branch_id || '❌ Not assigned';
    console.log(`  - ${doc.id} (${data.email || data.name}): ${branchId}`);
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'create-default':
        await createDefaultBranch();
        break;
        
      case 'create':
        if (!args[1] || !args[2] || !args[3]) {
          console.error('Usage: create <branchId> <name> <address>');
          process.exit(1);
        }
        await createBranch(args[1], args[2], args[3]);
        break;
        
      case 'assign-all':
        const branchId = args[1] || 'default';
        await assignUsersToBranch(branchId);
        break;
        
      case 'assign-user':
        if (!args[1] || !args[2]) {
          console.error('Usage: assign-user <userId> <branchId>');
          process.exit(1);
        }
        await assignUserToBranch(args[1], args[2]);
        break;
        
      case 'list-branches':
        await listBranches();
        break;
        
      case 'list-users':
        await listUsers();
        break;
        
      case 'setup':
        // Complete setup: create default branch and assign all users
        console.log('🚀 Setting up branches...\n');
        await createDefaultBranch();
        console.log('\n👥 Assigning users to default branch...\n');
        await assignUsersToBranch('default');
        console.log('\n✅ Setup complete!');
        break;
        
      default:
        console.log(`
📚 Branch Setup Script

Usage:
  npx ts-node scripts/setup-branches.ts <command> [args]

Commands:
  setup                    - Complete setup (create default branch + assign all users)
  create-default           - Create a default branch
  create <id> <name> <addr> - Create a custom branch
  assign-all [branchId]    - Assign all users to a branch (default: 'default')
  assign-user <userId> <branchId> - Assign specific user to branch
  list-branches            - List all branches
  list-users               - List all users and their branch assignments

Examples:
  npx ts-node scripts/setup-branches.ts setup
  npx ts-node scripts/setup-branches.ts create branch-1 "Downtown" "123 Main St"
  npx ts-node scripts/setup-branches.ts assign-all branch-1
  npx ts-node scripts/setup-branches.ts assign-user user123 branch-1
  npx ts-node scripts/setup-branches.ts list-branches
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

