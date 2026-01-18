export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: ChartData;
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface GroqResponse {
  text: string;
  chartData?: ChartData;
}

export interface ElectionQueryResult {
  queryType: 'candidate' | 'party' | 'section' | 'comparison' | 'general';
  data: unknown;
  description: string;
}
