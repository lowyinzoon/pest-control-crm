export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const LEAD_STAGE_ORDER = [
  'NEW_LEAD',
  'CONTACTED',
  'SITE_INSPECTION',
  'QUOTATION_SENT',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;

export const JOB_STATUS_ORDER = [
  'SCHEDULED',
  'EN_ROUTE',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export const GM_THRESHOLD_MANAGER = 35;
export const DISCOUNT_CAP_DIRECTOR = 20;
export const MIN_PRICE_BLOCK = true;

export const BRANCH_CODES: Record<string, string> = {
  'Kuala Lumpur': 'KL',
  'Selangor': 'SEL',
  'Penang': 'PG',
  'Johor': 'JB',
  'Sabah': 'SBH',
  'Sarawak': 'SWK',
};
