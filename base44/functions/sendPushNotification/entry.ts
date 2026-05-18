import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function requireCurrentUser(base44) {
    try {
        const user = await base44.auth.me();
        if (!user?.id) {
            throw new Error('Missing authenticated user');
        }
        return user;
    } catch (_) {
        return null;
    }
}

function isAdmin(user) {
    return user?.role === 'admin';
}

function sameId(left, right) {
    return String(left || '') === String(right || '');
}

function isMatchParticipant(match, userId) {
    return sameId(match?.user1_id, userId) || sameId(match?.user2_id, userId);
}

function getMatchId(data = {}) {
    return data.match_id || data.matchId || null;
}

async function findMatch(sr, matchId) {
    if (!matchId) {
        return null;
    }
    const matches = await sr.Match.filter({ id: matchId });
    return matches?.[0] || null;
}

async function getProfileName(sr, userId) {
    const profiles = await sr.Profile.filter({ user_id: userId });
    return profiles?.[0]?.name || null;
}

function cleanUrl(value) {
    const url = String(value || '').trim();
    if (!url) {
        return undefined;
    }
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' ? url : undefined;
    } catch {
        return undefined;
    }
}

async function authorizeNotification({ base44, currentUser, targetUserId, title, message, data = {}, url }) {
    const sr = base44.asServiceRole.entities;
    const type = String(data?.type || '').trim();

    if (isAdmin(currentUser)) {
        return {
            title,
            message,
            data: data || {},
            url: cleanUrl(url),
        };
    }

    if (type === 'match') {
        const match = await findMatch(sr, getMatchId(data));
        if (!match || !isMatchParticipant(match, currentUser.id) || !isMatchParticipant(match, targetUserId)) {
            return null;
        }

        const matchedWithId = sameId(targetUserId, match.user1_id) ? match.user2_id : match.user1_id;
        const matchedWithName = await getProfileName(sr, matchedWithId);
        return {
            title: "🎉 יש לך התאמה חדשה!",
            message: `מאץ' עם ${matchedWithName || 'מישהו'}! זה הזמן לשוחח ולתכנן את החיים המשותפים`,
            data: { ...data, type: 'match', match_id: match.id },
            url: cleanUrl(url),
        };
    }

    if (type === 'likes') {
        const currentUserLikesTarget = await sr.Swipe.filter({
            swiper_id: currentUser.id,
            swiped_id: targetUserId,
            action: 'like',
        });

        if (!currentUserLikesTarget?.length) {
            return null;
        }

        const allLikesForTarget = await sr.Swipe.filter({
            swiped_id: targetUserId,
            action: 'like',
        });
        const requestedCount = Number(data?.count);
        const count = Number.isFinite(requestedCount) && requestedCount > 0
            ? Math.min(requestedCount, allLikesForTarget.length)
            : allLikesForTarget.length;

        return {
            title: "🔥 הופה, התעניינו בך!",
            message: `${count} אנשים אהבו את הפרופיל שלך לאחרונה!`,
            data: { ...data, type: 'likes', count },
            url: cleanUrl(url),
        };
    }

    if (type === 'message') {
        const match = await findMatch(sr, getMatchId(data));
        const senderId = data?.sender_id;
        if (
            !match ||
            !sameId(senderId, currentUser.id) ||
            !isMatchParticipant(match, currentUser.id) ||
            !isMatchParticipant(match, targetUserId)
        ) {
            return null;
        }

        const senderName = await getProfileName(sr, currentUser.id);
        return {
            title: `💬 הודעה חדשה מ-${senderName || 'מישהו'}`,
            message: String(message || '').slice(0, 100),
            data: { ...data, type: 'message', match_id: match.id, sender_id: currentUser.id },
            url: cleanUrl(url),
        };
    }

    if (type === 'charter') {
        const match = await findMatch(sr, getMatchId(data));
        if (!match || !isMatchParticipant(match, currentUser.id) || !isMatchParticipant(match, targetUserId)) {
            return null;
        }

        return {
            title: '📋 השאלון מחכה לך!',
            message: 'השותף שלך כבר מילא את שאלון הדירה – עכשיו התור שלך!',
            data: { ...data, type: 'charter', match_id: match.id },
            url: cleanUrl(url),
        };
    }

    return null;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await requireCurrentUser(base44);

        if (!currentUser) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { user_id, title, message, data, url } = await req.json();

        if (!user_id || !title || !message) {
            return Response.json({ error: 'user_id, title, and message are required' }, { status: 400 });
        }

        const notification = await authorizeNotification({
            base44,
            currentUser,
            targetUserId: user_id,
            title,
            message,
            data,
            url,
        });

        if (!notification) {
            return Response.json({ error: 'Not authorized to send this notification' }, { status: 403 });
        }

        const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
        const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

        if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
            console.error("OneSignal credentials not set");
            return Response.json({ error: 'OneSignal not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                target_channel: 'push',
                include_aliases: { external_id: [String(user_id)] },
                headings: { en: notification.title, he: notification.title },
                contents: { en: notification.message, he: notification.message },
                data: notification.data,
                url: notification.url,
                ios_sound: 'default',
                android_sound: 'default'
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ Push sent user=${user_id} id=${result?.id} recipients=${result?.recipients ?? 0}`);
            return Response.json({ success: true, id: result?.id, recipients: result?.recipients ?? 0, result });
        }

        console.error(`❌ OneSignal push failed user=${user_id}:`, result);
        return Response.json({ success: false, error: result }, { status: response.status });
    } catch (error) {
        console.error("Error sending push notification:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
