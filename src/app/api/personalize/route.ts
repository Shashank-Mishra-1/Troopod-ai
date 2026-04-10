import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import axios from 'axios';

// Initialize Groq Client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { adCreative, landingUrl } = await req.json();

    if (!adCreative || !landingUrl) {
      return NextResponse.json({ error: 'Missing adCreative or landingUrl' }, { status: 400 });
    }

    // Step 1: Scrape the original landing page using axios (handles SSL, redirects, etc.)
    let htmlBuffer: string;
    try {
      const axiosResponse = await axios.get(landingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
        maxRedirects: 5,
        responseType: 'text',
      });
      htmlBuffer = axiosResponse.data;
    } catch (e: any) {
      return NextResponse.json({ error: 'Failed to access the provided URL: ' + (e.message || 'Unknown error') }, { status: 400 });
    }

    const $ = cheerio.load(htmlBuffer);

    // Inject a <base> tag so relative CSS/Images resolve to the original domain
    if ($('head').length === 0) {
      $('html').prepend('<head></head>');
    }
    $('head').prepend(`<base href="${landingUrl}">`);

    // Remove strict SRI and CORS attributes to allow local iframe rendering
    $('script, link').removeAttr('integrity').removeAttr('crossorigin');
    // Step 2: Extract meaningful text nodes. We assign custom IDs to track them.
    const textNodes: { tempId: string; tag: string; originalText: string }[] = [];
    let counter = 0;

    // Target mostly headings, paragraphs, and buttons for copy personalization.
    $('h1, h2, h3, h4, p, a, button').each((i, el) => {
      const text = $(el).text().trim();
      // Skip empty or very short strings like icons
      if (text.length > 5 && text.split(' ').length > 1) {
        const tempId = `troo-node-${counter++}`;
        $(el).attr('data-troo-id', tempId);
        textNodes.push({
          tempId,
          tag: el.tagName,
          originalText: text
        });
      }
    });

    // If page has too many text nodes, slice to top 30 to respect prompt limits 
    // and demonstration scope.
    const sliceNodes = textNodes.slice(0, 30);

    // Save the original parsed HTML structure for reference
    const originalHtml = $.html();

    // Step 3: Prompt the LLM
    const aiPrompt = `
      You are an expert Ad Copywriter and Landing Page Conversion Specialist.
      You are given a list of text nodes extracted from a landing page, along with the source Ad Creative.
      
      Ad Creative / Context: "${adCreative}"
      
      Your goal is to personalize the landing page text to perfectly align with the Ad Creative. 
      Rules:
      1. ONLY modify text if the Ad Creative dictates a different tone, offer, or angle.
      2. Keep the length of the new text roughly similar to the original text to avoid breaking UI.
      3. DO NOT output conversational text, strictly output a JSON object.
      4. The JSON must have the format: { "tempId": "new modified string" }
      5. Include ONLY the tempIds that you have chosen to modify. If a text string needs no modification, omit it.
      
      Nodes to analyze:
      ${JSON.stringify(sliceNodes, null, 2)}
    `;

    // Step 4: Call Groq (llama-3.3-70b-versatile)
    const groqResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert Ad Copywriter and Landing Page Conversion Specialist. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: aiPrompt
        }
      ],
    });

    const aiText = groqResponse.choices[0]?.message?.content;

    if (!aiText) {
      throw new Error("Failed to generate AI content.");
    }

    let modifiedMap: Record<string, string> = {};
    try {
      modifiedMap = JSON.parse(aiText) as any;
    } catch {
       const jsonMatch = aiText.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         modifiedMap = JSON.parse(jsonMatch[0]);
       } else {
         modifiedMap = JSON.parse(aiText);
       }
    }

    // Step 5: Patch the modified text back into the DOM
    for (const [tempId, newText] of Object.entries(modifiedMap)) {
      if (typeof newText === 'string') {
        $(`[data-troo-id="${tempId}"]`).text(newText);
      }
    }

    // Remove the temporary markers before sending to client
    $('[data-troo-id]').removeAttr('data-troo-id');

    const personalizedHtml = $.html();

    // Step 6: Return both original and personalized
    return NextResponse.json({
      originalHtml,
      personalizedHtml
    });

  } catch (error: any) {
    console.error('Personalization Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
