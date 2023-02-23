export interface CASConfig {
  key: string;
  value: string | number | {} | string[];
}

export interface ResCASConfig {
  [key: string]: string | number | {} | string[];
}

export interface reqCASConfig {
  [key: string]: string | boolean;
}

export const getStandardCasConfig = (item: ResCASConfig, appModule: string) => {
  if (appModule === 'filter') {
    if (!item || !Array.isArray(item)) return '';

    return item.join('\n');
  }

  return JSON.stringify(item, undefined, 4);
};
