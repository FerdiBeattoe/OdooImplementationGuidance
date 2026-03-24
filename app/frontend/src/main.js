import { renderApp } from "./app.js";

/**
 * Frontend HTTPS Enforcement
 * Blocks non-HTTPS connections in production (except localhost)
 */
function enforceHttps() {
  const isHttps = window.location.protocol === "https:";
  const isLocalhost = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1";
  
  if (!isHttps && !isLocalhost) {
    document.body.innerHTML = `
      <div style="
        max-width: 600px;
        margin: 50px auto;
        padding: 40px;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        background: #fef2f2;
        border: 2px solid #ef4444;
        border-radius: 8px;
      ">
        <h1 style="color: #dc2626; margin-bottom: 20px;">🔒 HTTPS Required</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          This application requires a secure HTTPS connection.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Current: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${window.location.href}</code>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          Please access this application over HTTPS or contact your administrator.
        </p>
      </div>
    `;
    return false;
  }
  
  return true;
}

if (!enforceHttps()) {
  throw new Error("HTTPS enforcement: Non-HTTPS connection blocked");
}

const root = document.querySelector("#app");

renderApp(root);
