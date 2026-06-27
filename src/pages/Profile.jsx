import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Profile as ProfileEntity } from "@/entities/all";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import BottomSheetSelect from "@/components/shared/BottomSheetSelect";
import CitySelect from "@/components/shared/CitySelect";
import { Save, Edit, Plus, Loader2, X, Home, ShieldCheck, AlertCircle, Instagram, Facebook, GripVertical, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SiTiktok } from "react-icons/si";
import { createPageUrl } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';
import SmartImage from '@/components/shared/SmartImage';
import { createProfileDefaults } from '@/lib/profileDefaults';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { INTEREST_OPTIONS, normalizeInterestValues } from '@/lib/interests';

function normalizeCityValues(value) {
  const values = Array.isArray(value) ? value.flat(Infinity) : value == null ? [] : [value];
  const seen = new Set();
  const result = [];

  values.forEach((entry) => {
    String(entry ?? "")
      .split(/[,\n\r|]+/g)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((city) => {
        const key = city.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(city);
        }
      });
  });

  return result;
}

function normalizeProfileCities(profile = {}) {
  const searchCities = normalizeCityValues(profile.search_cities);
  const locationCities = normalizeCityValues(profile.location);
  const normalizedSearchCities = normalizeCityValues([...searchCities, ...locationCities]);

  return {
    ...profile,
    search_cities: normalizedSearchCities,
    location: normalizedSearchCities[0] || "",
  };
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [profile, setProfile] = useState(/** @type {any} */ (null));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(/** @type {any} */ ({}));
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApartmentPhoto, setSelectedApartmentPhoto] = useState(null);
  const fileInputRef = useRef(null);
  const apartmentFileInputRef = useRef(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadingApartmentIndex, setUploadingApartmentIndex] = useState(null);
  const [spotifySearch, setSpotifySearch] = useState("");
  const [isSearchingSong, setIsSearchingSong] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      const userProfiles = await ProfileEntity.filter({ user_id: userData.id });
      if (userProfiles.length > 0) {
        const mergedProfile = createProfileDefaults({
          ...userProfiles[0],
          interests: normalizeInterestValues(userProfiles[0].interests),
        });
        const normalizedProfile = normalizeProfileCities(mergedProfile);
        setProfile(normalizedProfile);
        setFormData(normalizedProfile);
      } else {
        // No Profile yet: send back to the Discover locked preview (which holds
        // the "complete profile" CTA) rather than forcing the registration wizard.
        window.location.href = createPageUrl('Discover');
      }
    } catch (error) { 
      console.error("Error loading profile:", error);
      setProfile(null);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (uploadingIndex !== null || uploadingApartmentIndex !== null) {
        toast({ title: t("wait_for_uploads"), variant: "destructive" });
        return;
    }

    const hasBlobPhotos = formData.photos.some(p => p && p.startsWith('blob:'));
    const hasBlobApartment = formData.apartment_photos && formData.apartment_photos.some(p => p && p.startsWith('blob:'));
    if (hasBlobPhotos || hasBlobApartment) {
        toast({ title: t("photos_failed_retry"), variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      if (profile) {
        const cityData = normalizeProfileCities(formData);
        const dataToSave = {
          ...cityData,
          interests: normalizeInterestValues(formData.interests),
          social_link: formData.social_link || "",
          photos: (formData.photos || []).filter(p => p),
        };
        if (!dataToSave.budget_min) dataToSave.budget_min = 0;
        await ProfileEntity.update(profile.id, dataToSave);
      }
      try {
        await syncCurrentProfileToRuumrPlus();
      } catch (syncError) {
        console.error("Failed to sync profile changes to Ruumr Plus:", syncError);
      }
      await loadProfile();
      setIsEditing(false);
      toast({ title: t("profile_saved"), duration: 3000 });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: t("profile_save_error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Image compression + HEIF/HEIC conversion utility
  const compressImage = async (file) => {
    const isHeif = file.type === 'image/heif' || file.type === 'image/heic' || 
                   file.name?.toLowerCase().endsWith('.heif') || file.name?.toLowerCase().endsWith('.heic');
    const needsConversion = isHeif || file.size >= 1024 * 1024;
    
    if (!needsConversion) return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = /** @type {string} */ (event.target?.result || "");
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const scaleSize = img.width > maxWidth ? maxWidth / img.width : 1;
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            const newFile = new File([blob], file.name.replace(/\.(heif|heic)$/i, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
            resolve(newFile);
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleImageUpload = async (e, index) => {
    let file = e.target.files[0];
    if (!file) return;
    setUploadingIndex(index);
    try {
        let fileUrl;
        if (file.type.startsWith('video/')) {
            if (file.size > 50 * 1024 * 1024) {
                throw new Error("Video too large (max 50MB)");
            }
            const { file_url } = await UploadFile({ file });
            fileUrl = file_url;
        } else {
            file = await compressImage(file);
            const { file_url } = await UploadFile({ file });
            fileUrl = file_url;
        }
        
        const newPhotos = [...(formData.photos || Array(6).fill(null))];
        newPhotos[index] = fileUrl;
        setFormData(prev => ({...prev, photos: newPhotos}));
    } catch (error) { 
        console.error("Upload failed", error);
        alert(error.message || t("file_upload_failed"));
        setFormData(prev => {
            const newPhotos = [...(prev.photos || [])];
            newPhotos[index] = null;
            return {...prev, photos: newPhotos};
        });
    }
    setUploadingIndex(null);
  };

  const handleApartmentImageUpload = async (e, index) => {
    let file = e.target.files[0];
    if (!file) return;
    setUploadingApartmentIndex(index);
    try {
        file = await compressImage(file);
        const { file_url } = await UploadFile({ file });
        const newPhotos = [...(formData.apartment_photos || Array(4).fill(null))];
        newPhotos[index] = file_url;
        setFormData(prev => ({...prev, apartment_photos: newPhotos}));
    } catch (error) { 
        console.error("Upload failed", error);
        setFormData(prev => {
            const newPhotos = [...(prev.apartment_photos || [])];
            newPhotos[index] = null;
            return {...prev, apartment_photos: newPhotos};
        });
        alert(t("photo_upload_failed_short"));
    }
    setUploadingApartmentIndex(null);
  };
  
  const triggerFileInput = (index) => {
    if (!isEditing) return;
    fileInputRef.current.onchange = (e) => handleImageUpload(e, index);
    fileInputRef.current.click();
  };

  const triggerApartmentFileInput = (index) => {
    if (!isEditing) return;
    apartmentFileInputRef.current.onchange = (e) => handleApartmentImageUpload(e, index);
    apartmentFileInputRef.current.click();
  };

  const handleVideoUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Basic validation
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
          alert(t("video_too_large"));
          return;
      }

      setIsUploadingVideo(true);
      try {
          // Create video element to check duration
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = async () => {
              window.URL.revokeObjectURL(video.src);
              if (video.duration > 16) { // Allow slightly over 15s for margin
                  alert(t("video_too_long"));
                  setIsUploadingVideo(false);
                  return;
              }

              try {
                  const { file_url } = await UploadFile({ file });
                  setFormData(prev => ({ ...prev, video_url: file_url }));
              } catch (error) {
                  console.error("Video upload failed", error);
                  alert(t("video_upload_failed"));
              }
              setIsUploadingVideo(false);
          };
          video.src = URL.createObjectURL(file);
      } catch (error) {
          console.error("Video handling failed", error);
          setIsUploadingVideo(false);
      }
      e.target.value = '';
  };

  const searchSong = async () => {
      if (!spotifySearch.trim()) return;
      setIsSearchingSong(true);
      try {
          const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(spotifySearch)}&media=music&limit=1&entity=song`);
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
              const item = data.results[0];
              setFormData(prev => ({
                  ...prev,
                  itunes_track_id: String(item.trackId),
                  song_preview_url: item.previewUrl,
                  song_name: item.trackName,
                  song_artist: item.artistName,
                  song_image: item.artworkUrl100?.replace('100x100', '300x300')
              }));
              setSpotifySearch("");
          } else {
              alert(t("song_not_found"));
          }
      } catch (e) {
          console.error(e);
      }
      setIsSearchingSong(false);
  };

  const setFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setSearchCities = (cities) => {
    const normalizedCities = normalizeCityValues(cities);
    setFormData(prev => ({
      ...prev,
      search_cities: normalizedCities,
      location: normalizedCities[0] || "",
    }));
  };

  const vibeText = [t("vibe_lvl_quiet"), t("vibe_lvl_relaxed"), t("vibe_balanced"), t("vibe_lvl_social"), t("vibe_lvl_lively")];

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24 p-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-32" />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
          </div>
          <div className="space-y-3 mt-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{t("profile_load_error")}</p>
          <button onClick={() => window.location.reload()} className="text-red-600 text-sm font-bold hover:underline mt-2">
            {t("reload")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24" dir={i18n.dir()}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/mp4,video/quicktime,video/webm" />
      <input type="file" ref={apartmentFileInputRef} className="hidden" accept="image/*" />
      
      <AnimatePresence>
        {selectedApartmentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            onClick={() => setSelectedApartmentPhoto(null)}
          >
            <button
              onClick={() => setSelectedApartmentPhoto(null)}
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              aria-label={t("close")}
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img src={selectedApartmentPhoto} className="max-w-full max-h-full object-contain" alt={t("apartment_alt")} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white">
        <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">{t("my_profile")}</h1>
          <Button 
              onClick={() => {
                  if (!isEditing) {
                      setIsEditing(true);
                  } else {
                      handleSave();
                  }
              }}
              disabled={isSaving}
              className="rounded-full gradient-orange text-white shadow-lg"
          >
              {isSaving ? <><Loader2 className="w-4 h-4 ml-2 animate-spin"/> {t("saving")}</> : isEditing ? <><Save className="w-4 h-4 ml-2"/> {t("save")}</> : <><Edit className="w-4 h-4 ml-2"/> {t("edit")}</>}
          </Button>
        </div>

        {!profile.is_verified && (
            <div className="px-4 mt-2">
                <div 
                    onClick={() => window.location.href = createPageUrl('Verification')}
                    className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{t("profile_unverified")}</p>
                            <p className="text-xs text-gray-500">{t("verify_identity_hint")}</p>
                        </div>
                    </div>
                    <div className="bg-[--theme-orange] text-white text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap min-w-fit">
                        {t("verify_now")}
                    </div>
                </div>
            </div>
        )}

        {profile.is_verified && (
            <div className="px-4 mt-2">
                 <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <p className="font-bold text-green-700 text-sm">{t("profile_verified")}</p>
                 </div>
            </div>
        )}
        
        <div className="px-2 pt-2 pb-2">
          {isEditing ? (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const photos = [...(formData.photos || Array(6).fill(null))];
              const [moved] = photos.splice(result.source.index, 1);
              photos.splice(result.destination.index, 0, moved);
              setFormData(prev => ({ ...prev, photos }));
            }}>
              <Droppable droppableId="photos" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-3 gap-1"
                  >
                    {[...Array(6)].map((_, i) => {
                      const hasPhoto = formData.photos?.length > i && formData.photos[i];
                      return (
                        <Draggable key={`photo-${i}`} draggableId={`photo-${i}`} index={i} isDragDisabled={!hasPhoto}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`aspect-square rounded-lg overflow-hidden relative border-2 transition-all ${snapshot.isDragging ? 'border-[--theme-orange] shadow-lg scale-105 z-50' : 'border-gray-200 hover:border-[--theme-orange]'}`}
                            >
                              {hasPhoto ? (
                                <>
                                  {formData.photos[i].match(/\.(mp4|mov|webm)$/i) ? (
                                    <video src={formData.photos[i]} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                  ) : (
                                    <img src={formData.photos[i]} alt={t('photo_alt', { number: i + 1 })} className="w-full h-full object-cover" />
                                  )}
                                  {/* Drag handle */}
                                  <div {...provided.dragHandleProps} className="absolute top-1 right-1 bg-black/40 rounded-full p-0.5 cursor-grab active:cursor-grabbing z-10">
                                    <GripVertical className="w-3 h-3 text-white" />
                                  </div>
                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newPhotos = [...(formData.photos || [])];
                                      newPhotos[i] = null;
                                      setFormData(prev => ({ ...prev, photos: newPhotos }));
                                    }}
                                    className="absolute top-1 left-1 bg-black/40 rounded-full p-0.5 z-10"
                                    aria-label={t("delete_photo")}
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                </>
                              ) : (
                                <div
                                  className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-1 cursor-pointer"
                                  onClick={() => triggerFileInput(i)}
                                  {...provided.dragHandleProps}
                                >
                                  <Plus className="w-6 h-6 text-gray-400" />
                                  {i === 0 && <span className="text-[10px] text-gray-400">{t("photos_video")}</span>}
                                </div>
                              )}
                              {uploadingIndex === i && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                  <Loader2 className="animate-spin text-white" />
                                </div>
                              )}
                              {/* Click to replace photo */}
                              {hasPhoto && (
                                <div
                                  className="absolute inset-0 z-[5]"
                                  onClick={() => triggerFileInput(i)}
                                />
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(6)].map((_, i) => {
                const photoUrl = formData.photos?.[i];
                return (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden relative transition-all bg-gray-100">
                    {photoUrl ? (
                      photoUrl.match(/\.(mp4|mov|webm)$/i) ? (
                        <video src={photoUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                      ) : (
                        <img
                          src={photoUrl}
                          alt={t('photo_alt', { number: i + 1 })}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedApartmentPhoto(photoUrl)}
                        />
                      )
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t("onb_age_label")}</label>
                  <p className="text-lg font-bold text-[--theme-orange]">{profile.age}</p>
                </div>
                <div className="text-right">
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t("onb_gender_label")}</label>
                  {isEditing ? (
                    <BottomSheetSelect
                      value={formData.gender}
                      onValueChange={(v) => setFormField('gender', v)}
                      label={t("onb_gender_label")}
                      options={[
                        { value: "male", label: t("gender_male") },
                        { value: "female", label: t("gender_female") },
                        { value: "other", label: t("gender_other") },
                      ]}
                    />
                  ) : (
                     <p className="text-lg font-bold text-[--theme-orange]">{formData.gender === 'male' ? t("gender_male") : formData.gender === 'female' ? t("gender_female") : t("gender_other")}</p>
                  )}
                </div>
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-right">{t("pets_section")}</h3>
              <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                      {['none', 'dog', 'cat', 'other'].map(type => {
                          const petLabel = { none: t('pet_none'), dog: t('pet_dog'), cat: t('pet_cat'), other: t('pet_other') }[type];
                          return (
                          <button
                              key={type}
                              disabled={!isEditing}
                              onClick={() => setFormField('pet_type', type)}
                              className={`py-3 px-2 min-h-[44px] border rounded-lg flex flex-col items-center justify-center transition-colors ${formData.pet_type === type ? 'border-[--theme-orange] bg-orange-50 text-[--theme-orange]' : 'border-gray-200 text-gray-600'} ${!isEditing && formData.pet_type !== type ? 'opacity-50' : ''}`}
                              aria-label={t('select_x', { label: petLabel })}
                          >
                              <span className="text-sm font-medium">{petLabel}</span>
                          </button>
                          );
                      })}
                  </div>
                  {formData.pet_type === 'other' && (
                       <Input
                          disabled={!isEditing}
                          value={formData.pet_other_description || ''}
                          onChange={(e) => setFormField('pet_other_description', e.target.value)}
                          placeholder={t("onb_pet_other_placeholder")}
                          className="bg-white border-gray-300 text-right"
                          dir="rtl"
                       />
                  )}
              </div>

              <h3 className="font-bold text-gray-800 mb-3 text-right">{t("religion_tradition_section")}</h3>
              <div className="space-y-3">
                  <div>
                      <label className="block text-right text-sm font-medium text-gray-600 mb-1">{t("onb_religion_label")}</label>
                      <BottomSheetSelect
                           disabled={!isEditing}
                           value={formData.religion}
                           onValueChange={(v) => setFormField('religion', v)}
                           label={t("onb_religion_label")}
                           placeholder={t("select_placeholder")}
                           options={[
                             { value: "secular", label: t("religion_secular") },
                             { value: "traditional", label: t("religion_traditional") },
                             { value: "national_religious", label: t("religion_national_religious") },
                             { value: "religious", label: t("religion_religious") },
                             { value: "haredi", label: t("religion_haredi") },
                           ]}
                       />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-right text-sm font-medium text-gray-600 mb-1">{t("onb_kosher_label")}</label>
                          <BottomSheetSelect
                              disabled={!isEditing}
                              value={formData.kosher_preference}
                              onValueChange={(v) => setFormField('kosher_preference', v)}
                              label={t("onb_kosher_label")}
                              placeholder={t("select_placeholder")}
                              options={[
                                { value: "for", label: t("pref_for") },
                                { value: "against", label: t("pref_against") },
                                { value: "flow", label: t("pref_flexible") },
                              ]}
                          />
                      </div>
                      <div>
                          <label className="block text-right text-sm font-medium text-gray-600 mb-1">{t("shabbat_observance")}</label>
                          <BottomSheetSelect
                              disabled={!isEditing}
                              value={formData.shabbat_preference}
                              onValueChange={(v) => setFormField('shabbat_preference', v)}
                              label={t("shabbat_observance")}
                              placeholder={t("select_placeholder")}
                              options={[
                                { value: "for", label: t("pref_for") },
                                { value: "against", label: t("pref_against") },
                                { value: "flow", label: t("pref_flexible") },
                              ]}
                          />
                      </div>
                  </div>
              </div>
            </div>

            <div>
              <label className="block text-right font-bold text-gray-700 mb-2">{t("onb_about_me_label")}</label>
              <Textarea disabled={!isEditing} value={formData.about_me || ""} onChange={(e) => setFormField('about_me', e.target.value)} className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right" dir="rtl" />
            </div>

            <div>
              <label className="block text-right font-bold text-gray-700 mb-2 flex items-center gap-2">
                  {t("onb_social_link_label")}
              </label>
              {isEditing && (
                <div className="flex gap-3 justify-center mb-3">
                    <div className="p-2 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full shadow-sm">
                        <Instagram className="w-4 h-4 text-white"/>
                    </div>
                    <div className="p-2 bg-[#1877F2] rounded-full shadow-sm">
                        <Facebook className="w-4 h-4 text-white"/>
                    </div>
                    <div className="p-2 bg-black rounded-full shadow-sm">
                        <SiTiktok className="w-4 h-4 text-white"/>
                    </div>
                </div>
              )}
              <Input 
                  disabled={!isEditing} 
                  value={formData.social_link || ""} 
                  onChange={(e) => setFormField('social_link', e.target.value)} 
                  placeholder={t("onb_paste_link_placeholder")}
                  className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right"
                  dir="rtl"
              />
            </div>
            <div>
              <label className="block text-right font-bold text-gray-700 mb-2">{t("onb_looking_for_desc_label")}</label>
              <Textarea disabled={!isEditing} value={formData.looking_for_description || ""} onChange={(e) => setFormField('looking_for_description', e.target.value)} className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right" dir="rtl" />
            </div>
        </div>
        
        <div className="space-y-4">
            {/* SONG SECTION - MOVED HERE */}
            <div className="w-full aspect-square max-w-[280px] mx-auto relative group">
                <div className={`w-full h-full rounded-[2.5rem] bg-white p-6 shadow-2xl relative overflow-hidden border border-gray-200 flex flex-col items-center justify-center text-center transition-all duration-500 ${isEditing || !formData.song_name ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
                     onClick={() => !isEditing && !formData.song_name && setIsEditing(true)}
                >
                    
                    {/* Vinyl Record Animation */}
                    <div className="relative w-32 h-32 mb-4">
                        <motion.div 
                            animate={{ rotate: formData.song_name ? 360 : 0 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full rounded-full border-4 border-[#FA3803] shadow-xl overflow-hidden relative"
                        >
                            <img 
                                src={formData.song_image || "https://upload.wikimedia.org/wikipedia/commons/b/b6/12in-Vinyl-LP-Record-Angle.jpg"} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 bg-white rounded-full border-2 border-[#FA3803] shadow-inner flex items-center justify-center">
                                    <div className="w-3 h-3 bg-[#FA3803] rounded-full"></div>
                                </div>
                            </div>
                        </motion.div>
                        <div className="absolute -top-2 -right-2 bg-[#FFE8E2] text-[#FA3803] text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10 animate-bounce">
                            MY VIBE
                        </div>
                    </div>

                    {(isEditing && !formData.song_name) ? (
                        <div className="w-full space-y-2 relative z-20" onClick={e => e.stopPropagation()}>
                        <Input 
                            value={spotifySearch} 
                            onChange={(e) => setSpotifySearch(e.target.value)} 
                            placeholder={t("search_song_placeholder")}
                            className="bg-gray-100 border-gray-300 text-black text-center placeholder:text-gray-400 h-10 text-sm"
                            dir="rtl"
                            onKeyDown={(e) => e.key === 'Enter' && searchSong()}
                        />
                        <Button 
                            onClick={searchSong} 
                            disabled={isSearchingSong || !spotifySearch.trim()} 
                            className="w-full bg-[#FFE8E2] hover:bg-[#FFDDD0] text-[#FA3803] h-8 text-xs font-semibold"
                        >
                            {isSearchingSong ? <Loader2 className="animate-spin w-3 h-3"/> : t("search")}
                        </Button>
                        </div>
                    ) : (
                        <div className="relative z-20 w-full">
                            <h3 className="text-bold font-black text-xl mb-1 truncate px-2">{formData.song_name || t("if_you_were_a_song")}</h3>
                            <p className="text-gray-700 text-sm truncate px-4">{formData.song_artist || t("what_song_are_you")}</p>
                            
                            {formData.song_preview_url && (
                                <audio controls src={formData.song_preview_url} className="mt-3 h-8 w-full" style={{filter: 'invert(1) hue-rotate(180deg)', accentColor: '#FF5722'}} />
                            )}
                            
                            {!formData.song_name && !isEditing && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center gap-1 bg-[#FFE8E2] hover:bg-[#FFDDD0] text-[#FA3803] text-xs px-3 py-1.5 rounded-full transition-colors font-semibold">
                                        <Plus className="w-3 h-3" /> {t("pick_song_or_artist")}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {isEditing && formData.song_name && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, itunes_track_id: '', song_name: '', song_preview_url: null, song_artist: '', song_image: '' })); }}
                            className="absolute top-4 right-4 text-[#FA3803] hover:text-[#E64A19] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={t("remove_song")}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:20px_20px] opacity-50"></div>
                    </div>
                </div>
            </div>

            <div className="text-right">
                <label className="block text-right font-bold text-gray-700 mb-2">
                  {t("looking_for_short")}
                </label>
                <BottomSheetSelect
                    disabled={!isEditing}
                    value={formData.looking_for_gender}
                    onValueChange={(v) => setFormField('looking_for_gender', v)}
                    label={t("looking_for_short")}
                    className="mt-1"
                    options={[
                      { value: "male", label: t("looking_for_male") },
                      { value: "female", label: t("looking_for_female") },
                      { value: "any", label: t("looking_for_any") },
                    ]}
                />
            </div>
            <div>
                <label className="block text-right font-bold text-gray-700 mb-3">
                  {t("vibe_prefix")} <span className="text-[--theme-orange] font-bold text-lg">{vibeText[formData.vibe_level-1] || t("vibe_balanced")}</span>
                </label>
                <div className="px-2 py-3">
                  <div className="relative">
                    <input
                      type="range"
                      dir="ltr"
                      disabled={!isEditing}
                      value={formData.vibe_level}
                      onChange={(e) => setFormField('vibe_level', parseInt(e.target.value))}
                      min="1"
                      max="5"
                      step="1"
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #FF5722 0%, #FF5722 ${((formData.vibe_level - 1) / 4) * 100}%, #e5e7eb ${((formData.vibe_level - 1) / 4) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <style>{`
                      input[type="range"]::-webkit-slider-thumb {
                        appearance: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #FF5722;
                        cursor: pointer;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        padding: 10px;
                      }
                      input[type="range"]::-webkit-slider-thumb::before {
                        content: "";
                        position: absolute;
                        width: 44px;
                        height: 44px;
                        background: transparent;
                        border-radius: 50%;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        pointer-events: auto;
                      }
                      input[type="range"]::-moz-range-thumb {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #FF5722;
                        cursor: pointer;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        padding: 10px;
                      }
                      /* Invisible expanded hit area */
                      input[type="range"] {
                        margin: 11px 0;
                      }
                    `}</style>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-3 px-1 font-medium">
                    <span>{t("vibe_lvl_lively")}</span>
                    <span>{t("vibe_lvl_social")}</span>
                    <span>{t("vibe_balanced")}</span>
                    <span>{t("vibe_lvl_relaxed")}</span>
                    <span>{t("vibe_lvl_quiet")}</span>
                  </div>
                </div>
            </div>
        </div>

        {/* תחומי עניין */}
        <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-200">
          <h3 className="font-bold text-gray-800 mb-3 text-right">{t("onb_step5_title")}</h3>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => {
              const selected = (formData.interests || []).includes(interest.id);
              return (
                <button
                  key={interest.id}
                  disabled={!isEditing}
                  onClick={() => {
                    const current = formData.interests || [];
                    setFormField('interests', selected
                      ? current.filter(i => i !== interest.id)
                      : [...current, interest.id]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? 'border-[--theme-orange] bg-orange-50 text-[--theme-orange]'
                      : 'border-gray-200 bg-white text-gray-600'
                  } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {t(interest.labelKey)}
                </button>
              );
            })}
          </div>
          {!isEditing && (!formData.interests || formData.interests.length === 0) && (
            <p className="text-gray-400 text-sm text-center mt-2">{t("tap_edit_to_add_interests")}</p>
          )}
        </div>

        <div className="space-y-4">
            <div className="text-right">
                <label className="block text-right font-bold text-gray-700 mb-2">
                  {t("apartment_status")}
                </label>
                <BottomSheetSelect
                     disabled={!isEditing}
                     value={formData.current_status}
                     onValueChange={(v) => setFormField('current_status', v)}
                     label={t("apartment_status")}
                     className="mt-1"
                     options={[
                       { value: "seeking_apartment", label: t("onb_seeking_apartment_title") },
                       { value: "has_apartment", label: t("onb_has_apartment_title") },
                     ]}
                 />
            </div>

            {formData.current_status === 'has_apartment' && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center mb-3">
                <div className="p-2 bg-[--theme-orange] rounded-full text-white ml-2">
                     <Home className="w-4 h-4" />
                </div>
                <label className="block text-lg font-bold text-gray-800">
                    {t("my_apartment")}
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`aspect-[4/3] rounded-xl border-2 border-dashed ${isEditing ? 'border-[--theme-orange]/50 cursor-pointer hover:bg-orange-100' : 'border-gray-200'} bg-white overflow-hidden relative transition-all shadow-sm`} 
                      onClick={(e) => {
                        if (isEditing) {
                          triggerApartmentFileInput(i);
                        } else if (formData.apartment_photos?.[i]) {
                          setSelectedApartmentPhoto(formData.apartment_photos[i]);
                        }
                      }}
                    >
                        {(formData.apartment_photos?.length > i && formData.apartment_photos[i]) ? (
                            <SmartImage 
                              src={formData.apartment_photos[i]} 
                              alt={t('onb_apartment_photo_alt', { number: i + 1 })}
                              className="w-full h-full"
                              priority={false}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                              {isEditing ? (
                                  <>
                                      <Plus className="w-8 h-8 mb-1 text-[--theme-orange]"/>
                                      <span className="text-xs text-[--theme-orange]">{t("add_photo")}</span>
                                  </>
                              ) : (
                                  <Home className="w-6 h-6 opacity-20"/>
                              )}
                            </div>
                        )}
                        {uploadingApartmentIndex === i && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
                {isEditing ? t('apartment_photos_hint') : t('tap_photo_to_enlarge')}
            </p>
            </div>
            )}

            <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">{t("monthly_rent_budget")}</label>
                <Input disabled={!isEditing} type="number" placeholder={t("budget_example_placeholder")} value={formData.budget_max} onChange={e => setFormField('budget_max', parseInt(e.target.value) || 0)} className="bg-white border-gray-300 text-right" dir="rtl" />
            </div>
            
            <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-2">{t("preferred_search_area")}</label>
                <BottomSheetSelect
                    disabled={!isEditing}
                    value={formData.search_area}
                    onValueChange={(v) => setFormField('search_area', v)}
                    label={t("preferred_search_area")}
                    options={[
                      { value: "צפון", label: t("area_north") },
                      { value: "מרכז", label: t("area_center") },
                      { value: "דרום", label: t("area_south") },
                      { value: "שפלה", label: t("area_shfela") },
                      { value: "ירושלים", label: t("area_jerusalem") },
                    ]}
                />
            </div>
            
            <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">{t("preferred_cities")}</label>
                <CitySelect
                  disabled={!isEditing}
                  selectedCities={formData.search_cities || []}
                  onChange={setSearchCities}
                />
            </div>
        </div>
      </div>
    </div>
  );
}