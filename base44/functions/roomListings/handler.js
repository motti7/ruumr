const cities = ['תל אביב','ירושלים','חיפה','באר שבע'];
export function validateRoom(body) {
  const text = (key,max,required=true) => {
    const value=typeof body[key]==='string'?body[key].trim():'';
    if((required&&!value)||value.length>max)throw new Error('יש להשלים את פרטי החדר באורך המתאים.');
    return value;
  };
  const phone=text('phone',30).replace(/[\s()-]/g,'').replace(/^\+972/,'0');
  const price=Number(body.price), roommates=Number(body.roommates);
  const entry=text('entry_date',10), end=text('end_date',10,false);
  const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!cities.includes(body.city)||!['regular','sublet'].includes(body.rental_type))throw new Error('יש לבחור עיר וסוג שכירות.');
  if(!Number.isFinite(price)||price<1||price>100000||!Number.isInteger(roommates)||roommates<0||roommates>30)throw new Error('יש להזין מחיר ומספר שותפים תקינים.');
  if(!/^0(?:5\d|7\d|[23489])\d{7}$/.test(phone))throw new Error('יש להזין מספר טלפון ישראלי תקין.');
  if(!date(entry)||(body.rental_type==='sublet'&&(!date(end)||end<=entry)))throw new Error('יש לבחור תאריכים תקינים; בסאבלט תאריך הסיום חייב להיות אחרי הכניסה.');
  if(!Array.isArray(body.photos)||body.photos.length<1||body.photos.length>8||body.photos.some(p=>{try{const u=new URL(p);return typeof p!=='string'||p.length>3000||u.protocol!=='https:'||!!u.username||!!u.password;}catch{return true;}}))throw new Error('נדרשת לפחות תמונה אחת, ועד 8 תמונות.');
  if(body.owner_confirmation!==true)throw new Error('יש לאשר הרשאה לפרסום החדר ופרטי הקשר.');
  return {title:text('title',100),city:body.city,address:text('address',160),price,roommates,entry_date:entry,end_date:body.rental_type==='sublet'?end:'',rental_type:body.rental_type,furniture:text('furniture',200,false),description:text('description',3000),phone,photos:[...new Set(body.photos)]};
}
export function createHandler(createClient) { return async req=>{
  if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
  try {
    const client=createClient(req), user=await client.auth.me().catch(()=>null);
    const sr=client.asServiceRole.entities;
    if(user && (await sr.BannedUser.filter({email:user.email},'-created_date',1)).length)return Response.json({error:'החשבון אינו רשאי לבצע פעולה זו.'},{status:403});
    const raw=await req.text();if(raw.length>40000)return Response.json({error:'הבקשה גדולה מדי.'},{status:413});
    const body=JSON.parse(raw), entity=sr.RoomListing;
    if(body.action!=='list'&&!user)return Response.json({error:'יש להתחבר כדי להמשיך.'},{status:401});
    if(body.action==='create'){
      let data;try{data=validateRoom(body.room||{});}catch(e){return Response.json({error:e.message},{status:400});}
      const record=await entity.create({...data,owner_id:user.id,status:'published'});
      return Response.json({id:record.id});
    }
    if(body.action==='close'){
      let rec;try{rec=await entity.get(body.id);}catch{return Response.json({error:'המודעה לא נמצאה בחשבון שלך.'},{status:404});}
      if(!rec||rec.owner_id!==user.id)return Response.json({error:'המודעה לא נמצאה בחשבון שלך.'},{status:404});
      await entity.update(body.id,{status:'closed'});return Response.json({ok:true});
    }
    if(body.action==='list'){
      const records=await entity.filter({status:'published'},'-created_date',100);
      const [outgoing,incoming]=user ? await Promise.all([sr.UserBlock.filter({blocker_id:user.id}),sr.UserBlock.filter({blocked_id:user.id})]) : [[],[]];
      const blocked=new Set([...outgoing.map(r=>r.blocked_id),...incoming.map(r=>r.blocker_id)]);
      return Response.json({records:records.filter(r=>!blocked.has(r.owner_id)).map(r=>{
        const fields=['id','title','city','address','price','entry_date','end_date','rental_type','roommates','furniture','description','phone','photos'];
        return {...Object.fromEntries(fields.filter(k=>r[k]!==undefined).map(k=>[k,r[k]])),is_owner:!!user && r.owner_id===user.id};
      })});
    }
    return Response.json({error:'פעולה לא מוכרת.'},{status:400});
  }catch{return Response.json({error:'לא ניתן להשלים את הפעולה. נסה שוב; אם הבעיה נמשכת יש לבדוק ש־roomListings ו־RoomListing נפרסו ב־Base44.'},{status:500});}
}; }