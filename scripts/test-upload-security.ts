/**
 * Security Upload Test Script
 * Tests the unified upload security pipeline components
 */

import { scanFile } from '../src/lib/virus-scan';
import { FILE_SIZE_LIMITS, IMAGE_COMPRESSION_TARGETS } from '../src/lib/constants/upload';

async function runTests() {
  console.log('\n=== UNIFIED UPLOAD SECURITY TESTS ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Verify FILE_SIZE_LIMITS constants
  console.log('Test 1: FILE_SIZE_LIMITS constants');
  try {
    if (FILE_SIZE_LIMITS.UPLOAD_MAX === 10 &&
        FILE_SIZE_LIMITS.PHOTO === 10 &&
        FILE_SIZE_LIMITS.AVATAR === 5 &&
        FILE_SIZE_LIMITS.BANNER === 10) {
      console.log('  ✅ PASSED - All file size limits correctly defined');
      passed++;
    } else {
      console.log('  ❌ FAILED - File size limits incorrect');
      console.log('  Expected: UPLOAD_MAX=10, PHOTO=10, AVATAR=5, BANNER=10');
      console.log('  Got:', FILE_SIZE_LIMITS);
      failed++;
    }
  } catch (e) {
    console.log('  ❌ FAILED - Error:', e);
    failed++;
  }
  
  // Test 2: Verify IMAGE_COMPRESSION_TARGETS constants
  console.log('\nTest 2: IMAGE_COMPRESSION_TARGETS constants');
  try {
    if (IMAGE_COMPRESSION_TARGETS.LOCATION_PHOTO === 2 &&
        IMAGE_COMPRESSION_TARGETS.AVATAR === 1 &&
        IMAGE_COMPRESSION_TARGETS.BANNER === 2) {
      console.log('  ✅ PASSED - All compression targets correctly defined');
      passed++;
    } else {
      console.log('  ❌ FAILED - Compression targets incorrect');
      failed++;
    }
  } catch (e) {
    console.log('  ❌ FAILED - Error:', e);
    failed++;
  }
  
  // Test 3: Virus scan with clean file
  console.log('\nTest 3: Virus scan with clean file');
  try {
    const cleanBuffer = Buffer.from('This is a clean test file content for testing purposes');
    const result = await scanFile(cleanBuffer, 'test-clean.txt');
    
    if (result.scannerAvailable) {
      if (result.isInfected === false) {
        console.log('  ✅ PASSED - Clean file accepted by virus scanner');
        passed++;
      } else {
        console.log('  ❌ FAILED - Clean file incorrectly flagged as infected');
        failed++;
      }
    } else {
      console.log('  ⚠️ SKIPPED - ClamAV scanner not available');
      console.log('  (This is OK for local dev without ClamAV running)');
    }
  } catch (e) {
    console.log('  ❌ FAILED - Error:', e);
    failed++;
  }
  
  // Test 4: Virus scan with EICAR test file (standard test pattern)
  console.log('\nTest 4: Virus scan with EICAR test pattern');
  try {
    // EICAR test string - standard virus test pattern recognized by all AV software
    const eicarTestString = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const eicarBuffer = Buffer.from(eicarTestString);
    const result = await scanFile(eicarBuffer, 'eicar-test.com');
    
    if (result.scannerAvailable) {
      if (result.isInfected === true) {
        console.log('  ✅ PASSED - EICAR test pattern correctly detected as threat');
        console.log('  Detected viruses:', result.viruses);
        passed++;
      } else {
        console.log('  ❌ FAILED - EICAR test pattern not detected');
        failed++;
      }
    } else {
      console.log('  ⚠️ SKIPPED - ClamAV scanner not available');
    }
  } catch (e) {
    console.log('  ❌ FAILED - Error:', e);
    failed++;
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
