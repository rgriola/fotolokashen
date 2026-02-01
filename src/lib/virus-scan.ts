/**
 * Virus Scanning Service
 * Uses ClamAV to scan uploaded files for viruses and malware
 * 
 * IMPORTANT: ClamAV daemon must be running
 * - Development: Install locally with `brew install clamav` (macOS) or `apt install clamav-daemon` (Linux)
 * - Production: Configure ClamAV host/port via environment variables
 */

import NodeClam from 'clamscan';
import { Readable } from 'stream';

let clamScan: NodeClam | null = null;
let initializationAttempted = false;
let initializationFailed = false;

/**
 * Get or initialize ClamAV scanner instance
 * Lazy-loads and caches the scanner
 */
async function getClamScan(): Promise<NodeClam | null> {
  // Return cached instance if available
  if (clamScan) {
    return clamScan;
  }

  // Don't retry if previous initialization failed
  if (initializationFailed) {
    return null;
  }

  // Only attempt initialization once
  if (initializationAttempted) {
    return null;
  }

  initializationAttempted = true;

  try {
    // Check if virus scanning is disabled via environment variable
    if (process.env.DISABLE_VIRUS_SCAN === 'true') {
      console.warn('⚠️ Virus scanning is DISABLED via DISABLE_VIRUS_SCAN environment variable');
      initializationFailed = true;
      return null;
    }

    console.log('🔍 Initializing ClamAV scanner...');
    
    clamScan = await new NodeClam().init({
      clamdscan: {
        host: process.env.CLAMAV_HOST || 'localhost',
        port: parseInt(process.env.CLAMAV_PORT || '3310'),
        timeout: 60000, // 60 seconds
      },
      preference: 'clamdscan', // Use daemon (faster than clamscan binary)
    });

    console.log('✅ ClamAV scanner initialized successfully');
    return clamScan;
  } catch (error) {
    console.error('❌ Failed to initialize ClamAV scanner:', error);
    console.error('⚠️ Virus scanning will be DISABLED for this session');
    console.error('   To fix: Ensure ClamAV daemon is running on', process.env.CLAMAV_HOST || 'localhost', ':', process.env.CLAMAV_PORT || '3310');
    initializationFailed = true;
    return null;
  }
}

/**
 * Scan a file buffer for viruses and malware
 * 
 * @param buffer - File buffer to scan
 * @param filename - Original filename (for logging)
 * @returns Scan result with infection status
 * 
 * @example
 * const result = await scanFile(buffer, 'avatar.jpg');
 * if (result.isInfected) {
 *   throw new Error('File contains malware');
 * }
 */
export async function scanFile(
  buffer: Buffer,
  filename: string = 'unknown'
): Promise<{
  isInfected: boolean;
  viruses?: string[];
  error?: string;
  scannerAvailable: boolean;
}> {
  try {
    const clam = await getClamScan();

    // If ClamAV is not available, decide how to handle
    if (!clam) {
      const failClosed = process.env.VIRUS_SCAN_FAIL_CLOSED === 'true';
      
      if (failClosed) {
        // Fail closed: Reject uploads if scanner is unavailable (most secure)
        console.error(`🚫 [Virus Scan] REJECTED ${filename} - Scanner unavailable (fail-closed mode)`);
        return {
          isInfected: true,
          error: 'Security scanning service unavailable',
          scannerAvailable: false,
        };
      } else {
        // Fail open: Allow uploads if scanner is unavailable (less secure, better UX)
        console.warn(`⚠️ [Virus Scan] ALLOWED ${filename} - Scanner unavailable (fail-open mode)`);
        return {
          isInfected: false,
          scannerAvailable: false,
        };
      }
    }

    // Perform virus scan
    console.log(`🔍 [Virus Scan] Scanning ${filename} (${(buffer.length / 1024).toFixed(2)} KB)...`);
    
    // Convert buffer to readable stream for clamscan
    const stream = Readable.from(buffer);
    const { isInfected, viruses } = await clam.scanStream(stream);

    if (isInfected) {
      console.error(`🚨 [Virus Scan] INFECTED: ${filename} - Viruses: ${viruses?.join(', ')}`);
      return {
        isInfected: true,
        viruses,
        scannerAvailable: true,
      };
    }

    console.log(`✅ [Virus Scan] CLEAN: ${filename}`);
    return {
      isInfected: false,
      scannerAvailable: true,
    };
  } catch (error) {
    console.error(`❌ [Virus Scan] ERROR scanning ${filename}:`, error);

    const failClosed = process.env.VIRUS_SCAN_FAIL_CLOSED === 'true';

    if (failClosed) {
      // Fail closed: Reject if scanning fails
      return {
        isInfected: true,
        error: error instanceof Error ? error.message : 'Scan failed',
        scannerAvailable: false,
      };
    } else {
      // Fail open: Allow if scanning fails
      console.warn(`⚠️ [Virus Scan] ALLOWED ${filename} despite scan error (fail-open mode)`);
      return {
        isInfected: false,
        error: error instanceof Error ? error.message : 'Scan failed',
        scannerAvailable: false,
      };
    }
  }
}

/**
 * Check if virus scanning is enabled and available
 */
export async function isVirusScanningAvailable(): Promise<boolean> {
  const clam = await getClamScan();
  return clam !== null;
}

/**
 * Get virus scanner status and configuration
 */
export async function getVirusScannerStatus(): Promise<{
  available: boolean;
  host: string;
  port: number;
  failClosed: boolean;
  disabled: boolean;
}> {
  const clam = await getClamScan();
  
  return {
    available: clam !== null,
    host: process.env.CLAMAV_HOST || 'localhost',
    port: parseInt(process.env.CLAMAV_PORT || '3310'),
    failClosed: process.env.VIRUS_SCAN_FAIL_CLOSED === 'true',
    disabled: process.env.DISABLE_VIRUS_SCAN === 'true',
  };
}
