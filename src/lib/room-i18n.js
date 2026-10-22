import i18n from '@/i18n';
import {useTranslation} from 'react-i18next';
import en from '@/locales/en/rooms.json';

// UI messages may already be in state when the user switches languages.
// Resolve either supported wording back to its resource key before rendering.
const sourceKeys = new Map(Object.entries(en).map(([key,value])=>[value,key]));
export function roomText(value, options = {}) {
  if (value && typeof value === 'object' && value.key) return i18n.t(value.key,{ns:'rooms',...value});
  if (typeof value !== 'string' || !value.trim()) return value;
  const apiError=value.match(/^שירות OpenAI החזיר שגיאה \((\d+)\). לא בוצעה הרצה חוזרת\.$/);
  if(apiError)return i18n.t('openaiError',{ns:'rooms',status:apiError[1]});
  const trimmed=value.trim();
  const key=sourceKeys.get(trimmed)||trimmed;
  const text=i18n.t(key,{ns:'rooms',keySeparator:false,nsSeparator:false,defaultValue:trimmed,...options});
  return value.slice(0,value.indexOf(trimmed))+text+value.slice(value.indexOf(trimmed)+trimmed.length);
}
export function roomDirection(){return i18n.dir();}
export function roomLocale(){return i18n.resolvedLanguage==='he'?'he-IL':'en-GB';}
export function useRoomLocale(){const {i18n}=useTranslation('rooms');return i18n.resolvedLanguage||i18n.language;}
export function roomDate(value){
  if(!value)return '';
  const date=new Date(value.length===10?value+'T12:00:00':value);
  return Number.isNaN(date.getTime())?value:date.toLocaleDateString(roomLocale());
}
