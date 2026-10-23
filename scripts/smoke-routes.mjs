import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "scripts", "smoke-routes.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const desktopRoutes = ["AppRoutes.tsx", "LoopdevRoutes.tsx"]
  .map((file) => readFileSync(join(root, "src", "routes", file), "utf8")).join("\n");
const mobileRoutes = readFileSync(join(root, "apps", "mobile", "App.tsx"), "utf8");
const sharedRoutes = [
  "contact-capability.ts",
  "account-navigation.ts",
]
  .map((file) => readFileSync(join(root, "packages", "contracts", "src", file), "utf8"))
  .join("\n");
const errors = [];
function matchesTemplate(template, example) {
  const pattern = template.split("/").map((segment) => segment.startsWith(":") ? "[^/]+" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("/");
  return new RegExp(`^${pattern}$`).test(example);
}
for (const surface of ["desktop_web", "mobile_web"]) {
  if (!manifest[surface]?.routes?.length) errors.push(`${surface} requires routes`);
  for (const route of manifest[surface]?.routes ?? []) {
    if (!route.path.startsWith("/")) errors.push(`${surface}: route must be absolute: ${route.path}`);
    const routeSource = surface === "desktop_web"
      ? `${desktopRoutes}\n${sharedRoutes}`
      : `${mobileRoutes}\n${sharedRoutes}`;
    if (!routeSource.includes(route.path) && !routeSource.includes(route.path.replace(/:[^/]+/g, "([^/]+)"))) errors.push(`${surface}: ${route.path} is not registered in its router`);
    if (route.path.includes(":")) {
      if (!route.example || !matchesTemplate(route.path, route.example)) errors.push(`${surface}: ${route.path} requires a matching concrete example`);
      if (route.deep_link !== true) errors.push(`${surface}: ${route.path} must declare deep_link=true`);
    }
  }
  for (const check of manifest[surface]?.checks ?? []) {
    if (!["route", "deep-link", "refresh", "navigation", "filter-reset", "form", "action"].includes(check.kind)) errors.push(`${surface}: unsupported smoke check "${check.kind}"`);
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
