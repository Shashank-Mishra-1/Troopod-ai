# AI PM Assignment - Troopod

## Working Flow

The system acts as a smart personalization bridge between an ad creative (source of intent, tone, imagery) and a static landing page (destination). The flow is broken down into four steps:

1. **Input Phase**: User inputs an Ad Creative context (URL or descriptive text) and a target Landing Page URL.
2. **Analysis (Agent 1)**: The Ad Creative is passed to an analysis prompt that extracts the key selling points, tone formatting, and specific visual or semantic constraints.
3. **Extraction & Routing**: A scraper reads the target URL's HTML structure. To prevent the LLM from hallucinating entirely new websites, we parse the raw HTML to extract the text nodes (Headers, Paragraphs, Call to Actions) while preserving their structural IDs and classes.
4. **Personalization (Agent 2)**: The Landing Page Personalizer Agent evaluates the extracted text alongside the Ad Analysis. It rewrites the page copy to align with the ad creative's tone while adhering to length constraints of the original containers.
5. **Reassembly & Output**: The modified copy is injected back into the original HTML structure and rendered to the user as the final personalized landing page.

---

## Key Components / Agent Design

Our system orchestrates a dual-agent workflow powered by Gemini (or any configurable LLM):
- **Ad Analyzer Agent**: Focused heavily on reading the input ad to find "hooks". If an ad promises "50% off for students," this Agent extracts this as an immutable fact to enforce later.
- **Copywriter Agent**: This agent receives the original landing page text and the analyzer's output. It operates under strict system instructions: "Rewrite the copy to match the tone of the context. Maintain original text length where possible. Do not invent features."
- **DOM Parser Middleware**: Essential for maintaining structural integrity. By separating the DOM from the Text content before sending it to the LLM, we save tokens and drastically reduce structural breakage.

> **On-Premise / Local LLM Integration**: Note that while this assignment uses a managed API (Gemini) for ease of demonstration, the exact same agent logic can be deployed on-premises. I have previously built a similar personalized page flow. If privacy or latency are concerns or you need self-hosting, an open-weight model like Llama 3 (e.g., via vLLM or Ollama) can seamlessly replace the managed API calls. The architecture and parser remain identical; only the inference endpoint changes in the backend.

---

## Error Handling & Edge Cases

### Random Changes & Inconsistent Outputs
LLMs naturally suffer from inconsistent variations per request due to high temperatures.
**Solution**: We enforce a `temperature: 0.1` constraint (highly deterministic) for the Copywriter Agent. We also structure the agent responses into strict JSON formats mapping an element's ID to its new text, preventing the LLM from outputting conversational filler.

### Broken UI
Prompting an LLM to "rewrite this HTML" typically results in broken divs, mismatched tags, and a ruined UI.
**Solution**: We do not ask the LLM to write HTML. Instead, we extract only the text arrays (`["Welcome to our site", "Buy now"]`) and ask the LLM to return a corresponding array of equal size (`["50% Student Discount", "Claim Discount"]`). The Next.js API route cleanly patches the text back into the React components or HTML string.

### Hallucinations
A classic error is the LLM inventing features (e.g., "Free Shipping") just because it sounds persuasive.
**Solution**: The Ad Analyzer Agent categorizes facts into a "Strict Guidelines" object. The Copywriter Agent's prompt is heavily grounded with: "Do not add any benefits, claims, or discounts that are not explicitly present in the Ad Guidelines." Furthermore, restricting the rewrite to just structural swap-ins leaves less room for the LLM to invent long paragraphs of irrelevant narrative.
