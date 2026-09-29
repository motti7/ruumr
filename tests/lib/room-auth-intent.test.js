import {beforeEach,it,expect} from 'vitest';
import {roomAuthDestination,rememberRoomAuth} from '@/lib/room-auth';
beforeEach(()=>{sessionStorage.clear();window.history.replaceState({},'','/login');});
it('publisher signup intent survives an OAuth return without requiring a partner profile',()=>{
 window.history.replaceState({},'','/login?next=AddRoom');rememberRoomAuth();window.history.replaceState({},'','/auth/callback');expect(roomAuthDestination()).toBe('/AddRoom');
});
it('switching to roommate registration clears earlier publisher intent',()=>{
 window.history.replaceState({},'','/login?next=AddRoom');rememberRoomAuth();window.history.replaceState({},'','/register?next=Partner');rememberRoomAuth();window.history.replaceState({},'','/auth/callback');expect(roomAuthDestination()).toBe('/Discover?view=people');
});
it('room conversation notification returns to that conversation after login',()=>{
 window.history.replaceState({},'','/login?next=RoomChat&offerId=abc123');rememberRoomAuth();window.history.replaceState({},'','/auth/callback');expect(roomAuthDestination()).toBe('/RoomChat?offerId=abc123');
});
it('external redirects and expired room intents are ignored',()=>{
 window.history.replaceState({},'','/login?next=https://evil.test');expect(roomAuthDestination()).toBe('/');sessionStorage.setItem('ruumr_room_auth_intent',String(Date.now()-31*60*1000));expect(roomAuthDestination()).toBe('/');
});
