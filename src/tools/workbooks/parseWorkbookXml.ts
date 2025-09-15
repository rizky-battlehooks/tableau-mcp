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
 * Parse a Tableau workbook XML file and extract calculated fields
 * 
 * @param xmlContent The XML content of the TWB file
 * @returns Array of calculated fields with their formulas
 */
export function parseWorkbookXml(xmlContent: string): CalculatedField[] {
  const calculatedFields: CalculatedField[] = [];
  
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
        
        // Check if this is a tableau calculation
        if (calculation.getAttribute('class') === 'tableau') {
          const formula = calculation.getAttribute('formula');
          
          if (formula) {
            const calculatedField: CalculatedField = {
              name: column.getAttribute('name') || '',
              caption: column.getAttribute('caption'),
              datatype: column.getAttribute('datatype'),
              role: column.getAttribute('role'),
              type: column.getAttribute('type'),
              formula: formula
            };
            
            calculatedFields.push(calculatedField);
          }
        }
      }
    }
    
    return calculatedFields;
  } catch (error) {
    console.error('Error parsing workbook XML:', error);
    return [];
  }
}
