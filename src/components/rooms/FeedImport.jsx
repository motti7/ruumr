import React,{useState,useRef} from 'react';
import {base44} from '@/api/base44Client';
import {roomText as rt,useRoomLocale,roomLocale} from '@/lib/room-i18n';
export default function FeedImport({onComplete}){
 useRoomLocale();const [posts,setPosts]=useState([]),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');const stop=useRef(false);
 async function load(e){setError('');setResults([]);setPosts([]);try{const f=e.target.files[0];if(!f)return;if(f.size>2000000)throw Error();const rows=JSON.parse(await f.text());if(!Array.isArray(rows)||rows.length>60)throw Error();setPosts(rows);}catch{setError('feed.file_error');}}
 function pasteJson(value){setError('');setResults([]);try{if(value.length>2000000)throw Error();const rows=JSON.parse(value);if(!Array.isArray(rows)||rows.length>60)throw Error();setPosts(rows);}catch{setPosts([]);setError('feed.file_error');}}
 async function run(){setBusy(true);stop.current=false;setResults([]);const seen=new Set();
 try{for(let index=0;index<posts.length&&!stop.current;index++){
 const p=posts[index];const text=String(p.sourceUrl||p.url||''); // Reposts with different URLs must reach the server to refresh publication time.
 let result;
 if(text&&seen.has(text))result={status:'duplicate'};else{
 try{const response=await base44.functions.invoke('importRoomPost',{post:p});result=response.data;if(result.error)result={status:'error',reason:result.error};else if(result.status!=='error')seen.add(text);}
 catch(e){result={status:'error',reason:e.response?.data?.error||'feed.processing_failed'};}
 }
 setResults(old=>[...old,{...result,index}]);if(result.status==='published')onComplete?.();
 }}finally{setBusy(false);onComplete?.();}
 }
 const num=n=>n.toLocaleString(roomLocale());
 return <details className="rf-import"><summary>{rt('feed.import_title')}</summary><p>{rt('feed.import_hint')}</p><label>{rt('feed.file')}<input type="file" accept=".json,application/json" disabled={busy} onChange={load}/></label>
 <label>{rt('feed.paste')}<textarea disabled={busy} onChange={e=>pasteJson(e.target.value)} rows={3}/></label>{posts.length>0&&<p>{rt('feed.ready',{count:num(posts.length)})}</p>}<button className="rr-primary" disabled={busy||!posts.length} onClick={run}>{rt('feed.start')}</button>{busy&&<button onClick={()=>{stop.current=true;}}>{rt('feed.stop')}</button>}
 <p role="status">{rt('feed.progress',{done:num(results.length),total:num(posts.length)})}</p>{error&&<p role="alert">{rt(error)}</p>}
 <ol>{results.map(x=><li key={x.index}>{rt('feed.import_result',{number:num(x.index+1),status:rt('feed.'+x.status)})}{x.reason?' — '+rt(x.reason):''}</li>)}</ol></details>;
}