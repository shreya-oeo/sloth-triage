# 🦥 sloth-triage

A tiny Bun CLI that hands your task list to a local open-weight model and asks it the
only question that matters: **what are the three things actually worth doing today?**

You get a short, calm plan back. Everything else is explicitly allowed to wait.

```text
$ bun run index.js tasks.txt

🦥 sloth-triage (gemma3:1b) read 9 tasks and chose 3

1. Finish the quarterly report — due tomorrow at 9am.
2. Renew the domain — it expires Friday.
3. Reply to the landlord — a leaking tap gets worse.

Skip the conference recording and the photo library. The downloads folder can wait forever.
```

## Why it is open

- The model is an **open-weight** model (Gemma, Llama, Qwen...) served by
  [Ollama](https://ollama.com) on your own machine.
- No API key, no account, no per-token bill. The whole tool is ~70 lines of JavaScript
  with zero dependencies.
- Your task list **never leaves your laptop** when you use a local model. Personal to-dos
  are exactly the kind of data that should not be shipped to a closed API.
- Swap models with one env var. The model is a setting, not a vendor.

## Run it

Requirements: [Bun](https://bun.sh) and [Ollama](https://ollama.com).

```sh
ollama pull gemma3:1b        # ~800 MB, runs on a laptop
bun run index.js tasks.txt
```

Use any other local model:

```sh
SLOTH_MODEL=qwen3:4b bun run index.js tasks.txt
```

Or an OpenAI-compatible endpoint you host yourself:

```sh
SLOTH_BASE_URL=http://localhost:1234/v1 SLOTH_MODEL=your-model bun run index.js tasks.txt
```

Options:

| Flag / env | Default | Meaning |
| --- | --- | --- |
| `tasks.txt` arg | `tasks.txt` | File with one task per line |
| `--top=N` | `3` | How many tasks to keep |
| `SLOTH_MODEL` | `gemma3:1b` | Model name on the server |
| `SLOTH_BASE_URL` | `http://127.0.0.1:11434/v1` | OpenAI-compatible base URL |

Task lines can be plain text or `- [ ]` markdown checkboxes.

## How it works

1. Reads and cleans the task list.
2. Sends one prompt to `/chat/completions`: pick the top N by deadlines and cost of
   ignoring, then write a short lazy plan.
3. Prints the answer. No database, no state, no scheduling.

## Honest limits

- It trusts your task list; it does not know your calendar.
- Small models can miss subtle priorities. That is why the prompt asks for reasons, not
  just a ranking.
- Tested with `gemma4:cloud` through Ollama; it works with any OpenAI-compatible
  server, including local ones.

## License

MIT
