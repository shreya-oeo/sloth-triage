#!/usr/bin/env bun
// sloth-triage: let a local open-weight model decide what is actually worth doing.
import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith("-")) ?? "tasks.txt";
const top = Number(args.find((arg) => arg.startsWith("--top="))?.split("=")[1] ?? 3);
const model = process.env.SLOTH_MODEL ?? "gemma3:1b";
const baseUrl = (process.env.SLOTH_BASE_URL ?? "http://127.0.0.1:11434/v1").replace(/\/$/, "");

const raw = await readFile(file, "utf8").catch(() => {
  console.error(`Could not read ${file}. Pass a tasks file: bun run index.js tasks.txt`);
  process.exit(1);
});

const tasks = raw
  .split("\n")
  .map((line) => line.replace(/^\s*[-*]\s*(\[[ xX]\]\s*)?/, "").trim())
  .filter(Boolean);

if (!tasks.length) {
  console.error(`${file} has no tasks. Even a sloth needs a starting point.`);
  process.exit(1);
}

const prompt = `You are a very lazy but sensible assistant. Below is the user's task list.

Pick the ${top} tasks that genuinely deserve attention today. Prefer deadlines and things
that get worse if ignored. Then write a short "lazy plan": order the tasks, one line each,
and say what can be deliberately skipped or deferred. Be calm and brief. No markdown tables.

Tasks:
${tasks.map((task) => `- ${task}`).join("\n")}`;

let res;
try {
  res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });
} catch {
  console.error(
    `Could not reach an OpenAI-compatible server at ${baseUrl}.\n` +
      `Start Ollama (ollama serve) and pull a small open-weight model:\n` +
      `  ollama pull gemma3:1b\n` +
      `Then run: SLOTH_MODEL=gemma3:1b bun run index.js tasks.txt`,
  );
  process.exit(1);
}

if (!res.ok) {
  console.error(`The model server answered ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const answer = data.choices?.[0]?.message?.content?.trim();

if (!answer) {
  console.error("The model returned nothing. Try again, or pick another model.");
  process.exit(1);
}

console.log(`\n🦥 sloth-triage (${model}) read ${tasks.length} tasks and chose ${top}\n`);
console.log(answer);
console.log("\nThat is enough for one day.\n");
