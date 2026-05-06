#!/usr/bin/env node
/** Pull <style> and bottom <script> from Japan2026-Guide.html into TravelPWA theme files. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML = path.join(ROOT, "..", "Japan2026-Guide.html");
const cssOut = path.join(ROOT, "src/themes/japan-2026.css");
const jsOut = path.join(ROOT, "src/themes/japan-app.js");

const html = fs.readFileSync(HTML, "utf8");

const cssM = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssM) throw new Error("No style block");

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (!scripts.length) throw new Error("No scripts");

/** Last inline script usually before </body>. */
const lastScript = scripts[scripts.length - 1][1];

fs.mkdirSync(path.dirname(cssOut), { recursive: true });
fs.writeFileSync(cssOut, cssM[1].trim() + "\n", "utf8");
fs.writeFileSync(jsOut, lastScript.trim() + "\n", "utf8");
console.log("Wrote:", path.relative(process.cwd(), cssOut), jsOut.slice(-60));
