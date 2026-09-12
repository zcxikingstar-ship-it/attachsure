# AttachSure

**A private, offline attachment-message consistency check before you send.**

[Try it in your browser](https://zcxikingstar-ship-it.github.io/attachsure/) · [Download a release](https://github.com/zcxikingstar-ship-it/attachsure/releases)

You paste the note you plan to send and choose the files you plan to attach. AttachSure flags practical contradictions, then makes a copy-ready attachment list for the chat or mail app you already use.

It is deliberately a companion, not an integration: it never uploads files, reads file contents, logs in, sends messages, or claims to verify delivery.

## What it checks

- The message says “attached” / “附件”, but no file is selected.
- The message explicitly names a common file (for example `invoice.pdf`), but that file is not selected.
- A selected file is zero bytes, or its name contains invisible control/directional characters.
- Advisory: selected files have duplicate names, or the message does not mention attachments.

Checks are deterministic and metadata-only. A green result means only that no listed text/metadata mismatch was found. It does **not** confirm contents, recipient, actual attachment, upload, or delivery.

## Use it

Open `index.html` directly, or visit the hosted page. Then:

1. Paste your outgoing message.
2. Select or drop the intended files.
3. Run the check, copy the generated note, then attach and send manually in WeChat, mail, or a browser chat.

No dependency install or server is needed. Modern desktop browsers are recommended.

## Verify locally

Requires Node.js 20+ for the checks:

```sh
npm run check
npm test
```

GitHub Actions runs the same checks on Node 20 and 24 across Linux, macOS, and Windows.

## Privacy and limits

The page receives only browser-provided filename, path label, and byte-size metadata. It never calls `File.text()`, `FileReader`, upload APIs, analytics, or a backend. The tool accepts up to 10,000 selected files and 1,000,000 message characters, failing explicitly beyond those limits.

## License

[MIT](LICENSE)
