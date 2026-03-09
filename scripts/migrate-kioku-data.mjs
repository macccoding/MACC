/**
 * One-time migration: Copy nodes, links, node_recalls, messages from
 * standalone Kioku DB into Me.io DB.
 */

import pg from "pg";
const { Client } = pg;

const KIOKU_URL =
  "postgresql://neondb_owner:npg_UMqFO2vgV8Pc@ep-empty-sea-ai5sqn8w-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Read Me.io URL from .env
import { readFileSync } from "fs";
const envContent = readFileSync("/Users/mac/Prod/Me.io/.env", "utf-8");
const meIoUrl = envContent
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.replace("DATABASE_URL=", "")
  .replace(/"/g, "");

if (!meIoUrl) {
  console.error("Could not find DATABASE_URL in Me.io .env");
  process.exit(1);
}

async function migrate() {
  const source = new Client({ connectionString: KIOKU_URL });
  const target = new Client({ connectionString: meIoUrl });

  await source.connect();
  await target.connect();

  console.log("Connected to both databases.");

  // 1. Migrate nodes
  const { rows: nodes } = await source.query(`
    SELECT id, name, slug, tags, status, fields, notes, "createdAt", "updatedAt"
    FROM "Node"
  `);
  console.log(`Found ${nodes.length} nodes in Kioku.`);

  for (const n of nodes) {
    await target.query(
      `INSERT INTO "nodes" (id, name, slug, tags, status, fields, notes, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET
         tags = EXCLUDED.tags,
         fields = EXCLUDED.fields,
         notes = EXCLUDED.notes,
         "updatedAt" = EXCLUDED."updatedAt"`,
      [n.id, n.name, n.slug, n.tags, n.status, n.fields, n.notes, n.createdAt, n.updatedAt]
    );
  }
  console.log(`Migrated ${nodes.length} nodes.`);

  // 2. Migrate links
  const { rows: links } = await source.query(`
    SELECT id, "sourceNodeId", "targetNodeId", relation, "createdAt"
    FROM "Link"
  `);
  console.log(`Found ${links.length} links.`);

  for (const l of links) {
    await target.query(
      `INSERT INTO "links" (id, "sourceNodeId", "targetNodeId", relation, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $5)
       ON CONFLICT ("sourceNodeId", "targetNodeId", relation) DO NOTHING`,
      [l.id, l.sourceNodeId, l.targetNodeId, l.relation, l.createdAt]
    );
  }
  console.log(`Migrated ${links.length} links.`);

  // 3. Migrate node recalls
  const { rows: recalls } = await source.query(`
    SELECT id, "nodeId", "lastSurfaced", "surfaceCount"
    FROM "NodeRecall"
  `);
  console.log(`Found ${recalls.length} recalls.`);

  for (const r of recalls) {
    await target.query(
      `INSERT INTO "node_recalls" (id, "nodeId", "lastSurfaced", "surfaceCount")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("nodeId") DO UPDATE SET
         "lastSurfaced" = EXCLUDED."lastSurfaced",
         "surfaceCount" = EXCLUDED."surfaceCount"`,
      [r.id, r.nodeId, r.lastSurfaced, r.surfaceCount]
    );
  }
  console.log(`Migrated ${recalls.length} recalls.`);

  // 4. Migrate messages
  const { rows: messages } = await source.query(`
    SELECT id, role, content, "followUp", "createdNodes", "updatedNodes", "createdAt"
    FROM "Message"
  `);
  console.log(`Found ${messages.length} messages.`);

  for (const m of messages) {
    // Map role "brain" -> "assistant" for Me.io convention
    const role = m.role === "brain" ? "assistant" : m.role;
    await target.query(
      `INSERT INTO "messages" (id, role, content, "followUp", "createdNodes", "updatedNodes", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, role, m.content, m.followUp, m.createdNodes || [], m.updatedNodes || [], m.createdAt]
    );
  }
  console.log(`Migrated ${messages.length} messages.`);

  // 5. Migrate journal entries
  const { rows: journals } = await source.query(`
    SELECT id, date, content, "createdAt"
    FROM "Journal"
  `);
  console.log(`Found ${journals.length} journal entries.`);

  for (const j of journals) {
    await target.query(
      `INSERT INTO "journals" (id, date, content, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $4)
       ON CONFLICT (date) DO UPDATE SET
         content = EXCLUDED.content`,
      [j.id, j.date, j.content, j.createdAt]
    );
  }
  console.log(`Migrated ${journals.length} journal entries.`);

  await source.end();
  await target.end();
  console.log("\nMigration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
