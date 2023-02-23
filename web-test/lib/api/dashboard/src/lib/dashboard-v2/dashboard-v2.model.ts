import { TimeRangeKey } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';

export class QuestionV2 {
  name: string;
  uuid: string;
  question: QuestionV2Info;
  config: HashMap<ConfigPieV2> | ConfigTableV2;
  isDefault: boolean;

  // UI
  disabled: boolean;
  selected: boolean;

  constructor(obj?: Partial<QuestionV2>) {
    if (obj) {
      Object.assign(this, obj);

      if (obj.question) {
        this.question = new QuestionV2Info(obj.question);
      }
    }
  }
}

export class QuestionV2Info {
  description: string;
  filters: string[];
  messages: {
    noData: string;
    note: string;
    noFilter: string;
  };
  queryTimeRange: string;
  source: {
    reportCode: string;
    type: QuestionV2SourceType;
    apiVersion: QuestionV2APIVersion;
    singleMetric: boolean;
  };
  supportedDateTimeOptions?: TimeRangeKey[];
  constraints: {
    maxQueues: number;
  };

  constructor(obj?: Partial<QuestionV2Info>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get hasFilter() {
    return !!this.filters.length;
  }

  get hasFilterQueue() {
    return this.filters.includes(QuestionV2SourceFilter.QUEUE_UUID);
  }

  get hasFilterDateTime() {
    return this.filters.includes(QuestionV2SourceFilter.DATETIME);
  }

  get hasFilterIncludeNonQueue() {
    return this.filters.includes(QuestionV2SourceFilter.INCLUDE_NON_QUEUE);
  }

  get hasFilterState() {
    return this.filters.includes(QuestionV2SourceFilter.STATE);
  }

  get hasFilterExtension() {
    return this.filters.includes(QuestionV2SourceFilter.EXTENSION);
  }

  get icon() {
    switch (this.source.type) {
      case QuestionV2SourceType.PIE_CHART:
        return {
          name: 'pie_chart',
          toolTip: 'Pie chart'
        };

      case QuestionV2SourceType.LINE_CHART:
        return {
          name: 'show_chart',
          toolTip: 'Line chart'
        };

      case QuestionV2SourceType.TABLE_CHART:
        return this.source.singleMetric
          ? {
              name: 'money',
              toolTip: 'Single metric chart'
            }
          : {
              name: 'table_chart',
              toolTip: 'Table chart'
            };

      default:
        return {
          name: 'grid_view',
          toolTip: 'Tags'
        };
    }
  }

  get filtersMap(): string[] {
    return this.filters.map(f => {
      switch (f) {
        case QuestionV2SourceFilter.QUEUE_UUID:
          return 'queue';

        case QuestionV2SourceFilter.DATETIME:
          return 'date time';

        case QuestionV2SourceFilter.INCLUDE_NON_QUEUE:
          return 'include non queue';

        case QuestionV2SourceFilter.STATE:
          return 'state';

        case QuestionV2SourceFilter.EXTENSION:
          return 'extension';

        default:
          return '';
      }
    });
  }
}

export interface ConfigPieV2 {
  color: string;
  displayText: string;
}

export interface ConfigTableV2 {
  column: {
    name: string;
    condition: {
      match: string;
    };
    format: {
      textStyle: string;
      textColor: string;
    };
  }[];
  row: {
    column: string;
    condition: {
      match: string;
    };
    format: {
      backgroundColor: string;
    };
  }[];
}

export enum QuestionV2SourceType {
  PIE_CHART = 'pieChart',
  TABLE_CHART = 'agg',
  LINE_CHART = 'lineChart',
  CURR = 'curr'
}

export enum QuestionV2SourceFilter {
  QUEUE_UUID = 'queueUuid',
  NON_QUEUE_UUID = 'queueUuid!',
  DATETIME = 'dateTime',
  INCLUDE_NON_QUEUE = 'includeNonQueue',
  STATE = 'state',
  EXTENSION = 'extensionKey'
}

export enum QuestionV2APIVersion {
  V1 = 'v1',
  V4 = 'v4'
}

export interface Dashboard2DateTime {
  timeRangeKey: TimeRangeKey;
  startTime: string;
  endTime: string;
}

export class Dashboard2 {
  name: string;
  uuid: string;
  isDefault: boolean;
  createdAt: string;
  status: string;
  updatedAt: string;
  config: {
    templateId: number;
  };
  starred?: boolean;
  starIndex?: number;

  constructor(obj?: Partial<Dashboard2>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get template(): Template {
    let template: Template;

    loop: for (let i = 0; i < TEMPLATE_SLIDES.length; i++) {
      const slide = TEMPLATE_SLIDES[i];

      for (let j = 0; j < slide.templates.length; j++) {
        const t = slide.templates[j];

        if (t.id === this.config.templateId) {
          template = t;
          break loop;
        }
      }
    }

    return template;
  }
}

export type Dashboard2Map = HashMap<{
  selected: boolean;
}>;

export interface Dashboard2CardConfig {
  x: number;
  y: number;
  rows?: number;
  cols?: number;
  page?: number;
  order?: number;
}

export interface Dashboard2Card {
  config: Dashboard2CardConfig;
  uuid: string;
  dashboardUuid: string;
  questionUuid: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: number;
  class: string;
  item: number;
  content: string;
  configs: Dashboard2CardConfig[];
}

export interface TemplateSlide {
  id: number;
  templates: Template[];
}

export interface Starred {
  starredUuids: string[];
}

export class GlobalConfig {
  starredConfig: {
    minStarred: number;
    maxStarred: number;
  };

  publicAccessConfig: {
    maxAccessDevice: number;
    maxAccessDashboard: number;
  };

  customLayoutConfig: {
    maxWidget: number;
  };

  constructor(obj?: Partial<GlobalConfig>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get minStarred() {
    return this.starredConfig.minStarred;
  }

  get maxStarred() {
    return this.starredConfig.maxStarred;
  }

  get maxAccessDevice() {
    return this.publicAccessConfig.maxAccessDevice;
  }

  get maxAccessDashboard() {
    return this.publicAccessConfig.maxAccessDashboard;
  }

  get maxWidget() {
    return this.customLayoutConfig.maxWidget;
  }
}

export interface PublicDevice {
  identityUuid: string;
  deviceId: string;
  deviceName: string;
  dashboardUuids: string[];
  approvedAt: string;

  // UI
  extLabel?: string;
  isActive?: boolean;
  dashboardNames?: string;
}

export class Management {
  identityUuid: string;
  dashboardUuids: string[];
  extLabel: string;

  constructor(obj?: Partial<Management>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get allUserAccessAll() {
    return (
      !!this.identityUuid &&
      !!this.dashboardUuids &&
      this.identityUuid === '*' &&
      this.dashboardUuids.length === 1 &&
      this.dashboardUuids[0] === '*'
    );
  }

  get userAccessAll() {
    return (
      !!this.identityUuid &&
      !!this.dashboardUuids &&
      this.identityUuid !== '*' &&
      this.dashboardUuids.length === 1 &&
      this.dashboardUuids[0] === '*'
    );
  }

  getDashboardNames(dashboard2s?: Dashboard2[]) {
    if (!this.dashboardUuids || !this.dashboardUuids.length) {
      return 'No Dashboard';
    }

    if (this.dashboardUuids.length === 1 && this.dashboardUuids[0] === '*') {
      return 'All Dashboards';
    }

    let arr = this.dashboardUuids;

    if (dashboard2s) {
      arr = this.dashboardUuids.map(uuid => {
        const dashboard = dashboard2s.find(d => d.uuid === uuid);
        return dashboard?.name;
      });
    }

    return arr.join(', ');
  }
}

export const DASHBOARD_2_UUID = 'dashboard2';
export const DASHBOARD_2_CARD_UUID = 'dashboard2_card';

// Users
export const DASHBOARD_2_QUESTION_USER_STATE_UUID = 'user_state';
export const DASHBOARD_2_QUESTION_USER_STATE_OVERVIEW_UUID = 'user_state_overview';

export const DASHBOARD_2_DEFAULT_DATETIMES = [
  { key: TimeRangeKey['24h'], value: 'Today' },
  { key: TimeRangeKey.yesterday, value: 'Yesterday' },
  { key: TimeRangeKey.thisWeek, value: 'This Week' },
  { key: TimeRangeKey.lastWeek, value: 'Last Week' },
  { key: TimeRangeKey.thisMonth, value: 'This Month' },
  { key: TimeRangeKey.lastMonth, value: 'Last Month' },
  { key: TimeRangeKey.custom_date, value: 'Custom Date' },
  { key: TimeRangeKey.specific_date, value: 'Custom Date Range' }
];

export const TEMPLATE_SLIDES: TemplateSlide[] = [
  {
    id: 1,
    templates: [
      {
        id: 1,
        class: 'template-1',
        item: 1,
        content: '1 widget',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 1
          }
        ]
      },
      {
        id: 2,
        class: 'template-2-a',
        item: 2,
        content: '2 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 5
          },
          {
            x: 5,
            y: 0,
            rows: 1,
            cols: 5
          }
        ]
      },
      {
        id: 3,
        class: 'template-2-b',
        item: 2,
        content: '2 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 0,
            y: 1,
            rows: 1,
            cols: 1
          }
        ]
      }
    ]
  },
  {
    id: 2,
    templates: [
      {
        id: 4,
        class: 'template-3-a',
        item: 3,
        content: '3 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 2,
            cols: 1
          },
          {
            x: 1,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 1,
            rows: 1,
            cols: 1
          }
        ]
      },
      {
        id: 5,
        class: 'template-3-b',
        item: 3,
        content: '3 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 2
          },
          {
            x: 0,
            y: 1,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 1,
            rows: 1,
            cols: 1
          }
        ]
      }
    ]
  },
  {
    id: 3,
    templates: [
      {
        id: 6,
        class: 'template-4-a',
        item: 4,
        content: '4 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 0,
            y: 1,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 1,
            rows: 1,
            cols: 1
          }
        ]
      },
      {
        id: 7,
        class: 'template-4-b',
        item: 4,
        content: '4 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 3,
            cols: 1
          },
          {
            x: 1,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 1,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 2,
            rows: 1,
            cols: 1
          }
        ]
      },
      {
        id: 8,
        class: 'template-4-c',
        item: 4,
        content: '4 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 3
          },
          {
            x: 0,
            y: 1,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 1,
            rows: 1,
            cols: 1
          },
          {
            x: 2,
            y: 1,
            rows: 1,
            cols: 1
          }
        ]
      }
    ]
  },
  {
    id: 4,
    templates: [
      {
        id: 9,
        class: 'template-5-a',
        item: 5,
        content: '5 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 6
          },
          {
            x: 6,
            y: 0,
            rows: 1,
            cols: 6
          },
          {
            x: 0,
            y: 1,
            rows: 1,
            cols: 4
          },
          {
            x: 4,
            y: 1,
            rows: 1,
            cols: 4
          },
          {
            x: 8,
            y: 1,
            rows: 1,
            cols: 4
          }
        ]
      },
      {
        id: 10,
        class: 'template-5-b',
        item: 5,
        content: '5 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 3,
            cols: 4
          },
          {
            x: 4,
            y: 0,
            rows: 2,
            cols: 4
          },
          {
            x: 4,
            y: 2,
            rows: 2,
            cols: 4
          },
          {
            x: 0,
            y: 3,
            rows: 3,
            cols: 4
          },
          {
            x: 4,
            y: 4,
            rows: 2,
            cols: 4
          }
        ]
      },
      {
        id: 11,
        class: 'template-6-a',
        item: 6,
        content: '6 widgets',
        configs: [
          {
            x: 0,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 2,
            y: 0,
            rows: 1,
            cols: 1
          },
          {
            x: 0,
            y: 1,
            rows: 1,
            cols: 1
          },
          {
            x: 1,
            y: 1,
            rows: 1,
            cols: 1
          },
          {
            x: 2,
            y: 1,
            rows: 1,
            cols: 1
          }
        ]
      }
    ]
  }
];

export const STORE_CONFIG_TOKEN = 'STORE_CONFIG';
export const QUESTION_TYPE = [
  { key: 1, value: 'All' },
  { key: 2, value: 'Default' },
  { key: 3, value: 'Custom' }
];
export const DASHBOARD_TYPE = [
  { key: 1, value: 'All' },
  { key: 2, value: 'Default' },
  { key: 3, value: 'Custom' }
];
export const MANAGEMENT_TYPE = [
  { key: 1, value: 'All' },
  { key: 2, value: 'Has Privilege' }
];
export const IAM_DASHBOARD_SERVICE = 'dashboard';

//! Change these const base on width and margin set at scss file
export const DATETIME_WIDTH = 196;
export const DATETIME_CUSTOM_WIDTH = 433;
export const EXTENSION_WIDTH = 196;
export const INCLUDE_NON_QUEUE_WIDTH = 210;
export const QUEUE_WIDTH = 196;
export const STATE_WIDTH = 196;

export enum DashboardPermission {
  READONLY = 'ReadOnly',
  MANAGE = 'Manage'
}

export type DashboardMap =
  | '*'
  | {
      [uuid: string]: {
        [DashboardPermission.READONLY]?: boolean;
        [DashboardPermission.MANAGE]?: boolean;
      };
    };
