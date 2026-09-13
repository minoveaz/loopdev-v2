import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "scripts", "smoke-routes.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const routes = readFileSync(join(root, "src", "routes", "AppRoutes.tsx"), "utf8");
const errors = [];
for (const surface of ["desktop_web", "mobile_web"]) {
  if (!manifest[surface]?.routes?.length) errors.push(`${surface} requires routes`);
  for (const route of manifest[surface]?.routes ?? []) {
    if (!route.path.startsWith("/")) errors.push(`${surface}: route must be absolute: ${route.path}`);
    if (surface === "desktop_web" && !routes.includes(route.path)) errors.push(`${surface}: ${route.path} is not registered in AppRoutes`);
  }
  for (const check of manifest[surface]?.checks ?? []) {
    if (!["route", "refresh", "navigation", "filter-reset", "form", "action"].includes(check.kind)) errors.push(`${surface}: unsupported smoke check "${check.kind}"`);
    if (!check.evidence) errors.push(`${surface}: ${check.kind} requires deterministic evidence`);
  }
}
if (!existsSync(join(root, "apps", "mobile", "package.json"))) errors.push("mobile_web: apps/mobile/package.json is missing");
if (errors.length) {
  console.error(`Route smoke validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Route smoke validation passed: ${manifest.desktop_web.routes.length} desktop and ${manifest.mobile_web.routes.length} mobile route(s); runtime checks are marked in the manifest.`);
}
