import React from 'react';
import { roomText as rt, roomDirection } from '@/lib/room-i18n';
import { ROOM_CITIES } from '@/lib/roomCity';

// The four active cities. Values match the stored RoomListing.city field, so
// they double as the filter keys. Labels are localized via the feed.city_* keys.
const CITIES = ROOM_CITIES;

export default function RoomCityFilter({ selected, onSelect }) {
  const dir = roomDirection();
  const items = [{ value: 'all', label: rt('feed.city_all') }, ...CITIES.map(c => ({ value: c.value, label: rt('feed.city_' + c.key) }))];

  return (
    <div className="rcity-bar" dir={dir} role="group" aria-label={rt('feed.filter_cities')}>
      {items.map(it => {
        const active = selected === it.value;
        return (
          <button
            key={it.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(it.value)}
            className={'rcity-pill' + (active ? ' is-active' : '')}
          >
            <span className="rcity-name">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
