/**
 * Firebase Setup Script
 * 
 * This script initializes your Firebase database with sample data.
 * Run with: npx tsx scripts/setup-firebase.ts
 * 
 * Make sure you're logged in to Firebase CLI first: firebase login
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as readline from 'readline';

// Initialize Firebase Admin (you'll need to set up service account)
// For now, this script uses the client SDK approach
// You can also use Firebase Admin SDK with service account

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setupFirebase() {
  console.log('🚀 Firebase Setup Script for KitchenSync\n');
  
  console.log('⚠️  Note: This script requires Firebase Admin SDK setup.');
  console.log('For now, please set up your initial data manually in Firebase Console.\n');
  
  console.log('📋 Setup Checklist:');
  console.log('1. Go to Firebase Console → Firestore Database');
  console.log('2. Create a branch document in "branches" collection');
  console.log('3. Create an admin user in Firebase Authentication');
  console.log('4. Create a user document in "users" collection with the Auth UID');
  console.log('5. Link the user to the branch using branch_id\n');
  
  console.log('📝 Sample Branch Document:');
  console.log(JSON.stringify({
    name: 'Downtown Branch',
    address: '123 Main St, Amman',
    created_at: new Date().toISOString(),
  }, null, 2));
  
  console.log('\n📝 Sample User Document (use Auth UID as document ID):');
  console.log(JSON.stringify({
    name: 'Admin User',
    email: 'admin@restaurant.com',
    password_hash: '',
    role: 'admin',
    branch_id: 'YOUR_BRANCH_ID_HERE',
    created_at: new Date().toISOString(),
  }, null, 2));
  
  console.log('\n✅ After creating these, you can start using the app!');
  
  rl.close();
}

// Alternative: Manual data entry helper
async function createSampleData() {
  console.log('\n📦 Would you like to create sample data?');
  console.log('This includes: suppliers, ingredients, and initial stock.\n');
  
  const answer = await question('Enter "yes" to continue, or any key to skip: ');
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('Skipping sample data creation.');
    rl.close();
    return;
  }
  
  console.log('\n📝 Sample Data Structure:\n');
  
  // Sample Supplier
  console.log('1. Supplier Document (collection: suppliers):');
  console.log(JSON.stringify({
    name: 'Al-Rasheed Poultry',
    phone: '+962791234567',
    email: 'orders@alrasheed.jo',
    address: 'Industrial Area, Amman',
    contact_person: 'Mohammad Al-Rasheed',
    payment_terms: 'Net 30',
    delivery_days: ['Sunday', 'Wednesday'],
    created_at: new Date().toISOString(),
  }, null, 2));
  
  // Sample Ingredient
  console.log('\n2. Ingredient Document (collection: ingredients):');
  console.log(JSON.stringify({
    name: 'Chicken Breast',
    unit: 'g',
    cost_per_unit: 0.05,
    supplier_id: 'YOUR_SUPPLIER_ID_HERE',
    min_stock_level: 2000,
    max_stock_level: 10000,
    category: 'Meat',
    created_at: new Date().toISOString(),
  }, null, 2));
  
  // Sample Stock
  console.log('\n3. Stock Document (collection: ingredient_stock):');
  console.log(JSON.stringify({
    branch_id: 'YOUR_BRANCH_ID_HERE',
    ingredient_id: 'YOUR_INGREDIENT_ID_HERE',
    quantity: 5000,
    expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated: new Date().toISOString(),
  }, null, 2));
  
  console.log('\n✅ Copy these structures and create them in Firebase Console!');
  rl.close();
}

// Run setup
setupFirebase().then(() => {
  createSampleData().catch(console.error);
}).catch(console.error);

