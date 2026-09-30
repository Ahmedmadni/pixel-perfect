/**
 * Automated OBD-II fault-code importer.
 *
 * Pulls the public code libraries from GitHub, merges them, and upserts every
 * row into public.obd_fault_codes (code = primary key, so re-running updates
 * existing rows instead of duplicating them).
 *
 * Usage:  node scripts/import-obd-codes.mjs
 * Needs:  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in the environment.
 */

const SOURCES = [
  {
    name: "mytrile/obd-trouble-codes (P, B, C, U)",
    url: "https://raw.githubusercontent.com/mytrile/obd-trouble-codes/master/obd-trouble-codes.csv",
    type: "csv",
  },
  {
    name: "fabiovila/OBDIICodes (extended P codes)",
    url: "https://raw.githubusercontent.com/fabiovila/OBDIICodes/master/codes.json",
    type: "json",
  },
];

const BATCH_SIZE = 500;

/** "P0171/SAE" -> { code: "P0171", category: "P" }; null when not a valid DTC. */
function cleanCode(raw) {
  const code = String(raw).trim().toUpperCase().split("/")[0].split(" ")[0];
  const category = code[0];
  if (code.length >= 4 && ["P", "B", "C", "U"].includes(category)) return { code, category };
  return null;
}

/** Minimal CSV line parser for the `"CODE","DESCRIPTION"` shape used upstream. */
function parseCsv(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const match = line.match(/^"([^"]*)","(.*)"\s*$/);
    if (match) out.push([match[1], match[2].replace(/""/g, '"')]);
  }
  return out;
}

async function fetchSource(source) {
  const response = await fetch(source.url, { headers: { "User-Agent": "KMTR-CarTracker/1.0" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return source.type === "json" ? response.json() : response.text();
}

async function collect() {
  /** @type {Map<string, {code: string, description: string, category: string}>} */
  const codes = new Map();

  for (const source of SOURCES) {
    try {
      console.log(`Fetching ${source.name}...`);
      const payload = await fetchSource(source);
      let added = 0;

      if (source.type === "csv") {
        for (const [rawCode, rawDesc] of parseCsv(payload)) {
          const parsed = cleanCode(rawCode);
          const description = rawDesc.trim();
          if (!parsed || !description) continue;
          codes.set(parsed.code, { code: parsed.code, description, category: parsed.category });
          added += 1;
        }
      } else if (Array.isArray(payload)) {
        for (const item of payload) {
          const parsed = cleanCode(item.Code ?? item.code ?? "");
          const description = String(item.Description ?? item.description ?? "").trim();
          if (!parsed || !description || description.toLowerCase() === "reserved") continue;
          if (codes.has(parsed.code)) continue; // first source wins
          codes.set(parsed.code, { code: parsed.code, description, category: parsed.category });
          added += 1;
        }
      }

      console.log(`  ok - ${added} codes from this source`);
    } catch (error) {
      console.error(`  FAILED (${source.name}): ${error instanceof Error ? error.message : error}`);
    }
  }

  return [...codes.values()].sort((a, b) => a.code.localeCompare(b.code));
}

async function upsert(rows) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  let saved = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const response = await fetch(`${url}/rest/v1/obd_fault_codes?on_conflict=code`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "User-Agent": "node",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) {
      console.error(`  batch ${i / BATCH_SIZE + 1} failed: ${response.status} ${await response.text()}`);
      continue;
    }
    saved += batch.length;
  }
  return saved;
}

const rows = await collect();
console.log(`\nMerged ${rows.length} unique fault codes. Saving...`);
const saved = await upsert(rows);
console.log(`Done: ${saved}/${rows.length} codes stored.`);
