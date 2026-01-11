import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Match, Profile } from '@/entities/all';
import { User } from '@/entities/User';
import { Loader2, ArrowRight } from 'lucide-react';
import RoomiCharter from '../components/charter/RoomiCharter';
import { base44 } from '@/api/base44Client';

export default function CharterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [user1Profile, setUser1Profile] = useState(null);
  const [user2Profile, setUser2Profile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [location.search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const matchId = urlParams.get('matchId');

      if (!matchId) {
        navigate(createPageUrl('Matches'));
        return;
      }

      const user = await User.me();
      setCurrentUser(user);

      const matches = await Match.filter({ id: matchId });
      if (matches.length === 0) {
        navigate(createPageUrl('Matches'));
        return;
      }

      const matchData = matches[0];
      setMatch(matchData);

      const profiles1 = await Profile.filter({ user_id: matchData.user1_id });
      const profiles2 = await Profile.filter({ user_id: matchData.user2_id });

      setUser1Profile(profiles1[0]);
      setUser2Profile(profiles2[0]);
    } catch (e) {
      console.error(e);
      navigate(createPageUrl('Matches'));
    }
    setLoading(false);
  };

  const handleComplete = async (summary, score) => {
    const { Message } = require('@/entities/all');
    const agreements = summary.filter(s => s.isMatch).map(s => `✓ ${s.title}: ${s.myChoice}`);
    const discussions = summary.filter(s => !s.isMatch).map(s => `💭 ${s.title}: ${s.compromise}`);
    
    const summaryMessage = `🎉 *סיימתם את חוזה השותפות!*\n\nציון תאימות: *${score}%*\n\n*מסכימים על:*\n${agreements.join('\n')}\n\n*נקודות לדיון:*\n${discussions.join('\n')}`;
    
    try {
      await Message.create({
        match_id: match.id,
        sender_id: 'system',
        content: summaryMessage,
        is_read: false
      });
    } catch (e) {
      console.error("Failed to create summary message:", e);
    }
    
    navigate(createPageUrl('Chat') + `?matchId=${match.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (!match || !user1Profile || !user2Profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p>לא נמצאה התאמה</p>
      </div>
    );
  }

  return (
    <RoomiCharter
      matchId={match.id}
      user1Name={user1Profile.name}
      user2Name={user2Profile.name}
      onClose={() => navigate(createPageUrl('Matches'))}
      onComplete={handleComplete}
    />
  );
}