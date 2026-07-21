import { parseMBB } from './parseMBB';
import { parseFBB } from './parseFBB';
import { parseMYTV } from './parseMYTV';
import { parseMLL } from './parseMLL';
import { parseISPEED } from './parseISPEED';
import { parse5S } from './parse5S';
import { parseXLSC } from './parseXLSC';
import { parseAPPENDIX } from './parseAPPENDIX';
import { REPORT_MAP } from '../reports';
import type { ReportBlock, Tone } from './utils';

export interface DashboardData {
  hero: {
    title: string;
    kicker: string;
    date: string;
  };
  signalBands: Array<{ label: string; value: string; tone: Tone; note: string }>;
  serviceReports: ReportBlock[];
  operationReports: ReportBlock[];
  actionItems: Array<{ title: string; detail: string; tone: Tone }>;
  sources: typeof REPORT_MAP;
}

export function buildDashboardData(buffers: Record<string, Buffer>): DashboardData {
  const serviceReports: ReportBlock[] = [];
  const operationReports: ReportBlock[] = [];
  const signalBands: DashboardData['signalBands'] = [];
  const actionItems: DashboardData['actionItems'] = [];

  // Parse all 8 reports
  if (buffers['mbb']) {
    const data = parseMBB(buffers['mbb']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
    signalBands.push({
      label: 'MBB QoE',
      value: data.metrics.find(m => m.label.includes('QoE Tây Ninh'))?.value ?? 'N/A',
      tone: data.tone,
      note: 'Chất lượng trải nghiệm di động'
    });
    actionItems.push({
      title: 'Xử lý trạm MBB',
      detail: data.insights.find(i => i.includes('giải trình QoS')) ?? 'Không có trạm cần giải trình.',
      tone: data.tone
    });
  }
  if (buffers['fbb']) {
    const data = parseFBB(buffers['fbb']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
    signalBands.push({
      label: 'FBB QoS',
      value: data.metrics.find(m => m.label.includes('QoS'))?.value ?? 'N/A',
      tone: data.tone,
      note: 'Chất lượng băng rộng cố định'
    });
    actionItems.push({
      title: 'Cải thiện QoS FBB',
      detail: data.insights[0] ?? 'Các chỉ tiêu FBB ổn định.',
      tone: data.tone
    });
  }
  if (buffers['mytv']) {
    const data = parseMYTV(buffers['mytv']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
    signalBands.push({
      label: 'MyTV QoE',
      value: data.metrics.find(m => m.label.includes('QoE'))?.value ?? 'N/A',
      tone: data.tone,
      note: 'Chất lượng truyền hình'
    });
  }
  if (buffers['mll']) {
    const data = parseMLL(buffers['mll']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
    signalBands.push({
      label: 'MLL',
      value: data.metrics.find(m => m.label.includes('tổng số'))?.value ?? 'N/A',
      tone: data.tone,
      note: 'Mất liên lạc'
    });
  }
  if (buffers['ispeed']) {
    const data = parseISPEED(buffers['ispeed']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
    signalBands.push({
      label: 'i-Speed',
      value: data.metrics.find(m => m.label.includes('i-Speed'))?.value ?? 'N/A',
      tone: data.tone,
      note: 'Đo kiểm i-Speed'
    });
  }
  if (buffers['5s']) {
    const data = parse5S(buffers['5s']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
    signalBands.push({
      label: '5S Trạm',
      value: data.metrics.find(m => m.label.includes('Hoàn thành'))?.value ?? 'N/A',
      tone: data.tone,
      note: 'Bảo dưỡng nhà trạm'
    });
  }
  if (buffers['xlsc']) {
    const data = parseXLSC(buffers['xlsc']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
    actionItems.push({
      title: 'Xử lý phiếu XLSC',
      detail: data.insights[0] ?? 'Hoàn thành tốt công tác xử lý sự cố.',
      tone: data.tone
    });
  }
  if (buffers['appendix']) {
    const data = parseAPPENDIX(buffers['appendix']);
    (data.group === 'service' ? serviceReports : operationReports).push(data);
  }

  // Generate hero info
  const hero = {
    title: 'BÁO CÁO TỔNG HỢP TUẦN',
    kicker: 'VNPT TÂY NINH',
    date: new Date().toLocaleDateString('vi-VN')
  };

  return {
    hero,
    signalBands,
    serviceReports,
    operationReports,
    actionItems,
    sources: REPORT_MAP
  };
}
