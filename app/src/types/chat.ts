export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: ChartData;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface GroupedChartDataPoint {
  name: string;
  values: number[];
  colors?: string[];
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'grouped-bar';
  title: string;
  data: ChartDataPoint[];
  groups?: string[];
  groupedData?: GroupedChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
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
