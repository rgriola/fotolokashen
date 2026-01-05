/**
 * Browser detection utilities
 */

export function isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
}

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

export function isChromeMobile(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent;
    const isChromeUA = /CriOS|Chrome/.test(ua);
    const isMobileUA = /iPhone|iPad|iPod|Android/i.test(ua);

    return isChromeUA && isMobileUA;
}

export function isFirefox(): boolean {
    if (typeof window === 'undefined') return false;
    return /Firefox|FxiOS/.test(window.navigator.userAgent);
}

export function getBrowserName(): string {
    if (isChromeMobile()) return 'Chrome Mobile';
    if (isSafari()) return 'Safari';
    if (isChrome()) return 'Chrome';
    if (isFirefox()) return 'Firefox';
    return 'Unknown';
}

export function supportsGeolocationFallback(): boolean {
    // Safari and Firefox support geolocation, Chrome mobile does not work reliably
    return (isSafari() || isFirefox()) && !isChromeMobile();
}
