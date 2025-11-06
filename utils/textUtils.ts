
/**
 * Splits a block of text into an array of sentences.
 * This regex-based approach is simple and effective for most cases.
 * It looks for common sentence terminators (. ! ?) followed by whitespace.
 * @param text The text to split.
 * @returns An array of sentences.
 */
export const splitIntoSentences = (text: string): string[] => {
  if (!text) return [];
  // This regex matches sentences, including the terminator, and handles various whitespace.
  const sentences = text.match(/[^.!?]+[.!?]*\s*|[^.!?]+$/g);
  return sentences ? sentences.map(s => s.trim()).filter(s => s.length > 0) : [];
};
