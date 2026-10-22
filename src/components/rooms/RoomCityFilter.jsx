import React from 'react';
import { roomText as rt, roomDirection } from '@/lib/room-i18n';

// The four active cities. Values match the stored RoomListing.city field, so
// they double as the filter keys. Labels are localized via the feed.city_* keys.
const CITIES = [
  { value: 'תל אביב', key: 'tel_aviv' },
  { value: 'ירושלים', key: 'jerusalem' },
  { value: 'חיפה', key: 'haifa' },
  { value: 'באר שבע', key: 'beer_sheva' },
];

export default function RoomCityFilter({ selected, onSelect }) {
  const dir = roomDirection();
  const items = [{ value: 'all', label: rt('feed.city_all') }, ...CITIES.map(c => ({ value: c.value, label: rt('feed.city_' + c.key) }))];

  return (
    <div className="rcity-bar" dir={dir} role="tablist" aria-label={rt('feed.filter_cities')}>
      {items.map(it => {
        const active = selected === it.value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
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