export enum ChartType {
  dataTable = 'data_table',
  metric = 'metric', // for single,
  metrics = 'metrics',
  line = 'line',
  bar = 'bar',
  pie = 'pie',
  doughnut = 'doughnut'
}

export enum QuestionType {
  chart = 'chart',
  sla = 'sla',
  avgCallDuration = 'avg_call_duration',
  avgWaitTime = 'avg_wait_time',
  abandonedRate = 'abandoned_rate',
  agentStatistic = 'agent_statistic',
  agentStatus = 'agent_status',
  callStatistic = 'call_statistic',
  manOutCallStat = 'man_out_call_stat',
  manOutCallData = 'man_out_call_data',
  agentList = 'agent_list',
  agentList2 = 'agent_list2',
  gojekAPIPercentage = 'gojek_api_per',

  // for GE only
  geInboundStatistic = 'ge_inbound_statistic',
  geCallbackStatistic = 'ge_callback_statistic',
  geSLA = 'ge_sla',
  neaBlockUpdate = 'nea_block_update',
  necIvrActiveCalls = 'nec_ivr_active_calls',
  necAgentLatestStatus = 'nec_agent_latest_status',
  necAgentPerformance = 'nec_agent_performance',
  necQueueSummary = 'nec_queue_summary'
}

export enum Aggregation {
  count = 'count',
  sum = 'sum',
  min = 'min',
  max = 'max',
  value = 'value', // get property value
  average = 'average'
}

export enum MetricFieldType {
  duration = 'duration'
}

export enum FieldValueFormat {
  orgTime = 'orgTime'
}

export interface MetricChartConfig {
  aggregation: Aggregation;
  field?: string;
  label?: string;
  type?: MetricFieldType;
  unit?: 'millisecond' | 'second';
  format?: FieldValueFormat;
}

export interface MetricsChartConfig {
  metrics: Array<MetricChartConfig>;
}

export interface PieChartConfig {
  label: string;
  value: string;
}

export interface DataTableChartConfig {
  splitRowsField: string;
  label: string;
  metrics: Array<MetricChartConfig>;
  hideSplitField: boolean;
  showTotalRow?: boolean;
  sortBy?: string;
  sortByOrder?: string;
  stickToBottom?: string[]; // value from split field
  unit?: 'millisecond' | 'second';
}

export interface ChartConfig {
  splitField: string;
  aggregation: Aggregation;
  field?: string;
  label?: string;
}

export enum Operator {
  equals = 'equals',
  in = 'in'
}

export interface LiveFilter {
  field: string;
  value: any;
  op: Operator;
  or: LiveFilter | null; // OR operator with orther filter
}

export enum RequestDataSource {
  msData = 'msData',
  wallboard = 'wallboard'
}

export type V4SourceType = 'dump' | 'agg' | 'curr';
export type V4SourcePeriod = '*' | '15m' | '30m' | '1h' | '1d' | '1M';
export type RequestMethod = 'get' | 'post' | 'put' | 'delete';

export interface QuestionRequest {
  method: RequestMethod;
  path: string;
  params: {};
  liveFilters: Array<LiveFilter> | undefined;
  source: RequestDataSource;
}

export interface V4Request {
  reportType: null | 'formatted' | 'unformatted';
  code: string;
  method: RequestMethod;
  type: V4SourceType | undefined;
  period: V4SourcePeriod | undefined;
  params: {};
}

export interface QuestionChartData {
  id: string;
  request: QuestionRequest | V4Request;
  v4: boolean;
  chartType: ChartType;
  chartConfig: MetricChartConfig | DataTableChartConfig | ChartConfig;
}

export class QuestionData {
  chartDatas: QuestionChartData[];

  // TODO: NEED REFACTOR
  newchartDatas?: QuestionChartData[];
}

export enum QuestionStatus {
  active = 'active'
}

export class Question {
  uuid: string;
  name: string;
  type: QuestionType;
  question: QuestionData;
  status: QuestionStatus;
  createdAt: Date;
  updatedAt: Date;

  static fromResp(obj?: any) {
    return Object.assign(new Question(), obj);
  }
}
