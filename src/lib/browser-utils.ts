/**
 * Browser detection utilities
 */

export function isSafari(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const safari = /Safari/.test(ua);
    const chrome = /CriOS|Chrome/.test(ua);

    // Safari on iOS: Has WebKit and Safari, but NOT Chrome
    return iOS && webkit && safari && !chrome;
}

export function isChrome(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent;
    return /CriOS|Chrome/.test(ua);
}

export function getBrowserName(): string {
    if (isSafari()) return 'Safari';
    if (isChrome()) return 'Chrome';
    return 'Unknown';
}

export function supportsGeolocationFallback(): boolean {
    // Only Safari reliably supports geolocation for photo uploads
    return isSafari();
}
