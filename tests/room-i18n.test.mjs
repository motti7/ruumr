import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import i18next from 'i18next';
import {parse} from '@babel/parser';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const en=JSON.parse(read('src/locales/en/rooms.json'));
const he=JSON.parse(read('src/locales/he/rooms.json'));
test('room translations cover both languages and preserve interpolation variables',()=>{
  assert.deepEqual(Object.keys(en).sort(),Object.keys(he).sort());
  for(const key of Object.keys(en)){
    assert.ok(en[key].trim(),key);
    assert.deepEqual(en[key].match(/{{.*?}}/g),he[key].match(/{{.*?}}/g),key);
  }
});
test('changing language updates room labels, existing feedback, dates and direction',async()=>{
  const i18n=i18next.createInstance();
  await i18n.init({lng:'he',fallbackLng:'he',resources:{he:{rooms:he},en:{rooms:en}},interpolation:{escapeValue:false}});
  const source=read('src/lib/room-i18n.js').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
  const {roomText,roomDirection,roomDate}=new Function('i18n','useTranslation','en',source+';return {roomText,roomDirection,roomDate};')(i18n,()=>({i18n}),en);
  const storedError=roomText('הסרת המודעה מהתצוגה נכשלה. נסה שוב.');
  assert.equal(roomDirection(),'rtl');
  await i18n.changeLanguage('en');
  assert.equal(roomDirection(),'ltr');
  assert.equal(roomText('חדרים'),en['חדרים']);
  assert.equal(roomText(storedError),en['הסרת המודעה מהתצוגה נכשלה. נסה שוב.']);
  assert.equal(roomText({key:'loadedPosts',count:3}),en.loadedPosts.replace('{{count}}','3'));
  assert.equal(roomDate('2026-10-03'),'03/10/2026');
  const englishError=roomText(storedError);
  await i18n.changeLanguage('he');
  assert.equal(roomText(englishError),storedError);
});
test('new room screens have translations for every literal translation call',()=>{
  const files=['src/pages/AddRoom.jsx','src/pages/Rooms.jsx','src/pages/ScrapingPilot.jsx','src/components/rooms/RoomListings.jsx','src/components/scrapingPilot/Workspace.jsx'];
  const visit=node=>{
    if(!node||typeof node!=='object')return;
    if(node.type==='CallExpression'&&node.callee?.name==='rt'&&node.arguments[0]?.type==='StringLiteral'){
      assert.ok(Object.hasOwn(en,node.arguments[0].value.trim()),node.arguments[0].value);
    }
    if(node.type==='JSXText')assert.ok(!/[\u0590-\u05ff]/.test(node.value),'Untranslated JSX: '+node.value);
    for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
  };
  files.forEach(file=>visit(parse(read(file),{sourceType:'module',plugins:['jsx']})));
});
