import { config } from "dotenv";
import { Resend } from "resend";

config({ path: [".env.local", ".env"], quiet: true });

const to = process.argv[2];
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL;

if (!to) throw new Error("Usage: npm run email:test -- you@example.com");
if (!apiKey) throw new Error("RESEND_API_KEY is not configured in .env.local");
if (!from) throw new Error("RESEND_FROM_EMAIL is not configured in .env.local");

const { data, error } = await new Resend(apiKey).emails.send({
  from,
  to,
  subject: "Glean local email test",
  text: "If you received this, the local Resend configuration works.",
});

if (error) throw new Error(`${error.name}: ${error.message}`);

console.log(`[email:test] sent: ${data.id}`);
