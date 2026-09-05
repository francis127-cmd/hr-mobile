export const theme = {
  colors: {
    background: '#f2f4f7',
    surface: '#ffffff',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    danger: '#dc2626',
    success: '#16a34a',
    warning: '#d97706',
  },
  priorityColors: {
    LOW: '#16a34a',
    STANDARD: '#2563eb',
    URGENT: '#dc2626',
  } as Record<string, string>,
  stateColors: {
    PENDING: '#d97706',
    IN_PROGRESS: '#2563eb',
    COMPLETED: '#16a34a',
    REJECTED: '#dc2626',
    CANCELED: '#64748b',
  } as Record<string, string>,
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: 10,
};
