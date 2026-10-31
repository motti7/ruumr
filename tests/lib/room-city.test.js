import {describe,it,expect} from 'vitest';
import {parseRoomCity,roomCityParams,ROOM_CITIES} from '../../src/lib/roomCity';
describe('room city links',()=>{
 it('accepts landing links and stored Hebrew city names',()=>{
  for(const city of ROOM_CITIES){expect(parseRoomCity(city.slug)).toBe(city.value);expect(parseRoomCity(city.value)).toBe(city.value);}
 });
 it('falls back safely for missing or unsupported cities',()=>{
  for(const value of [null,'','dublin','<script>'])expect(parseRoomCity(value)).toBe('all');
 });
 it('changes only the city and leaves the source URL untouched',()=>{
  const original=new URLSearchParams('view=rooms&room=123&city=haifa');
  const next=roomCityParams(original,'תל אביב');
  expect(next.get('city')).toBe('tel-aviv');expect(next.get('view')).toBe('rooms');expect(next.get('room')).toBe('123');expect(original.get('city')).toBe('haifa');
  expect(roomCityParams(next,'all').has('city')).toBe(false);
 });
});
