import React from 'react';
import {beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
const state=vi.hoisted(()=>({auth:{hasProfile:false},hub:vi.fn(),request:vi.fn(),upload:vi.fn()}));
vi.mock('@/lib/AuthContext',()=>({useOptionalAuth:()=>state.auth}));
vi.mock('@/api/roomHub',()=>({roomHub:state.hub}));
vi.mock('@/api/base44Client',()=>({base44:{integrations:{Core:{UploadFile:state.upload}}}}));
vi.mock('@/components/rooms/RoomListings',()=>({roomRequest:state.request}));
vi.mock('@/hooks/useTypewriterPlaceholder',()=>({useTypewriterPlaceholder:()=>''}));
import RoomAccount from '@/pages/RoomAccount';
import AddRoom from '@/pages/AddRoom';
import RoommateAccess from '@/components/rooms/RoommateAccess';
import i18n from '@/i18n';
beforeEach(async()=>{cleanup();vi.clearAllMocks();state.auth={hasProfile:false};await i18n.changeLanguage('en');});
it.each([false,true])('publisher signup continues to room form with roommate profile=%s',async(hasProfile)=>{
 let publisher=null;state.hub.mockImplementation(async(action,data)=>{if(action==='publisher'){publisher=data;return {ok:true};}return {publisher,has_profile:hasProfile,rooms:[]};});
 render(<MemoryRouter initialEntries={['/AddRoom']}><Routes><Route path="/AddRoom" element={<AddRoom/>}/><Route path="/RoomAccount" element={<RoomAccount/>}/></Routes></MemoryRouter>);
 const name=await screen.findByRole('textbox',{name:'Display name'});await waitFor(()=>expect(name).toBeEnabled());
 fireEvent.change(name,{target:{value:'Alex'}});fireEvent.click(screen.getByRole('button',{name:'Save and add room details'}));
 await waitFor(()=>expect(screen.getByRole('heading',{name:'Add a room'})).toBeInTheDocument());
 expect(state.hub).toHaveBeenCalledWith('publisher',{display_name:'Alex',photo:'',publisher_type:'owner'});
 expect(screen.queryByRole('textbox',{name:'Display name'})).not.toBeInTheDocument();
 state.upload.mockResolvedValue({file_url:'https://example.test/room.jpg'});state.request.mockResolvedValue({id:'room'});
 fireEvent.change(screen.getByLabelText('Listing title'),{target:{value:'Bright room'}});
 fireEvent.change(screen.getByLabelText('City'),{target:{value:'חיפה'}});
 fireEvent.change(screen.getByLabelText('Street / neighborhood'),{target:{value:'Central'}});
 fireEvent.change(screen.getByLabelText('Monthly room rent (₪)'),{target:{value:'2000'}});
 fireEvent.change(screen.getByLabelText('Move-in date'),{target:{value:'2026-12-01'}});
 fireEvent.change(screen.getByLabelText('Contact phone (shown in the listing)'),{target:{value:'0500000000'}});
 fireEvent.change(screen.getByLabelText('More about the room and apartment'),{target:{value:'A quiet shared apartment'}});
 fireEvent.change(screen.getByLabelText('Room and apartment photos — required'),{target:{files:[new File(['image'],'room.jpg',{type:'image/jpeg'})]}});
 await waitFor(()=>expect(screen.getByRole('button',{name:'Publish room'})).toBeEnabled());
 fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Publish room'}));
 await waitFor(()=>expect(state.request).toHaveBeenCalledWith(expect.objectContaining({action:'create',room:expect.objectContaining({title:'Bright room',phone:'0500000000',photos:['https://example.test/room.jpg'],owner_confirmation:true})})));

});
it('failed publisher save stays in form and translates the displayed error without reload',async()=>{
 state.hub.mockImplementation(async action=>{if(action==='publisher')throw new Error('network');return {publisher:null,has_profile:false,rooms:[]};});
 render(<MemoryRouter initialEntries={['/RoomAccount?next=AddRoom']}><RoomAccount/></MemoryRouter>);
 const name=screen.getByRole('textbox',{name:'Display name'});await waitFor(()=>expect(name).toBeEnabled());fireEvent.change(name,{target:{value:'Alex'}});
 fireEvent.click(screen.getByRole('button',{name:'Save and add room details'}));expect(await screen.findByRole('alert')).toHaveTextContent('This action could not be completed.');
 await act(async()=>{await i18n.changeLanguage('he');});expect(screen.getByRole('alert')).not.toHaveTextContent('This action');expect(screen.getByRole('alert').closest('section')).toHaveAttribute('dir','rtl');
});
it('publisher-only and unresolved accounts never mount the roommate deck; dual profiles do',()=>{
 const deck=vi.fn(()=> <div>roommate deck</div>);const Deck=deck;
 const view=render(<MemoryRouter><RoommateAccess><Deck/></RoommateAccess></MemoryRouter>);
 expect(deck).not.toHaveBeenCalled();expect(screen.getByText(/Only users with a roommate profile/)).toBeInTheDocument();
 state.auth.hasProfile=null;view.rerender(<MemoryRouter><RoommateAccess><Deck/></RoommateAccess></MemoryRouter>);expect(deck).not.toHaveBeenCalled();expect(screen.getByRole('status')).toBeInTheDocument();
 state.auth.hasProfile=true;view.rerender(<MemoryRouter><RoommateAccess><Deck/></RoommateAccess></MemoryRouter>);expect(screen.getByText('roommate deck')).toBeInTheDocument();
});

