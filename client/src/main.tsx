import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global Mapbox configuration to prevent telemetry issues
declare global {
  interface Window {
    mapboxgl?: any;
  }
}

// Disable Mapbox telemetry globally to prevent ad-blocker conflicts
if (typeof window !== 'undefined') {
  // Block Mapbox events requests at the network level
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    
    // Block all Mapbox events and analytics requests
    if (url && (url.includes('events.mapbox.com') || 
        url.includes('api.mapbox.com/events') ||
        url.includes('/events/v2') ||
        url.includes('analytics') ||
        url.includes('telemetry'))) {
      return Promise.resolve(new Response('', { status: 200, statusText: 'OK' }));
    }
    
    return originalFetch.call(this, input, init);
  };
  
  window.mapboxgl = window.mapboxgl || {};
}

// Global handler for unhandled promise rejections and errors
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.toString() || '';
  
  // Suppress known non-critical errors more aggressively
  if (reason.includes('mapbox') || 
      reason.includes('featureNamespace') || 
      reason.includes('landmark-pois') ||
      reason.includes('place-labels') ||
      reason.includes('Source') ||
      reason.includes('ERR_BLOCKED_BY_CLIENT') ||
      reason.includes('analytics') ||
      reason.includes('sentry') ||
      reason.includes('stripe') ||
      reason.includes('launchdarkly') ||
      reason.includes('Content Security Policy') ||
      reason.includes('CSP') ||
      reason.includes('Failed to fetch') ||
      reason.includes('NetworkError') ||
      reason.includes('TypeError: Failed to fetch') ||
      reason.includes('events.mapbox.com') ||
      reason.includes('api.mapbox.com') ||
      // Handle empty rejection objects
      (typeof event.reason === 'object' && event.reason !== null && Object.keys(event.reason).length === 0)) {
    // Completely suppress - don't even log warnings for these
    event.preventDefault();
    return;
  }
  
  // More specific error handling for TypeError: Failed to fetch
  if (event.reason instanceof TypeError && event.reason.message === 'Failed to fetch') {
    event.preventDefault();
    return;
  }
  
  // Handle fetch errors from ad blockers or network issues
  if (event.reason instanceof Error && 
      (event.reason.message.includes('fetch') || 
       event.reason.name === 'AbortError' || 
       event.reason.name === 'NetworkError')) {
    event.preventDefault();
    return;
  }
  
  // Log critical errors for debugging but don't crash the app
  console.error('Critical unhandled rejection:', event.reason);
  event.preventDefault(); // Prevent default error handling
});

// Global error handler for CSP violations
window.addEventListener('securitypolicyviolation', (event) => {
  console.warn('CSP Violation suppressed:', event.violatedDirective, event.blockedURI);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
