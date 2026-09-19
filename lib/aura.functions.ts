import { z } from "zod";

const bibleEntry = z.object({
  name: z.string(),
  category: z.string(),
  current_state: z.any().optional(),
  secrets_and_history: z.string().optional(),
});

const analyzeInput = z.object({
  text: z.string().max(40000).optional(),
  messages: z.array(z.any()).optional(),
  genreAndRules: z.string().optional(),
  draftExcerpt: z.string().optional(),
  previousCliffhanger: z.string().optional(),
  bible: z.array(bibleEntry).optional(),
});

// Bulletproof mock function that extracts messages across any payload shape
export async function brainstormChat(payload: any) {
  console.log("Brainstorm chat invoked locally with payload:", payload);

  // Extract messages or text safely from any nesting level
  let messages = payload?.messages || payload?.data?.messages;
  if (!messages && Array.isArray(payload)) {
    messages = payload;
  }

  let userQuery = "";
  if (Array.isArray(messages) && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    userQuery = lastMsg?.content || lastMsg?.text || "";
  } else if (payload?.text) {
    userQuery = payload.text;
  } else if (typeof payload === "string") {
    userQuery = payload;
  }

  let replyText = `Building on "${userQuery}": Introduce an unexpected constraint that forces the character to abandon their safe option entirely.`;
  
  const queryLower = userQuery.toLowerCase();
  if (queryLower.includes("letter")) {
    replyText = `Regarding the unopened letter: The silence of that envelope becomes louder than any conversation, forcing the protagonist to make a move blind.`;
  } else if (queryLower.includes("underdog") || queryLower.includes("boy")) {
    replyText = `For the underdog's rise to the highest position: Reaching the peak exposes who truly pulled the strings behind his ascent, turning sudden victory into a dangerous trap.`;
  } else if (queryLower.trim() === "") {
    replyText = `What if the core assumption your characters are relying on turns out to be entirely false?`;
  }

  return {
    success: true,
    reply: replyText,
  };
}