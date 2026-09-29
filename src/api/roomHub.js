import {base44} from '@/api/base44Client';
export async function roomHub(action,data={}){
 const response=await base44.functions.invoke('roomHub',{action,...data});
 if(response.data?.error)throw new Error(response.data.error);
 return response.data;
}
