import { parseWorkbookXml } from './parseWorkbookXml.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Extract a small portion of the real workbook file that contains calculated fields
const realWorkbookSnippet = `
<datasource hasconnection='false' inline='true' name='Parameters' version='18.1'>
  <column caption='Start date' datatype='date' name='[Parameter 1]' param-domain-type='any' role='measure' type='quantitative' value='#2025-08-08#'>
    <calculation class='tableau' formula='#2025-08-08#' />
  </column>
  <column caption='End Date' datatype='date' name='[Parameter 2]' param-domain-type='any' role='measure' type='quantitative' value='#2025-08-15#'>
    <calculation class='tableau' formula='#2025-08-15#' />
  </column>
  <column caption='Leads in DQ #' datatype='integer' name='[Calculation_1378101547580542977]' role='measure' type='quantitative'>
    <calculation class='tableau' formula='COUNTD(IF [Status] = &apos;Disqualified&apos; THEN [Phone] END)' />
  </column>
  <column caption='Age' datatype='integer' name='[Calculation_1419126481659973633]' role='dimension' type='ordinal'>
    <calculation class='tableau' formula='INT([age])' />
  </column>
</datasource>
<datasource name='Another Datasource'>
  <column caption='Test Calc' datatype='real' name='[Test_Calc]' role='measure' type='quantitative'>
    <calculation class='tableau' formula='[Field1] + [Field2]' />
  </column>
</datasource>
`;

describe('parseWorkbookXml Integration Test', () => {
  it('should extract calculated fields from real workbook snippet', () => {
    const result = parseWorkbookXml(realWorkbookSnippet);
    
    // Should find 5 calculated fields
    expect(result).toHaveLength(5);
    
    // Check the first parameter
    expect(result[0]).toEqual({
      name: '[Parameter 1]',
      caption: 'Start date',
      datatype: 'date',
      role: 'measure',
      type: 'quantitative',
      formula: '#2025-08-08#'
    });
    
    // Check the second parameter
    expect(result[1]).toEqual({
      name: '[Parameter 2]',
      caption: 'End Date',
      datatype: 'date',
      role: 'measure',
      type: 'quantitative',
      formula: '#2025-08-15#'
    });
    
    // Check the Leads in DQ calculation
    expect(result[2]).toEqual({
      name: '[Calculation_1378101547580542977]',
      caption: 'Leads in DQ #',
      datatype: 'integer',
      role: 'measure',
      type: 'quantitative',
      formula: 'COUNTD(IF [Status] = \'Disqualified\' THEN [Phone] END)'
    });
    
    // Check the Age calculation
    expect(result[3]).toEqual({
      name: '[Calculation_1419126481659973633]',
      caption: 'Age',
      datatype: 'integer',
      role: 'dimension',
      type: 'ordinal',
      formula: 'INT([age])'
    });
    
    // Check the Test Calc
    expect(result[4]).toEqual({
      name: '[Test_Calc]',
      caption: 'Test Calc',
      datatype: 'real',
      role: 'measure',
      type: 'quantitative',
      formula: '[Field1] + [Field2]'
    });
  });
  
  it('should handle malformed XML gracefully', () => {
    const malformedXml = `<datasource><column name='[Test]'><calculation class='tableau' formula='[Field1]'></datasource>`;
    const result = parseWorkbookXml(malformedXml);
    // Should not crash and should return an empty array or partial results
    expect(Array.isArray(result)).toBe(true);
  });
});
