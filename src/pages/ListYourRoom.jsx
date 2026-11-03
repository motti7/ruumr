import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home, Image as ImageIcon, UserRound } from 'lucide-react';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { useOptionalAuth } from '@/lib/AuthContext';
import { roomText as rt, roomDirection, useRoomLocale } from '@/lib/room-i18n';
import '@/components/rooms/rooms.css';

// Public landing page for room publishers. People who arrive from an external
// link can publish a room with a publisher account only — no roommate profile
// and no personal photo — even while the rooms feed itself is still closed.
export default function ListYourRoom() {
  useRoomLocale();
  const [params] = useSearchParams();
  const { isAuthenticated } = useOptionalAuth();
  const published = params.get('published') === '1';
  const startHref = isAuthenticated ? '/AddRoom' : '/register?next=AddRoom';

  const steps = [
    { icon: UserRound, title: 'חשבון מפרסם', body: 'נרשמים עם אימייל וסיסמה, וממלאים שם מפרסם. זה כל מה שצריך.' },
    { icon: ImageIcon, title: 'פרטי החדר', body: 'עיר, מחיר חודשי, תאריך כניסה, תמונות ותיאור קצר.' },
    { icon: Home, title: 'המודעה עולה לאוויר', body: 'אפשר לעדכן או לסגור את המודעה בכל רגע מניהול המודעות.' },
  ];

  return (
    <div dir={roomDirection()} className="min-h-[100dvh] bg-white dark:bg-gray-900">
      <header className="flex items-center justify-between px-5 pt-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
        <Link to="/" aria-label="Ruumr">
          <img src="/ruumr-wordmark.svg" alt="Ruumr" className="h-6 w-auto dark:invert" />
        </Link>
        <LanguageToggle />
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-16">
        {published ? (
          <section className="pt-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/30">
              <CheckCircle2 className="h-9 w-9 text-[--theme-orange]" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{rt('החדר שלכם פורסם')}</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{rt('המודעה נשמרה בחשבון המפרסם שלכם.')}</p>
            <Link
              to="/AddRoom"
              className="mt-7 flex min-h-[48px] items-center justify-center rounded-full gradient-orange font-bold text-white shadow-lg"
            >
              {rt('hub.add_another')}
            </Link>
            <Link to="/RoomAccount" className="mt-3 block py-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
              {rt('hub.my_rooms')}
            </Link>
          </section>
        ) : (
          <>
            <h1 className="pt-10 text-3xl font-extrabold leading-tight text-gray-900 dark:text-white">
              {rt('פרסמו חדר בכמה דקות')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {rt('בלי פרופיל שותף ובלי תמונה אישית. ממלאים פרטי חדר, מעלים תמונות, והמודעה עולה לאוויר.')}
            </p>

            <Link
              to={startHref}
              className="mt-7 flex min-h-[48px] items-center justify-center rounded-full gradient-orange font-bold text-white shadow-lg"
            >
              {rt(isAuthenticated ? 'hub.continue_room' : 'יצירת חשבון מפרסם')}
            </Link>
            {!isAuthenticated && (
              <Link to="/login?next=AddRoom" className="mt-3 block py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                {rt('כבר יש חשבון? התחברות')}
              </Link>
            )}

            <ul className="mt-8 space-y-4">
              {steps.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/30">
                    <Icon className="h-5 w-5 text-[--theme-orange]" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">{rt(title)}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{rt(body)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <section className="mt-6 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{rt('אנחנו אוספים מודעות חדרים עכשיו')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {rt('פיד החדרים ייפתח בקרוב, ונודיע למפרסמים ברגע שהוא באוויר.')}
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}