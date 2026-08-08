/**
 * DashboardPageComponent constants and configuration.
 */

export const DASHBOARD_CONSTANTS = {
  /**
   * Default page size for pagination.
   * Matches typical web UI pagination (10-25 items).
   */
  DEFAULT_PAGE_SIZE: 10,

  /**
   * Default page number (1-indexed, UI-friendly).
   */
  DEFAULT_PAGE: 1,

  /**
   * Maximum items per page (upper limit for user selection).
   */
  MAX_PAGE_SIZE: 50,

  /**
   * Default number of recent activities to fetch.
   */
  DEFAULT_ACTIVITIES_LIMIT: 10,

  /**
   * Time to buffer subscription updates (milliseconds).
   * Per CLAUDE.md: bufferTime(250ms) for high-frequency updates.
   */
  SUBSCRIPTION_BUFFER_TIME_MS: 250,
} as const;

/**
 * Table column configuration for builds table.
 */
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
}

export const BUILDS_TABLE_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Build Name', sortable: true, width: '40%' },
  { key: 'status', label: 'Status', sortable: true, width: '20%' },
  { key: 'createdAt', label: 'Created', sortable: true, width: '20%' },
  { key: 'updatedAt', label: 'Updated', sortable: true, width: '20%' },
];
