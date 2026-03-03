/**
 * Decodes HTML entities in a string (e.g., &#39; -> ')
 */
export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
