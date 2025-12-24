import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { VibeMode, VIBE_CONFIGS, Attachment } from "../types";

let chatSession: Chat | null = null;
let currentVibe: VibeMode | null = null;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const initializeChat = (vibe: VibeMode): Chat => {
  if (chatSession && currentVibe === vibe) {
    return chatSession;
  }

  const model = "gemini-3-pro-preview"; 
  
  chatSession = ai.chats.create({
    model: model,
    config: {
      systemInstruction: VIBE_CONFIGS[vibe].systemInstruction,
      temperature: 0.7,
    },
    history: [
      {
        role: "user",
        parts: [{ text: "Xin chào! Tôi đã sẵn sàng viết code." }],
      },
      {
        role: "model",
        parts: [{ text: "Hệ thống đã trực tuyến. Hãy cùng xây dựng điều gì đó tuyệt vời." }],
      }
    ]
  });

  currentVibe = vibe;
  return chatSession;
};

export const sendMessageStream = async (
  message: string, 
  vibe: VibeMode,
  attachments: Attachment[],
  onChunk: (text: string) => void
): Promise<string> => {
  if (!chatSession || currentVibe !== vibe) {
    initializeChat(vibe);
  }

  if (!chatSession) throw new Error("Failed to initialize chat session");

  try {
    const parts: any[] = [];

    // Process Text Attachments (Append to prompt for better context)
    let finalPrompt = message;
    const textAttachments = attachments.filter(a => a.type === 'text');
    
    if (textAttachments.length > 0) {
      finalPrompt += "\n\n--- FILE ĐÍNH KÈM ---";
      textAttachments.forEach(att => {
        finalPrompt += `\n\nFile: ${att.fileName}\n\`\`\`\n${att.content}\n\`\`\``;
      });
    }

    // Add Image Attachments as parts
    const imageAttachments = attachments.filter(a => a.type === 'image');
    imageAttachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType || 'image/png',
          data: att.content // Expecting base64 string without data prefix
        }
      });
    });

    // Add the text part
    if (finalPrompt.trim()) {
      parts.push({ text: finalPrompt });
    }

    // Send to Gemini
    // If only text, send string. If multimodal, send array.
    const messagePayload = parts.length === 1 && parts[0].text ? parts[0].text : parts;

    const result = await chatSession.sendMessageStream({ message: messagePayload });
    
    let fullText = "";
    for await (const chunk of result) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      onChunk(fullText);
    }
    return fullText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi: Không thể kết nối với máy chủ. Vui lòng kiểm tra khóa API, file đính kèm hoặc kết nối mạng của bạn.";
  }
};