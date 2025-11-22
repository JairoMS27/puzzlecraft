import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePuzzleImage = async (prompt: string): Promise<string> => {
  try {
    // Use the recommended model for image generation: gemini-2.5-flash-image
    // As per guidelines, we use generateContent for this model.
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
        },
      },
    });

    let base64String;
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64String = part.inlineData.data;
                break;
            }
        }
    }

    if (!base64String) {
      throw new Error("No image generated");
    }

    return `data:image/jpeg;base64,${base64String}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};