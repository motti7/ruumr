import { base44 } from './base44Client';
export async function profileBoosts(action, extra = {}) {
 const response = await base44.functions.invoke('profileBoosts', { action, ...extra });
 const data = response?.data ?? response;
 if (data?.error) throw Object.assign(new Error(data.error), { code: data.error });
 return data;
}
