import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const results = resolve(import.meta.dirname, '..', 'results');
const rows = [];
for (const dir of await readdir(results, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  try { rows.push(JSON.parse(await readFile(resolve(results, dir.name, 'raw-results.json'), 'utf8'))); } catch {}
}
const requestedCount = Number(process.env.CHAT_REPORT_MESSAGE_COUNT || Math.max(...rows.map((row) => row.configuredMessageCount), 0));
const selected = rows.filter((row) => row.configuredMessageCount === requestedCount);
const grouped = Map.groupBy(selected, (row) => `${row.scenario}:${row.mode}`);
let report = '# Direct vs Outbox experiment\n\n|scenario|mode|runs|delivery %|lost %|duplicates|recovery ms|api p95 ms|\n|---|---:|---:|---:|---:|---:|---:|---:|\n';
for (const [key, values] of grouped) {
  const [scenario, mode] = key.split(':');
  const avg = (field) => values.reduce((sum, row) => sum + (row[field] || 0), 0) / values.length;
  report += `|${scenario}|${mode}|${values.length}|${avg('deliverySuccessRate').toFixed(4)}|${avg('lostRate').toFixed(4)}|${avg('duplicatePublishCount').toFixed(2)}|${avg('recoveryLatencyMs').toFixed(0)}|${(values.reduce((s,r)=>s+(r.apiLatencyMs?.p95||0),0)/values.length).toFixed(2)}|\n`;
}
report += `\nMessage count per run: ${requestedCount}. Total selected runs: ${selected.length}.\n`;
await writeFile(resolve(results, 'report.md'), report);
console.log(report);
