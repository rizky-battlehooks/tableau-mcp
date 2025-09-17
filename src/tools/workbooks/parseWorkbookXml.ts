import { DOMParser } from 'xmldom';

/**
 * Interface for a calculated field extracted from a TWB file
 */
export interface CalculatedField {
  name: string;
  caption: string | null;
  datatype: string | null;
  role: string | null;
  type: string | null;
  formula: string;
}

/**
 * Parse a Tableau workbook XML file and extract calculated fields with deduplication
 * 
 * @param xmlContent The XML content of the TWB file
 * @returns Array of deduplicated calculated fields with their formulas
 */
export function parseWorkbookXml(xmlContent: string): CalculatedField[] {
  const calculatedFieldsMap = new Map<string, CalculatedField>();
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Find all column elements that have a calculation child
    const columnElements = doc.getElementsByTagName('column');
    
    for (let i = 0; i < columnElements.length; i++) {
      const column = columnElements[i];
      const calculationElements = column.getElementsByTagName('calculation');
      
      if (calculationElements.length > 0) {
        const calculation = calculationElements[0];
        
        // Check if this is a tableau calculation (skip parameters with simple values)
        if (calculation.getAttribute('class') === 'tableau') {
          const formula = calculation.getAttribute('formula');
          const name = column.getAttribute('name') || '';
          
          if (formula && name) {
            // Skip simple parameter values (like '0', '"quarter"', etc.)
            const trimmedFormula = formula.trim();
            if (isSimpleParameterValue(trimmedFormula)) {
              continue;
            }
            
            // Create deduplication key using name + caption (if available)
            const caption = column.getAttribute('caption');
            const dedupeKey = caption ? `${name}|${caption}` : name;
            
            // Only add if we haven't seen this exact field before
            if (!calculatedFieldsMap.has(dedupeKey)) {
              const calculatedField: CalculatedField = {
                name: name,
                caption: caption,
                datatype: column.getAttribute('datatype'),
                role: column.getAttribute('role'),
                type: column.getAttribute('type'),
                formula: formula
              };
              
              calculatedFieldsMap.set(dedupeKey, calculatedField);
            }
          }
        }
      }
    }
    
    return Array.from(calculatedFieldsMap.values());
  } catch (error) {
    console.error('Error parsing workbook XML:', error);
    return [];
  }
}

/**
 * Check if a formula is just a simple parameter value (not a real calculation)
 */
function isSimpleParameterValue(formula: string): boolean {
  // Skip simple values like numbers, quoted strings, dates
  const simplePatterns = [
    /^-?\d+(\.\d+)?$/, // Plain numbers like '0', '0.2', '2'
    /^"[^"]*"$/, // Simple quoted strings like '"quarter"', '"All"'
    /^#\d{4}-\d{2}-\d{2}#$/, // Date literals like '#2025-07-30#'
    /^'[^']*'$/, // Single quoted strings
  ];
  
  return simplePatterns.some(pattern => pattern.test(formula));
}
