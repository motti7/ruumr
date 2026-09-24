import { base44 } from '@/api/base44Client';

export async function safetyRequest(action, payload = {}) {
  const response = await base44.functions.invoke('userSafety', { ...payload, action });
  if (!response?.data || response.data.error) throw new Error(response?.data?.error || 'Request failed');
  return response.data;
}

export async function blockedUserIds() {
  const data = await safetyRequest('blocked_users');
  if (!Array.isArray(data.user_ids)) throw new Error('Invalid safety response');
  return new Set(data.user_ids);
}

