# AI PM Assignment — Troopod
### Author: Shashank Mishra

---

## Working Flow

The system is a smart personalization bridge between an **ad creative** (source of intent, tone, and offer) and a **static landing page** (the conversion destination). The goal is to eliminate the tone mismatch that kills ad conversion rates.

The flow runs in five sequential steps:

1. **Input Phase** — The user provides an Ad Creative context (text description of the ad offer/tone) and a target Landing Page URL.
2. **Scraping & Extraction** — A backend scraper (Axios) fetches the target page's HTML. A DOM parser (Cheerio) then walks the HTML tree and extracts only *text nodes* (headings, paragraphs, buttons, links) — assigning each a temporary internal ID. The HTML structure itself is preserved untouched.
3. **Ad Analysis (Agent 1)** — The ad creative is interpreted to extract core constraints: the central offer (e.g., "30% off"), target audience, urgency signals, and tone direction. These are treated as **immutable facts** that the rewriter must honor.
4. **Copy Personalization (Agent 2)** — The extracted text nodes and ad constraints are sent together to the LLM. The LLM is instructed to return a JSON map of `{ tempId: rewritten_copy }`, modifying only the text that needs to change to align with the ad intent.
5. **Reassembly & Preview** — The modified texts are patched back into the original HTML by matching temp IDs. A `<base>` tag is injected to ensure all relative CSS, images, and JS resolve to the original domain. The result renders in a side-by-side iframe preview.

---

## Key Components / Agent Design

### DOM Parser Middleware (Cheerio)
The most critical safeguard in the system. Instead of feeding raw HTML to the LLM, we surgically extract only the **text content** and pass it as a structured JSON array. This achieves three goals simultaneously:
- Prevents the LLM from modifying HTML structure (eliminating broken UI)
- Massively reduces token consumption (only text, not markup)
- Enables deterministic patching — the LLM's JSON output maps 1:1 back to DOM nodes

### Copywriter Agent (LLM)
Powered by **Groq's LLaMA 3.3 70B Versatile** via the Groq API. Key configuration choices:
- `temperature: 0.2` — near-deterministic outputs, minimal variation between runs
- `response_format: json_object` — forces clean JSON, prevents conversational filler
- System prompt explicitly instructs: *"Do not invent features, discounts, or claims not present in the Ad Creative."*

### On-Premise / Local LLM Deployment
> I've built similar AI pipelines on-prem before — this is not theoretical.

This system is **inference-endpoint agnostic by design**. The agent logic, DOM parser, and prompt engineering are completely decoupled from the LLM provider. Swapping between cloud APIs and self-hosted models requires changing only a single endpoint URL in the backend.

For on-premise deployment, I have direct hands-on experience with:
- **Ollama** — running LLaMA 3, Mistral, and Gemma locally on single machines (Mac/Linux), ideal for low-volume internal tooling
- **vLLM** — production-grade, multi-GPU server inference with OpenAI-compatible API; drop-in replacement for the Groq call in this codebase
- **LM Studio** — rapid local prototyping, useful for validating prompt behavior before deploying to servers

The on-prem path becomes especially relevant in B2B SaaS or enterprise ad-tech contexts where scraped landing page data may contain proprietary client information that shouldn't leave the network perimeter.

---

## Error Handling & Edge Cases

### 1. Inconsistent / Random Outputs
**Problem:** High LLM temperature leads to different copy on every run — unpredictable for production use.  
**Solution:** Temperature locked to `0.2`. Combined with `response_format: json_object`, the model's output variance is extremely low. The structured output format also prevents the model from returning narrative text mixed with JSON.

### 2. Broken UI
**Problem:** Asking an LLM to "rewrite the HTML" results in malformed tags, broken divs, and missing closing elements.  
**Solution:** The LLM never touches HTML. It only receives an array of text strings and returns a corresponding JSON map. The DOM patcher then applies edits node-by-node using the temp ID system. The HTML structure cannot be corrupted because the model is architecturally prevented from modifying it.

### 3. Hallucinations
**Problem:** LLMs tend to add persuasive but fabricated claims ("Free shipping!", "Award-winning!") that don't exist in the ad.  
**Solution:** The system prompt includes a hard constraint: *"Only rewrite text to reflect the tone and offer present in the Ad Creative. Do not add, infer, or fabricate any features, discounts, or claims."* Additionally, because modifications are applied as targeted text swaps (not freeform generation), there is no opportunity for the model to inject invented paragraphs.

### 4. Subresource Integrity (SRI) / CORS Blocking
**Problem:** Many modern sites (like Bootstrap's CDN) attach `integrity` and `crossorigin` attributes to their `<link>` and `<script>` tags. When these are rendered inside a sandboxed `srcDoc` iframe on a different origin, browsers block them entirely — resulting in an unstyled page.  
**Solution:** The DOM parser strips `integrity` and `crossorigin` attributes from all assets before the HTML is sent to the client. Combined with the `<base>` tag injection, the iframe renders with full fidelity.

---

*For technical setup, deployment instructions, and the full system diagram, see [README.md](./README.md)*
