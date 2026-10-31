import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,act} from '@testing-library/react';
import {createMemoryRouter,RouterProvider} from 'react-router-dom';
import i18n from '@/i18n';
vi.mock('@/lib/AuthContext',()=>({useAuth:()=>({isAuthenticated:false,hasProfile:false})}));
vi.mock('@/api/roomHub',()=>({roomHub:vi.fn()}));
vi.mock('@/api/base44Client',()=>({base44:{functions:{invoke:vi.fn(async()=>({data:{records:[{id:'ta',title:'Tel Aviv room',city:'תל אביב'},{id:'haifa',title:'Haifa room',city:'חיפה'}]}}))}}}));
vi.mock('@/components/rooms/RoomFeedCard',()=>({default:({room})=><article>{room.title}</article>}));
import RoomListings from '@/components/rooms/RoomListings';

it('filters direct city links, follows back navigation and preserves selection across languages',async()=>{
 await i18n.changeLanguage('en');
 const router=createMemoryRouter([{path:'/Rooms',element:<RoomListings/>}],{initialEntries:['/Rooms?city=tel-aviv']});
 render(<RouterProvider router={router}/>);
 expect(await screen.findByText('Tel Aviv room')).toBeInTheDocument();
 expect(screen.queryByText('Haifa room')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Haifa',exact:true}));
 expect(await screen.findByText('Haifa room')).toBeInTheDocument();
 expect(router.state.location.search).toBe('?city=haifa');
 await act(async()=>{await router.navigate(-1);});
 expect(await screen.findByText('Tel Aviv room')).toBeInTheDocument();
 await act(async()=>{await i18n.changeLanguage('he');});
 expect(screen.getByRole('button',{name:'תל אביב',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(screen.queryByText('Haifa room')).not.toBeInTheDocument();
});
