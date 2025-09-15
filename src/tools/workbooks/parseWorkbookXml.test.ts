import { parseWorkbookXml } from './parseWorkbookXml.js';

// Sample XML content with calculated fields similar to what we found in the test workbook
const sampleXml = `
<workbook>
  <datasource name='Sample Data'>
    <column name='[Calculation_1]' caption='Leads in DQ #' datatype='integer' role='measure' type='quantitative'>
      <calculation class='tableau' formula='COUNTD(IF [Status] = &quot;Disqualified&quot; THEN [Phone] END)' />
    </column>
    <column name='[Parameter 1]' caption='Start date' datatype='date' role='measure' type='quantitative' value='#2025-08-08#'>
      <calculation class='tableau' formula='#2025-08-08#' />
    </column>
    <column name='[Regular_Column]' datatype='string' role='dimension' type='nominal'>
    </column>
    <column name='[Calculation_2]' caption='Age' datatype='integer' role='dimension' type='ordinal'>
      <calculation class='tableau' formula='INT([age])' />
    </column>
  </datasource>
</workbook>
`;

describe('parseWorkbookXml', () => {
  it('should extract calculated fields correctly', () => {
    const result = parseWorkbookXml(sampleXml);
    
    // Should find 3 calculated fields (2 with formulas, 1 parameter)
    expect(result).toHaveLength(3);
    
    // Check the first calculated field
    expect(result[0]).toEqual({
      name: '[Calculation_1]',
      caption: 'Leads in DQ #',
      datatype: 'integer',
      role: 'measure',
      type: 'quantitative',
      formula: 'COUNTD(IF [Status] = "Disqualified" THEN [Phone] END)'
    });
    
    // Check the parameter
    expect(result[1]).toEqual({
      name: '[Parameter 1]',
      caption: 'Start date',
      datatype: 'date',
      role: 'measure',
      type: 'quantitative',
      formula: '#2025-08-08#'
    });
    
    // Check the second calculated field
    expect(result[2]).toEqual({
      name: '[Calculation_2]',
      caption: 'Age',
      datatype: 'integer',
      role: 'dimension',
      type: 'ordinal',
      formula: 'INT([age])'
    });
  });
  
  it('should handle empty or invalid XML', () => {
    const result = parseWorkbookXml('');
    expect(result).toEqual([]);
  });
  
  it('should handle XML with no calculated fields', () => {
    const xmlWithoutCalcs = `
    <workbook>
      <datasource name='Sample Data'>
        <column name='[Regular_Column]' datatype='string' role='dimension' type='nominal'>
        </column>
      </datasource>
    </workbook>
    `;
    const result = parseWorkbookXml(xmlWithoutCalcs);
    expect(result).toEqual([]);
  });
});
