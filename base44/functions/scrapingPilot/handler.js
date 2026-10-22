import { MODEL, instructions, extractionSchema, normalizePost, validateExtraction, bucketFor, postKey } from './logic.js';

// Pilot only: no scraping, scheduling, messaging, or publication endpoints.
export function createHandler(createClientFromRequest, getOpenAIKey, fetchProvider = fetch) {
return async req => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const client = createClientFromRequest(req);
  const user = await client.auth.me().catch(() => null);
  if (user?.role !== 'admin') return Response.json({ error: 'למנהלי האפליקציה בלבד' }, { status: 403 });
  let stage = 'input';
  try {
    const raw = await req.text();
    if (raw.length > 120000) return Response.json({ error: 'הבקשה גדולה מדי' }, { status: 413 });
    const body = JSON.parse(raw);
    const entity = client.asServiceRole.entities.ScrapingPilotPost;
    if (body.action === 'status') return Response.json({ openaiReady: Boolean(getOpenAIKey()), model: MODEL });
    if (body.action === 'list') return Response.json({ records: await entity.list('-created_date', 100) });
    if (!['analyze','save'].includes(body.action)) return Response.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
    const post = normalizePost(body.post);
    if (!post.text) return Response.json({ error: 'לא התקבל טקסט. יש לבדוק את פוסט המקור.' }, { status: 400 });
    if (body.action === 'save') {
      stage = 'save';
      const result = validateExtraction(body.result, post.text);
      const bucket = bucketFor(result);
      if (!['rooms','leads'].includes(bucket) || post.demo || !post.sourceUrl) return Response.json({ error: 'ניתן לשמור רק הצעת חדר או מחפש עם קישור מקור תקין; לא דוגמת הדגמה.' }, { status: 400 });
      const key = await postKey(post);
      const existing = await entity.filter({ source_key: key }, '-created_date', 1);
      const data = { source_key: key, source_url: post.sourceUrl, source_text: post.text, group_city: post.groupCity,
        photos_json: JSON.stringify(post.photos), phones_json: JSON.stringify(post.phones),
        posted_at_text: post.postedAt, bucket, result_json: JSON.stringify(result), review_status: 'pending',
        // Client-edited results are never represented as verified AI output.
        processing_label: 'admin_saved_review', saved_by: user.id };
      const record = existing[0] ? await entity.update(existing[0].id, data) : await entity.create(data);
      return Response.json({ id: record.id, bucket });
    }
    const provider = body.provider;
    if (!['base44','openai'].includes(provider)) return Response.json({ error: 'יש לבחור שירות AI' }, { status: 400 });
    const input = JSON.stringify({ postText: post.text, groupCityContext: post.groupCity, postedAt: post.postedAt });
    let result; let usage = null;
    stage = 'provider';
    if (provider === 'base44') {
      result = await client.integrations.Core.InvokeLLM({ prompt: `${instructions}\nUNTRUSTED POST DATA:\n${input}`,
        add_context_from_internet: false, response_json_schema: extractionSchema });
    } else {
      const key = getOpenAIKey();
      if (!key) return Response.json({ error: 'יש להגדיר OPENAI_API_KEY בסודות Base44, או לבחור AI מובנה.' }, { status: 409 });
      const response = await fetchProvider('https://api.openai.com/v1/responses', { method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, store: false, instructions, input, reasoning: { effort: 'none' }, max_output_tokens: 2200,
          text: { format: { type: 'json_schema', name: 'room_post', strict: true, schema: extractionSchema } } }),
        signal: AbortSignal.timeout(45000) });
      if (!response.ok) return Response.json({ error: `שירות OpenAI החזיר שגיאה (${response.status}). לא בוצעה הרצה חוזרת.` }, { status: 502 });
      const responseData = await response.json();
      if (responseData.status !== 'completed') return Response.json({ error: 'העיבוד לא הושלם. לא נשמרה תוצאה חלקית.' }, { status: 502 });
      const output = responseData.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
      if (!output) throw new Error('No structured output');
      result = JSON.parse(output); usage = responseData.usage;
    }
    stage = 'validation';
    validateExtraction(result, post.text, false);
    try { validateExtraction(result, post.text); } catch {
      return Response.json({ result, bucket: 'review', validationError: 'חלק מהציטוטים או הערכים לא עברו אימות מול הפוסט. זו תוצאת AI לא מאומתת; אין לשמור או לפרסם אותה.', provider, model: provider === 'openai' ? MODEL : 'Base44 managed model', usage });
    }
    return Response.json({ result, bucket: bucketFor(result), provider, model: provider === 'openai' ? MODEL : 'Base44 managed model', usage, promptVersion: 'room-pilot-v1' });
  } catch {
    // Do not expose provider response bodies, source posts, or secrets in logs.
    const messages = { provider: 'שירות ה־AI נכשל. יש לבדוק קרדיטים ולוגים של scrapingPilot ב־Base44.', validation: 'ה־AI החזיר תוצאה שלא עברה בדיקת מבנה או ציטוטי מקור. לא נשמרה תוצאה. אפשר לנסות לעבד שוב.', save: 'השמירה נכשלה. יש לבדוק שטבלת ScrapingPilotPost נפרסה בענף.', input: 'הבקשה לא תקינה או שמשאב הניסוי אינו זמין בענף.' };
    return Response.json({ error: messages[stage], stage }, { status: 500 });
  }
};
}
