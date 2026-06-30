// Compatibility entry for devices whose old app shell still references app.js.
const fitnessTargetLinkScript = document.createElement("script");
fitnessTargetLinkScript.src = "fitness-target-link.js";
fitnessTargetLinkScript.async = false;
document.head.appendChild(fitnessTargetLinkScript);

const currentDashboardScript = document.createElement("script");
currentDashboardScript.src = "dashboard.js";
currentDashboardScript.async = false;
document.head.appendChild(currentDashboardScript);
