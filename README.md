# Tableau MCP

[![Tableau Supported](https://img.shields.io/badge/Support%20Level-Tableau%20Supported-53bd92.svg)](https://www.tableau.com/support-levels-it-and-developer-tools)

[![Build and Test](https://github.com/tableau/tableau-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tableau/tableau-mcp/actions/workflows/ci.yml)

## Overview

Tableau MCP is a suite of developer primitives, including tools, resources and prompts, that will
make it easier for developers to build AI-applications that integrate with Tableau.

## Official Documentation

https://tableau.github.io/tableau-mcp/

## List Workbook Calculated Fields

The MCP server includes a tool to list calculated fields for a specific workbook. You can choose how results are retrieved:

- `source: "auto"` – Try parsing the TWB XML first; fall back to the Metadata API on error
- `source: "twb-xml"` – Only parse directly from the downloaded TWB (XML format)
- `source: "metadata"` – Only query the Metadata API (original behavior)
- `source: "combined"` – Merge results from TWB XML and Metadata API, deduped by name

You can also request a summary that includes counts by datatype/role and a sample of fields.

Tool name: `list-workbook-calculated-fields`

Parameters:

- `workbookId` (string, required)
- `source` (optional, enum: `auto | twb-xml | metadata | combined`, default: `auto`)
- `includeSummary` (optional, boolean, default: `false`)
- `sampleLimit` (optional, number, default: `20`, max: `200`) – controls sample size if `includeSummary` is `true`
- `useDirectParsing` (optional, boolean, deprecated) – equivalent to `source: "twb-xml"`

Example invocations (Inspector or programmatic use):

```json
{
  "name": "list-workbook-calculated-fields",
  "arguments": {
    "workbookId": "308c6a80-75af-4637-9051-2782062b327c",
    "source": "twb-xml",
    "includeSummary": true,
    "sampleLimit": 30
  }
}
```

```json
{
  "name": "list-workbook-calculated-fields",
  "arguments": {
    "workbookId": "308c6a80-75af-4637-9051-2782062b327c",
    "source": "combined",
    "includeSummary": true
  }
}
```

Response shape:

```json
{
  "count": 2474,
  "fields": [
    {
      "workbookLuid": "308c6a80-75af-4637-9051-2782062b327c",
      "workbookName": "Lead Analysis",
      "datasourceLuid": "308c6a80-75af-4637-9051-2782062b327c",
      "datasourceName": "Workbook (TWB)",
      "name": "[Parameter 1]",
      "caption": "Date Bucket",
      "datatype": "string",
      "role": "measure",
      "type": "nominal",
      "formula": "\"day\"",
      "source": "workbook-xml"
    }
  ],
  "source": "twb-xml",
  "summary": {
    "totalCalculatedFields": 2474,
    "byDatatype": {"integer": 904, "string": 1037, "date": 260, "real": 78, "boolean": 93, "datetime": 102},
    "byRole": {"measure": 1168, "dimension": 1306},
    "sample": [
      {"name": "[Parameter 1]", "caption": "Date Bucket", "datatype": "string", "role": "measure", "type": "nominal", "formula": "\"day\""}
    ]
  }
}
```

Notes:

- The `source` selection lets you prefer TWB parsing (fast, local) or Metadata API (remote richness) or both.
- `useDirectParsing` is kept for backward compatibility; prefer `source: "twb-xml"`.
