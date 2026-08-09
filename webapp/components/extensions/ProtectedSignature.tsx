import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

const SignatureComponent = (props: any) => {
  const { signerRole, signerName, recipients } = props.node.attrs;

  const updateAttr = (key: string, value: string) => {
    props.updateAttributes({ [key]: value });
  };

  return (
    <NodeViewWrapper className="protected-signature-node" contentEditable={false}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '40px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', verticalAlign: 'top', border: 'none' }}>
              <p style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic' }}>Nơi nhận:</p>
              <textarea 
                value={recipients}
                onChange={e => updateAttr('recipients', e.target.value)}
                style={{ width: '90%', minHeight: '80px', border: '1px dashed #ccc', outline: 'none', fontSize: '11pt', fontStyle: 'italic', background: 'transparent', resize: 'vertical' }}
                placeholder="- Như trên;&#10;- Ban Giám đốc;&#10;- Lưu: VT, TTHT."
              />
            </td>
            <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', border: 'none' }}>
              <p style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>
                <input 
                  type="text" 
                  value={signerRole} 
                  onChange={e => updateAttr('signerRole', e.target.value)}
                  style={{ width: '100%', border: 'none', borderBottom: '1px dotted #ccc', outline: 'none', fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', background: 'transparent' }} 
                  placeholder="GIÁM ĐỐC TRUNG TÂM"
                />
              </p>
              <p style={{ margin: '80px 0 0 0', fontSize: '14pt', fontWeight: 'bold' }}>
                <input 
                  type="text" 
                  value={signerName} 
                  onChange={e => updateAttr('signerName', e.target.value)}
                  style={{ width: '100%', border: 'none', borderBottom: '1px dotted #ccc', outline: 'none', fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', background: 'transparent' }} 
                  placeholder="Nguyễn Văn A"
                />
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </NodeViewWrapper>
  );
};

export const ProtectedSignature = Node.create({
  name: 'protectedSignature',

  group: 'block',
  
  atom: true,

  addAttributes() {
    return {
      signerRole: { default: 'GIÁM ĐỐC TRUNG TÂM' },
      signerName: { default: '' },
      recipients: { default: '- Như trên;\n- Ban Giám đốc (để b/c);\n- Lưu: VT, TTHT.' },
    };
  },

  parseHTML() {
    return [
      { tag: 'protected-signature' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const recipientsLines = (HTMLAttributes.recipients || '').split('\\n').map((line: string) => 
      ['p', { style: 'margin: 0; font-size: 11pt; font-style: italic;' }, line]
    );

    return ['table', { style: 'width: 100%; border-collapse: collapse; border: none; margin-top: 40px;' },
      ['tbody', {},
        ['tr', {},
          ['td', { style: 'width: 50%; vertical-align: top; border: none;' },
            ['p', { style: 'margin: 0; font-size: 11pt; font-weight: bold; font-style: italic;' }, 'Nơi nhận:'],
            ...recipientsLines
          ],
          ['td', { style: 'width: 50%; text-align: center; vertical-align: top; border: none;' },
            ['p', { style: 'margin: 0; font-size: 14pt; font-weight: bold;' }, HTMLAttributes.signerRole],
            ['p', { style: 'margin: 80px 0 0 0; font-size: 14pt; font-weight: bold;' }, HTMLAttributes.signerName]
          ]
        ]
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SignatureComponent);
  },
});
