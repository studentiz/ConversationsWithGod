# Export a dialogue for another model

The two voices are written by you. In exports, the seeker becomes `user` and the voice of inner wisdom becomes `assistant`. Choose **Save a copy… → Backup** to preserve the exact individual messages, timestamps, names and order. Fading affects the display only.

Opening **Save a copy…** starts with readable text. You can save immediately, or change **Save for** to a backup, AI continuation, fine-tuning, or another format. Only the fields for that use appear. Additional model instructions and training context are under **Options**; model instructions are off by default. These operations generate files locally and never call a model or upload a conversation.

## Continue a conversation

| Export | Request body | Where it fits |
| --- | --- | --- |
| Messages history | `messages` with `role` and `content` | SDKs and local models; choose your own chat template |
| OpenAI-compatible Chat Completions | `model`, `messages` | Compatible OpenAI, DeepSeek, Qwen and local endpoints |
| OpenAI Responses | `model`, `input`, optional `instructions` | Responses API |
| Anthropic Messages | `model`, `max_tokens`, `messages`, optional top-level `system` | Messages API |
| Gemini generateContent | `contents` with `parts`, optional `systemInstruction` | Model chosen in the request URL |

Enter the model ID your provider supplies. If the dialogue already ends with an answer, enter your next question in the export dialog. That question is added to the exported request only. Supply endpoint, authentication and provider-specific settings in your own caller. The Anthropic starter output limit is 2048 tokens; adjust it in your caller.

For example, in Python, an exported compatible request body can be used with a configured client:

```python
import json
from openai import OpenAI

client = OpenAI()  # reads credentials from your environment
with open("request.json", encoding="utf-8") as file:
    request = json.load(file)
response = client.chat.completions.create(**request)
print(response.choices[0].message.content)
```

Adjacent messages from the same role, which can occur after deleting a turn, are joined with a blank line. Their text remains intact. Exports that require a user-first dialogue report an assistant-first history instead of silently removing it; use the complete backup or messages history to retain that history as-is.

## Fine-tune

Choose **Fine-tuning a model**, then your training tool. The file is a JSONL dataset. Each line ends at an answered assistant turn. The context setting limits previous **exchanges**, not tokens; use the chosen model's tokenizer to check the final examples. Incomplete final questions are retained in backups and continuation history, and excluded from training examples. An assistant-only opening is excluded with a visible explanation.

- **OpenAI supervised fine-tuning:** messages JSONL. The newest assistant answer has `weight: 1`; earlier answers in the same window have `weight: 0`, preventing those context answers from becoming repeated loss targets. OpenAI currently requires at least 10 examples; the dialog reports smaller datasets. Review your examples before combining conversations and uploading.
- **Hugging Face / TRL:** messages JSONL without provider-specific weights. Select assistant loss masking in your trainer. With zero previous exchanges, each answered pair occurs once; with overlapping context, your trainer determines which earlier answers contribute to loss.
- **ShareGPT:** `conversations` JSONL with `from` / `value`, for training tools accepting this schema. Configure the tool's dataset mapping and chat template.

Human/Assistant text, Llama 2 INST, whole-conversation ShareGPT JSON and Alpaca JSON remain available under **Other formats**. Use the current model's own template for newer Llama and Qwen models. Alpaca exports answered pairs without prior dialogue context; it is not a complete backup.

Sources checked on 2026-10-11: [OpenAI SFT](https://developers.openai.com/api/docs/guides/supervised-fine-tuning), [OpenAI loss weights](https://developers.openai.com/api/docs/guides/fine-tuning-best-practices), [Responses input](https://developers.openai.com/api/reference/resources/responses/methods/create), [Anthropic Messages](https://platform.claude.com/docs/en/api/messages/create), [Gemini generateContent](https://ai.google.dev/api/generate-content), [TRL datasets and loss configuration](https://huggingface.co/docs/trl/sft_trainer). Automated tests validate emitted data and edge cases; they do not perform paid API calls or actual model training.
