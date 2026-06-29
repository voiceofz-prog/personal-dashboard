// Compatibility entry for devices whose old app shell still references app.js.
const currentDashboardScript = document.createElement("script");
currentDashboardScript.src = "dashboard.js";
currentDashboardScript.defer = true;
document.head.appendChild(currentDashboardScript);
