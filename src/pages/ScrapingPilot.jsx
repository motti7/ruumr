import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Workspace from '@/components/scrapingPilot/Workspace';
import { pilotRequest } from '@/components/scrapingPilot/request';

async function invoke(body) {
  return pilotRequest((name, data) => base44.functions.invoke(name, data), body);
}
export default function ScrapingPilot({ embedded = false }) {
  const [access,setAccess] = useState('loading');
  const [openaiReady,setOpenaiReady] = useState(false);
  const [serviceWarning,setServiceWarning] = useState('');
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      const me=await base44.auth.me().catch(()=>null);
      if(cancelled)return;
      if(me?.role!=='admin'){setAccess('denied');return;}
      setAccess('admin');
      try{const status=await invoke({action:'status'});if(!cancelled)setOpenaiReady(status.openaiReady);}
      catch{if(!cancelled)setServiceWarning('המסך מוכן; פונקציית העיבוד טרם זמינה בענף. יש לבדוק בצ׳אט Base44 ש־scrapingPilot נפרסה.');}
    })();
    return()=>{cancelled=true;};
  },[]);
  if(access!=='admin')return <div dir="rtl" style={{padding:40,textAlign:'center'}}>{access==='loading'?'טוען חדרים…':embedded?'אנחנו מכינים כאן את החדרים החדשים. תצוגת הניסוי הגולמית זמינה כרגע למנהל האפליקציה.':'מעבדת המודעות זמינה למנהל האפליקציה בלבד.'}</div>;
  return <>{serviceWarning&&<p role="status" dir="rtl" style={{padding:16,margin:0,background:'#fff2d5'}}>{serviceWarning}</p>}<Workspace invoke={invoke} openaiReady={openaiReady} embedded={embedded}/></>;
}
