import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';

// The React Component for the Header
const HeaderComponent = (props: any) => {
  // We can use props.node.attrs to store the data
  const { docNumber, date, month, year, trichYeu } = props.node.attrs;

  const updateAttr = (key: string, value: string) => {
    props.updateAttributes({ [key]: value });
  };

  return (
    <NodeViewWrapper className="protected-header-node" contentEditable={false}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '40%', textAlign: 'center', verticalAlign: 'top', border: 'none' }}>
              <p style={{ margin: 0, fontSize: '13pt' }}>TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM</p>
              <p style={{ margin: 0, fontSize: '13pt', fontWeight: 'bold' }}>VIỄN THÔNG TÂY NINH</p>
              <p style={{ margin: 0, fontSize: '13pt', fontWeight: 'bold' }}>TRUNG TÂM HẠ TẦNG</p>
              <hr style={{ width: '40%', borderTop: '1px solid black', margin: '4px auto' }} />
              <p style={{ margin: '4px 0 0 0', fontSize: '13pt' }}>
                Số: <input 
                  type="text" 
                  value={docNumber} 
                  onChange={e => updateAttr('docNumber', e.target.value)}
                  style={{ width: '50px', border: 'none', borderBottom: '1px dotted #ccc', outline: 'none', fontSize: '13pt', textAlign: 'center', background: 'transparent' }} 
                  placeholder="..."
                />/TTr-TTHT
              </p>
              {trichYeu !== undefined && (
                <p style={{ margin: '4px 0 0 0', fontSize: '13pt' }}>
                  V/v: <textarea 
                    value={trichYeu} 
                    onChange={e => updateAttr('trichYeu', e.target.value)}
                    style={{ width: '90%', border: '1px dashed #ccc', outline: 'none', fontSize: '13pt', background: 'transparent', resize: 'vertical' }} 
                    placeholder="Nhập trích yếu..."
                  />
                </p>
              )}
            </td>
            <td style={{ width: '60%', textAlign: 'center', verticalAlign: 'top', border: 'none' }}>
              <p style={{ margin: 0, fontSize: '13pt', fontWeight: 'bold' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</p>
              <p style={{ margin: '12px 0 0 0', fontSize: '14pt', fontStyle: 'italic', textAlign: 'right', paddingRight: '20px' }}>
                Tây Ninh, ngày <input type="text" value={date} onChange={e => updateAttr('date', e.target.value)} style={{ width: '25px', border: 'none', borderBottom: '1px dotted #ccc', outline: 'none', fontSize: '14pt', fontStyle: 'italic', textAlign: 'center', background: 'transparent' }} placeholder=".." />
                {' '}tháng <input type="text" value={month} onChange={e => updateAttr('month', e.target.value)} style={{ width: '25px', border: 'none', borderBottom: '1px dotted #ccc', outline: 'none', fontSize: '14pt', fontStyle: 'italic', textAlign: 'center', background: 'transparent' }} placeholder=".." />
                {' '}năm <input type="text" value={year} onChange={e => updateAttr('year', e.target.value)} style={{ width: '45px', border: 'none', borderBottom: '1px dotted #ccc', outline: 'none', fontSize: '14pt', fontStyle: 'italic', textAlign: 'center', background: 'transparent' }} placeholder="...." />
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </NodeViewWrapper>
  );
};

export const ProtectedHeader = Node.create({
  name: 'protectedHeader',

  group: 'block',
  
  atom: true, // This makes the node act as a single unit (cannot put cursor inside except in inputs)

  addAttributes() {
    return {
      docNumber: { default: '' },
      date: { default: new Date().getDate().toString().padStart(2, '0') },
      month: { default: (new Date().getMonth() + 1).toString().padStart(2, '0') },
      year: { default: new Date().getFullYear().toString() },
      trichYeu: { default: undefined }, // If undefined, it doesn't show
    };
  },

  parseHTML() {
    return [
      { tag: 'protected-header' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // When exporting to HTML (e.g. for Word conversion), we render the actual HTML we want
    return ['table', { style: 'width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px;' },
      ['tbody', {},
        ['tr', {},
          ['td', { style: 'width: 40%; text-align: center; vertical-align: top; border: none;' },
            ['p', { style: 'margin: 0; font-size: 13pt;' }, 'TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM'],
            ['p', { style: 'margin: 0; font-size: 13pt; font-weight: bold;' }, 'VIỄN THÔNG TÂY NINH'],
            ['p', { style: 'margin: 0; font-size: 13pt; font-weight: bold;' }, 'TRUNG TÂM HẠ TẦNG'],
            ['hr', { style: 'width: 40%; border-top: 1px solid black; margin: 4px auto;' }],
            ['p', { style: 'margin: 4px 0 0 0; font-size: 13pt;' }, `Số: ${HTMLAttributes.docNumber}/TTr-TTHT`],
            ...(HTMLAttributes.trichYeu !== undefined ? [
              ['p', { style: 'margin: 4px 0 0 0; font-size: 13pt;' }, `V/v: ${HTMLAttributes.trichYeu}`]
            ] : [])
          ],
          ['td', { style: 'width: 60%; text-align: center; vertical-align: top; border: none;' },
            ['p', { style: 'margin: 0; font-size: 13pt; font-weight: bold;' }, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
            ['p', { style: 'margin: 0; font-size: 14pt; font-weight: bold; text-decoration: underline;' }, 'Độc lập - Tự do - Hạnh phúc'],
            ['p', { style: 'margin: 12px 0 0 0; font-size: 14pt; font-style: italic; text-align: right; padding-right: 20px;' }, `Tây Ninh, ngày ${HTMLAttributes.date} tháng ${HTMLAttributes.month} năm ${HTMLAttributes.year}`]
          ]
        ]
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HeaderComponent);
  },
});
