/**
 * Firebase Verification Script
 * 
 * This script verifies your Firebase setup is correct.
 * Run with: npx tsx scripts/verify-firebase.ts
 */

import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface VerificationResult {
  check: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
}

async function verifyFirebaseSetup() {
  console.log('🔍 Verifying Firebase Setup...\n');
  
  const results: VerificationResult[] = [];
  
  // Check 1: Firebase connection
  try {
    const branchesRef = collection(db, 'branches');
    await getDocs(query(branchesRef, limit(1)));
    results.push({
      check: 'Firestore Connection',
      status: '✅',
      message: 'Successfully connected to Firestore'
    });
  } catch (error: any) {
    results.push({
      check: 'Firestore Connection',
      status: '❌',
      message: `Failed to connect: ${error.message}`
    });
  }
  
  // Check 2: Branches collection exists
  try {
    const branchesRef = collection(db, 'branches');
    const snapshot = await getDocs(query(branchesRef, limit(1)));
    if (snapshot.empty) {
      results.push({
        check: 'Branches Collection',
        status: '⚠️',
        message: 'Collection exists but is empty. Create at least one branch.'
      });
    } else {
      results.push({
        check: 'Branches Collection',
        status: '✅',
        message: `Found ${snapshot.size} branch(es)`
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Branches Collection',
      status: '❌',
      message: `Error: ${error.message}`
    });
  }
  
  // Check 3: Users collection exists
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, limit(1)));
    if (snapshot.empty) {
      results.push({
        check: 'Users Collection',
        status: '⚠️',
        message: 'Collection exists but is empty. Create at least one user.'
      });
    } else {
      results.push({
        check: 'Users Collection',
        status: '✅',
        message: `Found ${snapshot.size} user(s)`
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Users Collection',
      status: '❌',
      message: `Error: ${error.message}`
    });
  }
  
  // Check 4: Authentication (requires user input)
  console.log('\n📧 Authentication Test');
  console.log('Enter test credentials (or press Enter to skip):');
  
  // Note: In a real script, you'd use readline, but for simplicity, we'll skip interactive auth test
  results.push({
    check: 'Authentication',
    status: '⚠️',
    message: 'Manual test required. Try logging in through the app.'
  });
  
  // Display results
  console.log('\n📊 Verification Results:\n');
  results.forEach(result => {
    console.log(`${result.status} ${result.check}: ${result.message}`);
  });
  
  // Summary
  const successCount = results.filter(r => r.status === '✅').length;
  const warningCount = results.filter(r => r.status === '⚠️').length;
  const errorCount = results.filter(r => r.status === '❌').length;
  
  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errorCount === 0 && warningCount === 0) {
    console.log('\n🎉 All checks passed! Your Firebase setup is correct.');
  } else if (errorCount === 0) {
    console.log('\n⚠️  Setup is mostly correct, but some items need attention.');
  } else {
    console.log('\n❌ Please fix the errors above before proceeding.');
  }
}

// Run verification
verifyFirebaseSetup().catch(console.error);

