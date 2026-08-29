import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Cleans and renders text by converting markdown bold/italic tags to clean HTML
 * and removing raw asterisks (*, **), LaTeX dollar signs ($), and hash headers (#).
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ text, className }) => {
  if (!text) return null;

  // 1. Clean out dollar signs ($x=2$ -> x=2 or standalone $)
  let cleaned = text
    .replace(/\$\$([^\$]+)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\$/g, '');

  // 2. Clean out hash headers at start of lines
  cleaned = cleaned.replace(/^#+\s+/gm, '');

  // 3. Clean out code ticks
  cleaned = cleaned.replace(/`/g, '');

  // Split by **bold** or *italic* patterns
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        // Remove any remaining loose asterisks
        const cleanPart = part.replace(/\*/g, '');
        return <React.Fragment key={index}>{cleanPart}</React.Fragment>;
      })}
    </span>
  );
};

/**
 * Helper function to return a clean string stripped of all formatting symbols.
 */
export function cleanString(str: string): string {
  if (!str) return '';
  return str
    .replace(/\$\$([^\$]+)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\$/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*/g, '')
    .replace(/^#+\s+/gm, '')
    .replace(/`/g, '');
}
