import { fetchJson } from './index';

export interface AnalyticsDashboardData {
  summary: {
    totalProducts: number;
    activeProducts: number;
    totalChats: number;
    totalOrders: number;
    totalFaqs: number;
    activeFaqs: number;
    uniqueCustomers: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  revenue: {
    total: number;
    average: number;
    ordersInPeriod: number;
    completedInPeriod: number;
  };
  popularProducts: Array<{ name: string; count: number }>;
  recentChats: Array<any>;
  recentOrders: Array<any>;
  chartData: Array<{
    date: string;
    orders: number;
    chats: number;
    revenue: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

export async function getDashboard(params?: { startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return fetchJson(`/api/analytics/dashboard${query}`);
}

export async function getOverview() {
  return fetchJson('/api/analytics/overview');
}
