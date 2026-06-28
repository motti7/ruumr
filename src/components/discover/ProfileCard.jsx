// @ts-nocheck
import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { MapPin, Info, Dog, Cat, PawPrint, Home, X, CheckCircle2, Instagram, Link as LinkIcon, Facebook, Linkedin, Twitter, Volume2, VolumeX, Music, Users, Star, Sparkles, ArrowUp } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { AnimatePresence } from "framer-motion";
import SmartImage from '@/components/shared/SmartImage';
import { base44 } from '@/api/base44Client';
import { preloadImages } from '@/lib/imageCache';
import HouseholdPreferencesGrid from '@/components/profile/HouseholdPreferencesGrid';
import { getInterestLabel, getInterestLabelKey, normalizeInterestValues } from '@/lib/interests';
import { getCitiesRegion, translateRegion } from '@/lib/cityToRegion';

const ProfileDetail = ({ profile, onClose }) => {
  const { t } = useTranslation();
  const interestLabel = (v) => { const k = getInterestLabelKey(v); return k ? t(k) : getInterestLabel(v); };
  const religionText = { secular: t("religion_secular"), traditional: t("religion_traditional"), national_religious: t("religion_national_religious"), religious: t("religion_religious"), haredi: t("religion_haredi") };
  const preferenceText = { for: t("pref_for"), against: t("pref_against"), flow: t("pref_flexible") };
  const vibeText = [t("vibe_lvl_quiet"), t("vibe_lvl_relaxed"), t("vibe_balanced"), t("vibe_lvl_social"), t("vibe_lvl_lively")];
  const plusMeta = profile.ruumrPlus || profile.ruumr_plus || null;
  const interests = normalizeInterestValues(profile.interests);

  const ensureProtocol = (url) => {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  };

  const getSocialIcon = (link) => {
    if (!link) return null;
    const l = String(link).toLowerCase();
    if (l.includes('facebook')) return <Facebook className="w-5 h-5 text-white" />;
    if (l.includes('instagram')) return <Instagram className="w-5 h-5 text-white" />;
    if (l.includes('tiktok')) return <SiTiktok className="w-5 h-5 text-white" />;
    if (l.includes('twitter') || l.includes('x.com')) return <Twitter className="w-5 h-5 text-white" />;
    if (l.includes('linkedin')) return <Linkedin className="w-5 h-5 text-white" />;
    return <LinkIcon className="w-5 h-5 text-white" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gradient-to-b from-black/50 to-black/80 backdrop-blur-md overflow-y-auto z-[200] pb-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("full_details_of", { name: profile.name })}>

            <button
        onClick={onClose}
        className="fixed top-20 right-6 z-[300] min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={t("close_details")}>
        
                <X className="text-white w-5 h-5 drop-shadow-lg" strokeWidth={2.5} />
            </button>
            
            <div className="p-6 pt-24 text-white space-y-6" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <h3 className="text-3xl font-bold" id="profile-header">{profile.name}, {profile.age}</h3>
                    {plusMeta &&
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 border border-white/10 px-4 py-2 rounded-full text-sm font-bold">
                            <span className="text-[--theme-orange]">
                                {t("match_percent", { percent: Math.round((Number(plusMeta.score) || 0) * 100) })}
                            </span>
                            <span className="text-white/70">·</span>
                            <span className="text-white">
                                {plusMeta.messageable ? t("messages_open") : t("chat_locked")}
                            </span>
                        </div>
          }
                    <div className="flex items-center justify-center text-white/90 mt-3 text-base">
                        <MapPin className="w-5 h-5 ml-1" aria-hidden="true" />
                        <div className="flex flex-col items-center">
                             {profile.current_status !== 'has_apartment' && profile.search_cities && profile.search_cities.length > 0 ?
              <div className="flex flex-wrap justify-center gap-1">
                                    <span>{profile.search_cities[0]}</span>
                                    {profile.search_cities[1] && <span>• {profile.search_cities[1]}</span>}
                                    {profile.search_cities.length > 2 && <span className="text-white/70">• {t("and_more")}</span>}
                                </div> :

              <span>{profile.location}</span>
              }
                             {(() => {
                const region = getCitiesRegion(profile.search_cities) || profile.search_area;
                return region ? <span className="text-sm opacity-80">• {translateRegion(region, t)}</span> : null;
              })()}
                        </div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                    <h4 className="font-bold mb-2 text-white text-lg" id="about-section">{t("onb_about_me_label")}</h4>
                    <p className="text-base text-white/95 leading-relaxed mb-3" aria-describedby="about-section">{profile.about_me}</p>
                    {profile.social_link &&
          <a
            href={ensureProtocol(profile.social_link)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white font-bold bg-[--theme-orange] px-6 py-3 rounded-full hover:brightness-110 transition-colors shadow-lg mt-2"
            aria-label={t("visit_social_of", { name: profile.name })}>

                          {getSocialIcon(profile.social_link)}
                          {t("get_to_know_me")}
                        </a>
          }
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                    <h4 className="font-bold mb-2 text-white text-lg" id="looking-section">{t("onb_looking_for_desc_label")}</h4>
                    <p className="text-base text-white/95 leading-relaxed" aria-describedby="looking-section">{profile.looking_for_description}</p>
                </div>

                {plusMeta && plusMeta.insight &&
        <div className="bg-gradient-to-br from-[--theme-orange]/25 to-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                        <h4 className="font-bold mb-2 text-white text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[--theme-orange]" />
                            {t("why_plus_likes")}
                        </h4>
                        <p className="text-base text-white/95 leading-relaxed">{plusMeta.insight}</p>
                        {plusMeta.reasons &&
          <div className="flex flex-wrap gap-2 mt-3">
                                {(plusMeta.reasons.shared_cities || []).map((city, i) =>
            <span key={`city-${i}`} className="bg-white/15 px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/10">
                                        {city}
                                    </span>
            )}
                                {(plusMeta.reasons.shared_interests || []).map((interest, i) =>
            <span key={`interest-${i}`} className="bg-white/15 px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/10">
                                        {interestLabel(interest)}
                                    </span>
            )}
                            </div>
          }
                    </div>
        }

                {interests.length > 0 &&
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                        <h4 className="font-bold mb-3 text-white text-lg">{t("onb_step5_title")}</h4>
                        <div className="flex flex-wrap gap-2">
                            {interests.map((interest) =>
            <span key={interest} className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium border border-white/30">
                                    {interestLabel(interest)}
                                </span>
            )}
                        </div>
                    </div>
        }

                <HouseholdPreferencesGrid
          profile={profile}
          variant="dark"
          title={t("home_habits")}
          description={t("home_habits_desc")}
          className="mt-2" />
        

                <div className="grid grid-cols-2 gap-3" role="list">
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl" role="listitem">
                        <span className="text-white/70 block text-sm mb-1">{t("religion_short")}</span>
                        <span className="font-bold text-white text-base" aria-label={t("religiosity_aria", { value: religionText[profile.religion] || t("not_specified") })}>{religionText[profile.religion] || '-'}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl" role="listitem">
                        <span className="text-white/70 block text-sm mb-1">{t("vibe_label_short")}</span>
                        <span className="font-bold text-white text-base" aria-label={t("vibe_aria", { value: vibeText[profile.vibe_level - 1] || t("not_specified") })}>{vibeText[profile.vibe_level - 1] || '-'}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl" role="listitem">
                        <span className="text-white/70 block text-sm mb-1">{t("onb_kosher_label")}</span>
                        <span className="font-bold text-white text-base" aria-label={t("kosher_aria", { value: preferenceText[profile.kosher_preference] || t("not_specified") })}>{preferenceText[profile.kosher_preference] || '-'}</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl" role="listitem">
                        <span className="text-white/70 block text-sm mb-1">{t("shabbat_short")}</span>
                        <span className="font-bold text-white text-base" aria-label={t("shabbat_aria", { value: preferenceText[profile.shabbat_preference] || t("not_specified") })}>{preferenceText[profile.shabbat_preference] || '-'}</span>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl flex items-center justify-between">
                     <div>
                        <h4 className="font-bold text-white text-lg mb-1">{t("pets_section")}</h4>
                        <span className="text-white/90">
                            {{ 'none': t('pet_none'), 'dog': t('pet_dog'), 'cat': t('pet_cat'), 'other': profile.pet_other_description || t('pet_other') }[profile.pet_type] || t('not_specified')}
                        </span>
                     </div>
                     <div className="bg-white/20 p-2 rounded-full">
                        {profile.pet_type === 'dog' && <Dog className="w-6 h-6 text-white" />}
                        {profile.pet_type === 'cat' && <Cat className="w-6 h-6 text-white" />}
                        {profile.pet_type === 'other' && <PawPrint className="w-6 h-6 text-white" />}
                        {profile.pet_type === 'none' && <div className="w-6 h-6 text-white/50 text-xs flex items-center justify-center">{t("pet_none")}</div>}
                     </div>
                </div>

                {profile.current_status === 'has_apartment' &&
        <div className="bg-gradient-to-r from-[--theme-orange] to-[--theme-orange-dark] backdrop-blur-sm p-5 rounded-2xl">
                        <h4 className="font-bold text-white mb-3 flex items-center text-lg">
                            <Home className="w-6 h-6 ml-2" />
                            {t("i_already_have_apartment")}
                        </h4>
                        {profile.apartment_photos && profile.apartment_photos.length > 0 &&
          <div className="grid grid-cols-3 gap-2 mt-3">
                                {profile.apartment_photos.filter((p) => p).map((photo, i) =>
            <div key={i} className="w-full aspect-square rounded-lg overflow-hidden">
                                        <SmartImage src={photo} alt={t("apartment_alt")} className="w-full h-full" priority={false} />
                                    </div>
            )}
                            </div>
          }
                    </div>
        }

                {/* Team Status */}
                {(profile.team_target || profile.team_members?.length > 0) &&
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                        <h4 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            {t("team_search_status")}
                        </h4>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white/20 rounded-full px-3 py-1 text-white text-sm font-bold">
                                {1 + (profile.team_members?.length || 0)} / {profile.team_target || '?'} {t("people")}
                            </div>
                            {profile.team_target &&
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                className="h-full bg-white rounded-full"
                style={{ width: `${Math.min(100, (1 + (profile.team_members?.length || 0)) / profile.team_target * 100)}%` }} />
              
                                </div>
            }
                        </div>
                        {profile.team_members && profile.team_members.length > 0 &&
          <div>
                                <p className="text-white/70 text-xs mb-2">{t("team_members_found")}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {profile.team_members.map((member, i) =>
              <div key={i} className="flex items-center gap-1.5 bg-white/15 rounded-full px-2 py-1">
                                            {member.photo ?
                <img src={member.photo} className="w-5 h-5 rounded-full object-cover" /> :

                <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[9px] text-white font-bold">
                                                    {member.name?.[0]}
                                                </div>
                }
                                            <span className="text-white text-xs font-medium">{member.name?.split(' ')[0]}</span>
                                        </div>
              )}
                                </div>
                            </div>
          }
                    </div>
        }

                <div className="pb-10"></div>
            </div>
        </motion.div>);

};

const ProfileCard = /** @type {any} */memo(function ProfileCard({ profile, onSwipe, onSwipeIntent, isActive }) {
  const { t } = useTranslation();
  const interestLabel = (v) => { const k = getInterestLabelKey(v); return k ? t(k) : getInterestLabel(v); };
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [avgRating, setAvgRating] = useState(null);
  const plusMeta = profile.ruumrPlus || profile.ruumr_plus || null;
  const interests = normalizeInterestValues(profile.interests);

  // Use a module-level singleton audio element to guarantee only one plays at a time
  const audioRef = useRef(null);
  useEffect(() => {
    if (!audioRef.current) {
      // Reuse a single global audio element across all card instances
      if (!window.__ruumrAudio) {
        window.__ruumrAudio = new Audio();
        window.__ruumrAudio.loop = true;
      }
      audioRef.current = window.__ruumrAudio;
    }
  }, []);

  useEffect(() => {
    if (!isActive) return; // Only load when card is visible

    const loadRating = async () => {
      try {
        const reviews = await base44.entities.Review.filter({ reviewed_id: profile.user_id });
        if (reviews.length > 0) {
          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
          setAvgRating(avg);
        }
      } catch (e) {
        console.error("Failed to load rating:", e);
      }
    };
    loadRating();
  }, [profile.user_id, isActive]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isActive || !profile.song_preview_url) {
      // Not our turn — pause and reset if we were playing this song
      if (!audio.paused && audio.src === profile.song_preview_url) {
        audio.pause();
        audio.currentTime = 0;
      }
      return;
    }

    // Update src only if it changed (prevents duplicate play calls)
    if (audio.src !== profile.song_preview_url) {
      audio.pause();
      audio.src = profile.song_preview_url;
      audio.currentTime = 0;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!document.hidden && audio.paused) {
      fadeInAudio(audio);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isActive, profile.song_preview_url]);

  const fadeInAudio = useCallback((audio) => {
    if (!audio) return;
    audio.volume = 0;
    audio.play().then(() => {
      let vol = 0;
      const interval = setInterval(() => {
        vol += 0.03;
        audio.volume = Math.min(vol, 0.75);
        if (vol >= 0.75) clearInterval(interval);
      }, 250);
    }).catch(() => setIsMuted(true));
  }, []);

  useEffect(() => {
    if (!audioRef.current || !isActive) return;
    // When unmuting, fade in smoothly instead of hard-setting volume
    if (!isMuted && audioRef.current.paused) {
      fadeInAudio(audioRef.current);
    } else if (isMuted) {
      audioRef.current.volume = 0;
    }
  }, [isMuted, isActive, fadeInAudio]);

  // Motion values for drag animation
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Badge opacities — appear immediately on drag, full opacity well before the 100px swipe-commit threshold
  const likeOpacity = useTransform(x, [5, 60], [0, 1]);
  const nopeOpacity = useTransform(x, [-5, -60], [0, 1]);

  const controls = useAnimation();

  // Memoize the media array to avoid rebuilding on every render
  const media = useMemo(() => {
    const regularPhotos = profile.photos?.filter((p) => p) || [];
    const apartmentPhotos =
    profile.current_status === 'has_apartment' && profile.apartment_photos?.filter((p) => p) ?
    profile.apartment_photos.filter((p) => p) :
    [];

    const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|mov|webm|ogg)$/i.test(url);

    let all = regularPhotos.map((item) =>
    typeof item === 'string' ?
    isVideoUrl(item) ? { type: 'video', url: item } : { type: 'image', url: item } :
    item
    );

    if (profile.video_url) all.splice(1, 0, { type: 'video', url: profile.video_url });

    all = [...all, ...apartmentPhotos.map((p) => ({ type: 'image', url: p }))];
    return all;
  }, [profile.photos, profile.apartment_photos, profile.video_url, profile.current_status]);

  // Preload all images for this profile into the central cache
  useEffect(() => {
    const urls = media.filter((m) => m.type === 'image').map((m) => m.url);
    preloadImages(urls, 'low');
  }, [media]);

  const handleDragEnd = useCallback(async (event, info) => {
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;

    // Swipe up → open profile detail
    if (offsetY < -80 || velocityY < -500) {
      controls.start({ y: 0 });
      setIsExpanded(true);
      return;
    }

    if (offsetX > 100 || velocityX > 500) {
      onSwipeIntent?.("like");
      controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe("like");
    } else if (offsetX < -100 || velocityX < -500) {
      onSwipeIntent?.("dislike");
      controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe("dislike");
    } else {
      controls.start({ x: 0 });
    }
  }, [controls, onSwipe, onSwipeIntent]);

  const handleTap = useCallback((e) => {
    // Ignore tap if expanded or not active
    if (!isActive || isExpanded) return;

    const rect = e.target.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const width = rect.width;

    // If tapped on info button area (approx top left), don't change photo
    if (tapX < 60 && e.clientY - rect.top < 60) return;

    if (tapX < width / 2) {
      setCurrentPhotoIndex((prev) => (prev + 1) % media.length);
    } else {
      setCurrentPhotoIndex((prev) => (prev - 1 + media.length) % media.length);
    }
  }, [isActive, isExpanded, media.length]);

  const vibeText = useMemo(() => [t("vibe_lvl_quiet"), t("vibe_lvl_relaxed"), t("vibe_balanced"), t("vibe_lvl_social"), t("vibe_lvl_lively")], [t]);

  const getPhotoContent = (index) => {
    const isVideo = media[index].type === 'video';

    if (isVideo) {
      return null;
    }

    const regularPhotos = profile.photos?.filter((p) => p) || [];

    let logicalPhotoIndex = index;
    let isRegular = true;

    if (profile.video_url) {
      if (index > 0) logicalPhotoIndex = index - 1;
    }

    if (logicalPhotoIndex >= regularPhotos.length) {
      isRegular = false;
    }

    if (isRegular) {
      if (index === 0) {
        return (
          <>
                        {/* Right column: info button + tags */}
                        <div className="absolute top-12 right-4 z-20 flex flex-col items-end gap-2">
                            {profile.team_target &&
              <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-xs font-bold flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {1 + (profile.team_members?.length || 0)}/{profile.team_target}
                                </div>
              }
                            {avgRating !== null &&
              <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-xs font-bold flex items-center gap-1">
                                    <Star className="w-3 h-3" fill="#FF5722" stroke="#FF5722" />
                                    {avgRating.toFixed(1)}
                                </div>
              }
                            {plusMeta &&
              <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-xs font-bold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-[--theme-orange]" />
                                    {Math.round((Number(plusMeta.score) || 0) * 100)}%
                                </div>
              }
                        </div>

                        {profile.social_link &&
            <a
              href={profile.social_link.startsWith('http') ? profile.social_link : `https://${profile.social_link}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-32 left-4 z-20 bg-[--theme-orange] p-3 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
              
                                {(() => {
                const l = String(profile.social_link).toLowerCase();
                if (l.includes('facebook')) return <Facebook className="w-5 h-5 text-white" />;
                if (l.includes('instagram')) return <Instagram className="w-5 h-5 text-white" />;
                if (l.includes('tiktok')) return <SiTiktok className="w-5 h-5 text-white" />;
                if (l.includes('twitter') || l.includes('x.com')) return <Twitter className="w-5 h-5 text-white" />;
                if (l.includes('linkedin')) return <Linkedin className="w-5 h-5 text-white" />;
                return <LinkIcon className="w-5 h-5 text-white" />;
              })()}
                            </a>
            }
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-36 pointer-events-none">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-4xl font-bold text-white">{profile.name}, {profile.age}</h2>
                                {profile.is_verified &&
                <div className="bg-blue-500/90 p-1 rounded-full shadow-lg" title={t("verified")}>
                                        <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                                    </div>
                }
                            </div>
                            <div className="flex items-start text-white/90 text-base mb-3 font-semibold">
                                <MapPin className="w-5 h-5 ml-1 mt-1 flex-shrink-0" />
                                <div className="flex flex-col">
                                    {profile.current_status === 'has_apartment' ?
                  <span>{profile.location}</span> :
                  profile.search_cities && profile.search_cities.length > 0 ?
                  <span>
                    {profile.search_cities[0]}
                    {profile.search_cities[1] && `, ${profile.search_cities[1]}`}
                    {profile.search_cities.length > 2 && `, ${t("and_more")}`}
                  </span> :
                  <span>{profile.location}</span>
                  }
                                    {profile.current_status !== 'has_apartment' && (() => {
                    const region = getCitiesRegion(profile.search_cities) || profile.search_area;
                    return region ? <span className="text-sm opacity-80 mt-1">• {translateRegion(region, t)}</span> : null;
                  })()}
                                </div>
                            </div>
                            {profile.current_status === 'has_apartment' &&
              <div className="inline-flex items-center bg-[--theme-orange] px-3 py-2 rounded-full text-white text-sm font-bold">
                                    <Home className="w-4 h-4 ml-1" />
                                    {t("onb_has_apartment_title")}!
                                </div>
              }

                        </div>
                    </>);

      }

      if (logicalPhotoIndex === 1) {
        return (
          <>
                        {/* Right column: vibe tag */}
                        <div className="absolute top-12 right-4 z-20 flex flex-col items-end gap-2">
                            <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full text-white text-sm font-bold">
                                {t("vibe_prefix")} {vibeText[profile.vibe_level - 1] || t("not_specified")}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pointer-events-none pb-36">
                            <span className="text-white text-xl font-bold">{t("budget_per_month", { amount: profile.budget_max?.toLocaleString() })}</span>
                            {interests.length > 0 &&
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {interests.slice(0, 4).map((interest) =>
                                        <span key={interest} className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/30">
                                            {interestLabel(interest)}
                                        </span>
                                    )}
                                </div>
                            }
                        </div>
                    </>);

      }

      if (logicalPhotoIndex === 2) {
        return (
          <>

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-36 pointer-events-none">
                            <h3 className="text-xl font-bold text-white mb-2">{t("onb_looking_for_desc_label")}</h3>
                            <p className="text-white/95 text-base leading-relaxed line-clamp-3">{profile.looking_for_description}</p>
                        </div>
                    </>);

      }
    } else if (profile.current_status === 'has_apartment') {
      return (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pb-36 pointer-events-none">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold">
                        {t("photos_from_my_apartment")}
                        <Home className="w-5 h-5 mr-2" />
                    </div>
                </div>);

    }
    return null;
  };

  const handleExpandOpen = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded(true);
  }, []);

  const handleExpandClose = useCallback(() => setIsExpanded(false), []);

  const handleMuteToggle = useCallback((e) => {
    e.stopPropagation();
    setIsMuted((m) => {
      const next = !m;
      if (audioRef.current) {
        if (next) {
          audioRef.current.pause();
          audioRef.current.volume = 0;
        }
        // unmute → second useEffect handles fade-in
      }
      return next;
    });
  }, []);

  return (
    <>
            <motion.div
        drag={isActive ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={{ left: 0.7, right: 0.7, top: 0.4, bottom: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, rotate, opacity }}
        whileTap={{ scale: 1.02 }}
        className={`absolute w-full h-full cursor-grab active:cursor-grabbing z-10`}>
        
                <div
          className={`relative w-full h-full overflow-hidden rounded-2xl bg-black ${profile.current_status === 'has_apartment' ? 'border-2 border-[--theme-orange]' : ''}`}
          onClick={handleTap}>
          
                    <div className="absolute inset-0 bg-black">
                        {media.length > 0 ?
            media[currentPhotoIndex].type === 'video' ?
            <video
              key={currentPhotoIndex}
              src={media[currentPhotoIndex].url}
              className="w-full h-full object-cover pointer-events-none"
              autoPlay
              loop
              muted
              playsInline /> :


            <div className="w-full h-full pointer-events-none">
                                    <SmartImage
                key={currentPhotoIndex}
                src={media[currentPhotoIndex].url}
                alt={profile.name}
                className="w-full h-full"
                priority={true} />
              
                                </div> :


            // Empty State - White pages with just overlay (modified per request)
            <div className="w-full h-full bg-white relative">
                                {/* Two "pages" effect could be subtle borders or shadow, but user asked for "white pages like that" without circle */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50 opacity-50"></div>
                            </div>
            }
                    </div>

                    {media.length > 0 &&
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10 pointer-events-none">
                            {media.map((_, i) =>
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-300 ${i === currentPhotoIndex ? 'bg-white w-full' : 'w-0'}`} />
                                </div>
            )}
                        </div>
          }

                    {/* Info button removed from here — rendered inside getPhotoContent for index 0 */}

                    {media.length > 0 ? getPhotoContent(currentPhotoIndex) :
          // Fallback content when no media
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-5 pb-8 pointer-events-none">
                              <h2 className="text-4xl font-bold text-white mb-1">{profile.name}</h2>
                              <div className="text-white/90 text-base mb-3 font-medium">
                                  {profile.age} • {profile.location}
                              </div>
                         </div>
          }

                    {/* Music Player UI */}
                    {profile.song_preview_url && profile.song_name && isActive &&
          <div className="absolute top-5 left-2 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 pl-4 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="relative w-10 h-10 bg-gray-900 rounded-full overflow-hidden border border-gray-700 animate-[spin_4s_linear_infinite]">
                                  {profile.song_image ?
              <img src={profile.song_image} className="w-full h-full object-cover" /> :

              <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Music className="w-4 h-4 text-white" /></div>
              }
                             </div>
                             <div className="flex flex-col max-w-[120px]">
                                  <span className="text-white text-xs font-bold truncate">{profile.song_name}</span>
                                  <span className="text-white/60 text-[10px] truncate">{profile.song_artist}</span>
                             </div>
                             <button
              onClick={handleMuteToggle}
              className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              aria-label={isMuted ? t("unmute") : t("mute")}>
              
                                 {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-[--theme-orange]" />}
                             </button>
                        </div>
          }

                    {/* Swipe up hint */}
                    {isActive &&
          <button
            onClick={handleExpandOpen}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-0.5 touch-manipulation"
            aria-label={t("more_details")}>

                            <ArrowUp className="w-5 h-5 text-white drop-shadow" strokeWidth={2.5} />
                            <span className="text-white text-xs font-medium drop-shadow" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{t("swipe_for_more")}</span>
                        </button>
          }

                    {/* Like / Nope Badges */}
                    <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-10 right-10 pointer-events-none z-30 transform rotate-12">
            
                        <div className="border-4 border-red-500 text-red-500 text-4xl font-black px-4 py-2 rounded-xl bg-black/20 backdrop-blur-sm">
                            LIKE
                        </div>
                    </motion.div>

                    <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-10 left-10 pointer-events-none z-30 transform -rotate-12">
            
                        <div className="border-4 border-black text-black text-4xl font-black px-4 py-2 rounded-xl bg-white/40 backdrop-blur-sm">
                            NOPE
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded &&
        <ProfileDetail profile={profile} onClose={handleExpandClose} />
        }
            </AnimatePresence>
        </>);

});

export default ProfileCard;
