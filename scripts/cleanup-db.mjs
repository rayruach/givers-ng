import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`DELETE FROM claims;`;
  await sql`DELETE FROM gifts;`;
  await sql`DELETE FROM wishes;`;
  await sql`DELETE FROM thank_notes;`;
  // Reset sequences
  await sql`ALTER SEQUENCE gifts_id_seq RESTART WITH 1;`;
  await sql`ALTER SEQUENCE claims_id_seq RESTART WITH 1;`;
  await sql`ALTER SEQUENCE wishes_id_seq RESTART WITH 1;`;
  await sql`ALTER SEQUENCE thank_notes_id_seq RESTART WITH 1;`;
  console.log("All tables cleared and sequences reset.");
}

main().catch(console.error);
