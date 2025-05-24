import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY || "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const userPrompt = searchParams.get('prompt');

  if (!API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  let generationPrompt = "";
  if (mode === 'surprise') {
    const surprisePrompts = [
      "A whimsical illustration of a cat DJing a party in a mushroom forest.",
      "Photorealistic image of a coffee cup that contains a miniature galaxy.",
      "A vibrant abstract painting representing the feeling of pure joy.",
      "Concept art for a futuristic city built on clouds, with flying vehicles.",
      "A surreal portrait of a person made entirely of blooming flowers.",
      "A cozy, dimly lit library with books stacked to the ceiling and a sleeping dragon.",
      "An epic landscape of a crystal cave illuminated by glowing fungi.",
      "A detailed close-up of a fantastical insect with iridescent wings.",
      "A steampunk-inspired mechanical owl with intricate gears and glowing eyes.",
      "A serene underwater scene with colorful coral reefs and mythical sea creatures."
    ];
    generationPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
  } else if (mode === 'prompt' && userPrompt) {
    generationPrompt = userPrompt;
  } else {
    return NextResponse.json({ error: "Invalid mode or missing prompt." }, { status: 400 });
  }

  try {
    const contents = `Create an image of: ${generationPrompt} ,1024x1024 pixels.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    const response = result;

    let imageUrl = null;
    let altText = `Generated image: ${generationPrompt.substring(0, 70)}...`;

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          // console.log("Gemini text part:", part.text);
        } else if (part.inlineData && typeof part.inlineData.mimeType === 'string' && part.inlineData.mimeType.startsWith('image/')) {
          const imageData = part.inlineData.data;
          imageUrl = `data:${part.inlineData.mimeType};base64,${imageData}`;
          break;
        }
      }
    }

    if (imageUrl) {
      return NextResponse.json({ imageUrl: imageUrl, altText: altText });
    } else {
      //console.error("Gemini API did not return image data in the expected format:", response);
      if (response.candidates && response.candidates[0] && response.candidates[0].finishReason) {
        //console.error("Candidate finish reason:", response.candidates[0].finishReason);
        if(response.candidates[0].safetyRatings){
            //console.error("Safety ratings:", response.candidates[0].safetyRatings);
        }
      }
      return NextResponse.json({ error: "Failed to extract image data from Gemini response. The prompt might have been blocked or did not produce an image." }, { status: 500 });
    }

  } catch (e: any) {
    console.error("Error calling Gemini API with @google/genai:", e);
    let errorMessage = "Failed to generate image due to an internal error.";
    if (e.message) {
      errorMessage = `Gemini API Error: ${e.message}`;
    }
    
    if (e.response && e.response.promptFeedback && e.response.promptFeedback.blockReason) {
      errorMessage = `Your prompt was blocked: ${e.response.promptFeedback.blockReason}. Try a different prompt.`;
      return NextResponse.json({ error: errorMessage, blockReason: e.response.promptFeedback.blockReason }, { status: 400 });
    } else if (e.message && (e.message.includes("[400 Bad Request]") || e.message.includes("SAFETY"))) {
        errorMessage = "Your prompt may have been blocked due to safety reasons or was otherwise invalid. Please try a different prompt.";
        return NextResponse.json({ error: errorMessage, blockReason: "SAFETY_OR_INVALID_PROMPT" }, { status: 400 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 