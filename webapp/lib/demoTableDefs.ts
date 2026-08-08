export const getTableDef = (tag: string) => {
  const baseColumns = [
    { key: 'tht', label: 'Tổ Hạ Tầng', type: 'text' as const },
    { key: 't06', label: 'Tháng 06/2026', type: 'number' as const },
    { key: 't07', label: 'Tháng 07/2026', type: 'number' as const },
  ];
  const baseData = [
    { tht: 'Bến Lức', t06: 0, t07: 0 },
    { tht: 'Đức Hòa', t06: 0, t07: 0 },
    { tht: 'Gò Dầu', t06: 0, t07: 0 },
    { tht: 'Kiến Tường', t06: 0, t07: 0 },
    { tht: 'Tân An', t06: 0, t07: 0 },
    { tht: 'Tân Châu', t06: 0, t07: 0 },
    { tht: 'Tân Ninh', t06: 0, t07: 0 },
  ];

  if (tag.includes('(B2_TAM)')) {
    return {
      columns: [
        { key: 'tht', label: 'Tổ Hạ Tầng', type: 'text' as const },
        { key: 'loai_tb', label: 'Loại TB', type: 'text' as const },
        { key: 't06', label: '06/2026', type: 'number' as const },
        { key: 't07', label: '07/2026', type: 'number' as const },
      ],
      data: [
        { tht: 'Bến Lức', loai_tb: 'GPON', t06: 65, t07: 67 },
        { tht: 'Đức Hòa', loai_tb: 'GPON', t06: 51, t07: 49 },
        { tht: 'Gò Dầu', loai_tb: 'GPON', t06: 100, t07: 100 },
        { tht: 'Kiến Tường', loai_tb: 'GPON', t06: 12, t07: 15 },
      ]
    };
  }
  
  if (tag.includes('FBB') || tag.includes('QoS') || tag.includes('QoE') || tag.includes('B18_BAO')) {
    return {
      columns: [
        { key: 'tht', label: 'Tổ Hạ Tầng', type: 'text' as const },
        { key: 't06', label: '06/2026', type: 'percentage' as const },
        { key: 't07', label: '07/2026', type: 'percentage' as const },
      ],
      data: [
        { tht: 'Bến Lức', t06: 98.2, t07: 98.45 },
        { tht: 'Đức Hòa', t06: 98.1, t07: 98.21 },
        { tht: 'Gò Dầu', t06: 97.5, t07: 97.85 },
      ]
    };
  }

  return { columns: baseColumns, data: baseData };
};
