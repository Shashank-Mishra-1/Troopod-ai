# Troopod AI — Dynamic Landing Page Personalizer

> **Submitted for:** AI PM Assignment — Troopod  
> **Submitted by:** Shashank Mishra  
> **Contact:** nj@troopod.io

---

## What This Does

This is a production-ready AI workflow that takes an **ad creative context** and a **landing page URL**, scrapes and understands the page structure, and uses a large language model to rewrite the copy to perfectly align with the tone, offer, and angle of the ad — all without breaking the original page layout.

The output is a **side-by-side live preview** of the original page vs. the AI-personalized version.

---

## Live Demo

> 🔗 **[Insert Vercel URL here after deployment]**

**Try this demo input:**
- **Ad Creative:** `"Flash Sale! 30% off all plans for a limited time. Urgent, high-energy tone."`
- **URL:** `https://getbootstrap.com/`

---

## System Flow

```
User Input (Ad Creative + URL)
         │
         ▼
  ┌──────────────────┐
  │  URL Scraper     │  ← Axios-based, handles SSL, redirects, WAF
  │  (HTML Fetch)    │
  └──────────┬───────┘
             │ Raw HTML
             ▼
  ┌──────────────────────────┐
  │  DOM Parser Middleware   │  ← Cheerio: extracts text nodes only
  │  (Cheerio)               │    preserves structure, strips SRI attrs
  └──────────┬───────────────┘
             │ Text Array + Temp IDs
             ▼
  ┌──────────────────────────┐
  │  LLM Agent               │  ← Groq (LLaMA 3.3 70B) / any LLM
  │  System Prompt:          │    returns JSON: { tempId: newCopy }
  │  Copywriter + Constraint │    temperature: 0.2 for consistency
  └──────────┬───────────────┘
             │ Modified Text Map
             ▼
  ┌──────────────────────────┐
  │  DOM Patcher             │  ← Injects new text back by tempId
  │  + Base Tag Injector     │    preserves original styles/layout
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │  Preview Page            │  ← Side-by-side iframe comparison
  │  (Before / After)        │
  └──────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| HTML Scraping | Axios + Cheerio |
| LLM Inference | Groq API (LLaMA 3.3 70B Versatile) |
| Deployment | Vercel |

---

## On-Premise LLM Experience

> This isn't theory — I have previously built a similar AI pipeline and deployed it locally.

While this demo uses the **Groq API** for fast, reliable inference during the assignment deadline, the architecture is completely **LLM-agnostic by design**.

In production or privacy-sensitive environments, the same agent logic can point to a self-hosted model. I have direct experience running this category of pipeline on-premise using:

- **Ollama** — for local single-machine deployments (LLaMA 3, Mistral)
- **vLLM** — for high-throughput multi-GPU server deployments
- **LM Studio** — for rapid prototyping without cloud dependencies

The only change required is swapping the inference endpoint URL in the backend. All prompts, the DOM parser middleware, and the response patching logic remain identical. This makes the system trivially portable between managed APIs and on-prem inference servers.

---

## Documentation

📄 **Read [`explanation.md`](./explanation.md)** for a detailed breakdown of:
- Agent design decisions
- How hallucinations are prevented
- How broken UI is avoided
- How inconsistent outputs are controlled

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env.local

# 3. Start dev server
npm run dev

# Visit http://localhost:3000
```

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import into [vercel.com](https://vercel.com)
3. Add Environment Variable: `GROQ_API_KEY` = your key
4. Deploy — live in ~60 seconds
