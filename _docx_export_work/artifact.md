# Word export artifact brief

- Retained template: `templates/TTHT Báo cáo công việc tuần 29.docx`
- Reference SHA-256: `CD1AB7352AFB38FD36EC61A6C34B95901B46A022DECC54269CB3326F07C15E69`
- Layout: 2 sections, portrait report body followed by landscape appendix.
- Typography and table styling: preserve the template's existing Times New Roman formatting, borders, fills, widths, merged cells, headers, footers, images, and signature block.
- Editable slots: existing report paragraphs P1-P2, P4, P18, P20, P36-P37, P41-P47, P50, P55, P59-P61, P64/P70/P76, P79-P87, P93-P100, P104-P111, P116, P121; existing tables T1-T20 and T22.
- Data policy: read only the workbook ranges required by those slots. Do not append dashboard summaries or unrelated Excel data.
- Link policy: replace legacy Excel LINK fields with static values so the exported document does not depend on stale local workbook paths.
- Output policy: write generated documents to `exports/`; never overwrite the retained template.
- Fidelity gates: template hash unchanged, DOCX package opens, 2 sections retained, 23 tables retained, five anchored images retained, no LINK fields remain, and the rendered output is visually inspected before delivery.
