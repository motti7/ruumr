import React from 'react';
import {beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const state=vi.hoisted(()=>({auth:{isAuthenticated:false,hasProfile:false},hub:vi.fn()}));
vi.mock('@/lib/AuthContext',()=>({useAuth:()=>state.auth}));
vi.mock('@/api/roomHub',()=>({roomHub:state.hub}));
import SaveRoomButton from '@/components/rooms/SaveRoomButton';
import SavedRooms from '@/pages/SavedRooms';
import i18n from '@/i18n';
beforeEach(async()=>{cleanup();state.hub.mockReset();state.auth={isAuthenticated:false,hasProfile:false};await i18n.changeLanguage('en');});
it('guest save shows partner signup and login, without writing data',()=>{
 render(<MemoryRouter><SaveRoomButton roomId="room"/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Save room'}));
 expect(screen.getByRole('link',{name:'Create roommate account'})).toHaveAttribute('href','/register?next=Partner');
 expect(screen.getByRole('link',{name:'Already registered? Sign in'})).toHaveAttribute('href','/login?next=Partner');
 expect(state.hub).not.toHaveBeenCalled();
});
it('publisher-only account completes a roommate profile in the same account',()=>{
 state.auth={isAuthenticated:true,hasProfile:false};render(<MemoryRouter><SaveRoomButton roomId="room"/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Save room'}));
 expect(screen.getByRole('link',{name:'Complete roommate profile'})).toHaveAttribute('href','/Onboarding');
 expect(state.hub).not.toHaveBeenCalled();
});
it('partner saves and removes a room with the current language preserved',async()=>{
 state.auth={isAuthenticated:true,hasProfile:true};state.hub.mockResolvedValue({ok:true});render(<MemoryRouter><SaveRoomButton roomId="room"/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Save room'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Saved'})).toHaveAttribute('aria-pressed','true'));
 await i18n.changeLanguage('he');await waitFor(()=>expect(screen.getByRole('button',{name:'נשמר'})).toBeInTheDocument());
 fireEvent.click(screen.getByRole('button',{name:'נשמר'}));await waitFor(()=>expect(state.hub).toHaveBeenLastCalledWith('save',{room_id:'room',saved:false}));
});
it('a closed saved room remains identifiable and is not linked as available',async()=>{
 state.auth={isAuthenticated:true,hasProfile:true};state.hub.mockResolvedValue({records:[{id:'old',title:'Original room',city:'חיפה',price:2000,status:'closed'}]});
 render(<MemoryRouter><SavedRooms/></MemoryRouter>);expect(await screen.findByText('Original room')).toBeInTheDocument();expect(screen.getByText('Rented / unavailable')).toBeInTheDocument();expect(screen.queryByRole('link',{name:'View room'})).not.toBeInTheDocument();
});
