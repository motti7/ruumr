import {base44} from '@/api/base44Client';
export async function roomHub(action,data={}){
 const readOnly=['account','inbox','saved','candidates','conversation'].includes(action);
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await base44.functions.invoke('roomHub',{action,...data});
   if(response.data?.error)throw new Error(response.data.error);
   return response.data;
  }catch(error){
   const status=error?.response?.status??error?.status;
   if(!readOnly||status!==429||attempt===1)throw error;
   await new Promise(resolve=>setTimeout(resolve,2000));
  }
 }
}
