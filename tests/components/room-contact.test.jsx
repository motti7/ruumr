import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,screen,act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import i18n from '@/i18n';
const auth=vi.hoisted(()=>({isAuthenticated:false}));
vi.mock('@/lib/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('@/components/rooms/RoomWhatsAppButton',()=>({default:()=> <button>WhatsApp</button>}));
import RoomContactActions from '@/components/rooms/RoomContactActions';

it('never renders cached phone or WhatsApp action for a guest, and translates the prompt live',async()=>{
 auth.isAuthenticated=false;
 await i18n.changeLanguage('en');
 const {container,rerender}=render(<MemoryRouter><RoomContactActions room={{id:'room-1',phone:'0500000000'}}/></MemoryRouter>);
 expect(container.textContent).not.toContain('0500000000');
 expect(container.querySelector('a[href^="tel:"]')).toBeNull();
 expect(screen.queryByRole('button',{name:'WhatsApp'})).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Sign in to see the number'})).toHaveAttribute('href','/login?next=RoomContact&roomId=room-1');
 await act(async()=>{await i18n.changeLanguage('he');});
 expect(screen.getByRole('link',{name:'התחברות לצפייה במספר'})).toBeInTheDocument();
 auth.isAuthenticated=true;
 rerender(<MemoryRouter><RoomContactActions room={{id:'room-1',phone:'0500000000'}}/></MemoryRouter>);
 expect(container.querySelector('a[href="tel:0500000000"]')).not.toBeNull();
 expect(screen.getByRole('button',{name:'WhatsApp'})).toBeInTheDocument();
});
