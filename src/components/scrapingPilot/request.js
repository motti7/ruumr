export async function pilotRequest(invoke, body, timeoutMs = 90000) {
  let timer;
  try {
    const response = await Promise.race([
      invoke('scrapingPilot', body),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('לא התקבלה תשובה בזמן. ייתכן שהשרת עדיין מעבד; לא בוצע ניסיון חוזר אוטומטי. יש לבדוק את הרצת scrapingPilot ב־Base44 לפני ניסיון נוסף.')), timeoutMs); }),
    ]);
    const data = response?.data;
    if (data?.error) throw new Error(data.error);
    if (!data || (body.action === 'analyze' && (!data.result || !data.bucket))) throw new Error('השרת החזיר תשובה ללא תוצאת עיבוד. יש לבדוק את פריסת scrapingPilot בענף.');
    return data;
  } finally { clearTimeout(timer); }
}
