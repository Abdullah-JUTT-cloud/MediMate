/**
 * testExpiryEnforcement.js
 *
 * Diagnostic script that audits subscription expiry enforcement against the
 * live database.  Safe to run at any time — it does NOT modify any records
 * unless you pass the --fix flag explicitly.
 *
 * Usage:
 *   node scripts/testExpiryEnforcement.js          # dry-run report
 *   node scripts/testExpiryEnforcement.js --fix    # apply BLOCKED status to expired doctors
 *
 * Run via npm:
 *   cd server && npm run test:expiry
 *   cd server && npm run test:expiry -- --fix
 */

import "dotenv/config";
import mongoose from "mongoose";
import { Doctor } from "../models/doctor.model.js";
import {
  isSubscriptionExpired,
  hasFullSiteAccess,
} from "../utils/subscription.js";

const DRY_RUN = !process.argv.includes("--fix");
const now = new Date();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (date) =>
  date ? new Date(date).toLocaleString("en-PK", { timeZone: "Asia/Karachi" }) : "—";

const pad = (str, len = 28) => String(str ?? "").padEnd(len);

const statusEmoji = (status) => {
  switch (status) {
    case "TRIAL":               return "🟡";
    case "ACTIVE":
    case "MONTHLY":
    case "YEARLY":              return "🟢";
    case "PENDING_VERIFICATION":return "🔵";
    case "BLOCKED":             return "🔴";
    case "INACTIVE":            return "⚫";
    default:                    return "⬜";
  }
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const run = async () => {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  MedAlerto · Subscription Expiry Enforcement Audit");
  console.log(`  Run at : ${fmt(now)}`);
  console.log(`  Mode   : ${DRY_RUN ? "DRY-RUN (no DB writes)" : "⚠️  LIVE FIX (will write BLOCKED)"}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅  Connected to MongoDB\n");

  // ── 1. Fetch all doctors that could potentially be expiring ────────────────
  const candidates = await Doctor.find({
    subscriptionStatus: { $in: ["TRIAL", "ACTIVE", "MONTHLY", "YEARLY"] },
  }).select("_id fullName email subscriptionStatus subscriptionExpiresAt");

  console.log(`📋  Doctors with expirable statuses : ${candidates.length}\n`);

  const expired   = [];
  const active    = [];
  const noExpiry  = [];

  for (const doc of candidates) {
    if (!doc.subscriptionExpiresAt) {
      noExpiry.push(doc);
    } else if (isSubscriptionExpired(doc, now)) {
      expired.push(doc);
    } else {
      active.push(doc);
    }
  }

  // ── 2. Active / healthy subscriptions ──────────────────────────────────────
  console.log(`${statusEmoji("ACTIVE")} HEALTHY (${active.length})`);
  if (active.length) {
    console.log(`  ${"Name".padEnd(30)} ${"Status".padEnd(24)} ${"Expires At"}`);
    console.log(`  ${"─".repeat(80)}`);
    for (const d of active) {
      console.log(`  ${pad(d.fullName, 30)} ${pad(d.subscriptionStatus, 24)} ${fmt(d.subscriptionExpiresAt)}`);
    }
  }

  // ── 3. Missing expiry date ─────────────────────────────────────────────────
  console.log(`\n⬜  MISSING EXPIRY DATE (${noExpiry.length})`);
  if (noExpiry.length) {
    console.log("  These doctors have an expirable status but no subscriptionExpiresAt set.");
    for (const d of noExpiry) {
      console.log(`  ⚠️  ${d.fullName} <${d.email}> — status: ${d.subscriptionStatus}`);
    }
  }

  // ── 4. Expired — should be BLOCKED ────────────────────────────────────────
  console.log(`\n${statusEmoji("BLOCKED")} EXPIRED — SHOULD BE BLOCKED (${expired.length})`);
  if (expired.length) {
    console.log(`  ${"Name".padEnd(30)} ${"Status".padEnd(24)} ${"Expired At"}`);
    console.log(`  ${"─".repeat(80)}`);
    for (const d of expired) {
      console.log(`  ${pad(d.fullName, 30)} ${pad(d.subscriptionStatus, 24)} ${fmt(d.subscriptionExpiresAt)}`);
    }
  }

  // ── 5. Already BLOCKED / INACTIVE doctors ─────────────────────────────────
  const alreadyBlocked = await Doctor.countDocuments({
    subscriptionStatus: { $in: ["BLOCKED", "INACTIVE"] },
  });
  console.log(`\n${statusEmoji("BLOCKED")} Already BLOCKED/INACTIVE in DB : ${alreadyBlocked}`);

  // ── 6. Verify the cron job query would catch the expired doctors ───────────
  console.log("\n🔍  Simulating blockExpiredSubscriptions() query ...");
  const wouldBeBlocked = await Doctor.find({
    subscriptionStatus: { $in: ["TRIAL", "ACTIVE"] },
    subscriptionExpiresAt: { $lte: now },
  }).select("_id fullName subscriptionStatus subscriptionExpiresAt");
  console.log(`     Cron job would target : ${wouldBeBlocked.length} doctor(s)`);

  if (wouldBeBlocked.length !== expired.length) {
    console.warn(
      `\n⚠️  MISMATCH: audit found ${expired.length} expired (TRIAL/ACTIVE/MONTHLY/YEARLY), ` +
      `but cron query (TRIAL/ACTIVE only) targets ${wouldBeBlocked.length}.`,
    );
    console.warn("    Consider expanding subscriptionJob.js to include MONTHLY/YEARLY statuses.\n");
  }

  // ── 7. Apply fix if requested ──────────────────────────────────────────────
  if (!DRY_RUN) {
    if (wouldBeBlocked.length === 0) {
      console.log("\n✅  Nothing to fix — no expired doctors found by cron query.");
    } else {
      const result = await Doctor.updateMany(
        {
          subscriptionStatus: { $in: ["TRIAL", "ACTIVE", "MONTHLY", "YEARLY"] },
          subscriptionExpiresAt: { $lte: now },
        },
        { $set: { subscriptionStatus: "BLOCKED" } },
      );
      console.log(`\n✅  Blocked ${result.modifiedCount} doctor(s).`);
    }
  } else if (expired.length > 0) {
    console.log("\n💡  To apply the BLOCKED status, re-run with --fix:");
    console.log("    node scripts/testExpiryEnforcement.js --fix\n");
  }

  // ── 8. Summary ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Summary");
  console.log(`  Healthy (active subscriptions)   : ${active.length}`);
  console.log(`  Missing expiry date              : ${noExpiry.length}`);
  console.log(`  Expired (need BLOCKED)           : ${expired.length}`);
  console.log(`  Already BLOCKED / INACTIVE       : ${alreadyBlocked}`);
  console.log(`  Cron job would target            : ${wouldBeBlocked.length}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  await mongoose.connection.close();
  console.log("✅  Done — connection closed.\n");
};

run().catch(async (error) => {
  console.error("\n❌  testExpiryEnforcement failed:", error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
