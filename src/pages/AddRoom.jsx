import React, {useEffect,useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {roomRequest} from '@/components/rooms/RoomListings';
import {useTypewriterPlaceholder} from '@/hooks/useTypewriterPlaceholder';
import '@/components/rooms/rooms.css';

export default function AddRoom(){
  useEffect(()=>{try{sessionStorage.removeItem('ruumr_room_auth_intent');}catch{/* optional */}},[]);
  const navigate=useNavigate(),lock=useRef(false);
  const [room,setRoom]=useState({title:'',city:'',address:'',price:'',entry_date:'',end_date:'',rental_type:'regular',roommates:'0',furniture:'',description:'',phone:'',photos:[],owner_confirmation:false});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[uploading,setUploading]=useState(false);
  const set=(key,value)=>setRoom(old=>({...old,[key]:value}));
  const titlePlaceholder=useTypewriterPlaceholder(!room.title);
  async function upload(event){
    const files=Array.from(event.target.files||[]);event.target.value='';
    if(!files.length)return;
    if(files.length+room.photos.length>8||files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>8*1024*1024)){setError('אפשר להעלות עד 8 תמונות JPG, PNG או WebP, עד 8MB לתמונה.');return;}
    setUploading(true);setError('');
    try{for(const file of files){const {file_url}=await base44.integrations.Core.UploadFile({file});if(!file_url)throw new Error('העלאת התמונה לא הושלמה.');setRoom(old=>({...old,photos:[...old.photos,file_url]}));}}
    catch{setError('חלק מהתמונות לא הועלו. התמונות שכבר מופיעות נשמרו בטופס; נסה להעלות רק את החסרות.');}finally{setUploading(false);}
  }
  async function submit(e){e.preventDefault();if(lock.current||uploading)return;lock.current=true;setBusy(true);setError('');
    try{await roomRequest({action:'create',room});navigate('/Discover?view=rooms&roomAdded=1');}
    catch(e){setError(e.response?.data?.error||e.message||'הפרסום נכשל.');}finally{lock.current=false;setBusy(false);}
  }
  const input=(key,label,type='text',extra={})=><label>{label}<input required name={key} type={type} value={room[key]} onChange={e=>set(key,e.target.value)} {...extra}/></label>;
  return <section className="rr" dir="rtl"><Link to="/Discover?view=rooms">← חזרה לחדרים</Link><h1>הוספת חדר</h1><p>מפרסמים חדר בדירת שותפים. אין צורך ליצור פרופיל שותף או להעלות תמונה אישית.</p>
    <form onSubmit={submit}><fieldset disabled={busy||uploading}><div className="rr-grid">
      <label>כותרת המודעה<input required name="title" type="text" maxLength={100} value={room.title} onChange={e=>set('title',e.target.value)} placeholder={titlePlaceholder}/></label>
      <label>עיר<select required value={room.city} onChange={e=>set('city',e.target.value)}><option value="">בחירת עיר</option>{['תל אביב','ירושלים','חיפה','באר שבע'].map(c=><option key={c}>{c}</option>)}</select></label>
      {input('address','רחוב / שכונה','text',{maxLength:160})}{input('price','מחיר חודשי לחדר (₪)','number',{min:1,max:100000,step:1})}
      <label>סוג שכירות<select value={room.rental_type} onChange={e=>set('rental_type',e.target.value)}><option value="regular">שכירות רגילה</option><option value="sublet">סאבלט</option></select></label>
      {input('entry_date','תאריך כניסה','date')}{room.rental_type==='sublet'&&input('end_date','תאריך סיום הסאבלט','date',{min:room.entry_date})}
      {input('roommates','כמה שותפים כבר גרים בדירה?','number',{min:0,max:30})}{input('phone','טלפון לפנייה (יוצג במודעה)','tel',{maxLength:30,dir:'ltr'})}
      <label>ריהוט בחדר<input value={room.furniture} maxLength={200} onChange={e=>set('furniture',e.target.value)} placeholder="למשל: מיטה וארון"/></label>
    </div><label>עוד פרטים על החדר והדירה<textarea required maxLength={3000} rows={5} value={room.description} onChange={e=>set('description',e.target.value)} placeholder="חשבונות, תנאי שכירות, שבת וכשרות אם רלוונטי, ומה עוד כדאי לדעת"/></label>
    <label>תמונות החדר והדירה — חובה<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload}/></label>
    <div className="rr-photos">{room.photos.map((url,i)=><div key={url}><img src={url} alt={'תמונת החדר '+(i+1)}/><button type="button" onClick={()=>set('photos',room.photos.filter((_,j)=>j!==i))}>הסרת תמונה {i+1}</button></div>)}</div>
    <label className="rr-confirm"><input type="checkbox" required checked={room.owner_confirmation} onChange={e=>set('owner_confirmation',e.target.checked)}/>אני בעל הדירה או מורשה לפרסם אותה, ומאשר להציג את התמונות ופרטי הקשר במודעה.</label>
    <button className="rr-primary" type="submit" disabled={!room.photos.length}>פרסום החדר</button></fieldset>
    {uploading&&<p role="status">מעלה תמונות…</p>}{busy&&<p role="status">מפרסם את החדר…</p>}{error&&<p role="alert" className="rr-error">{error}</p>}</form>
  </section>;
}