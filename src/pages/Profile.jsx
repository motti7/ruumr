import React, { useState, useEffect, useRef } from "react";
import { Profile as ProfileEntity } from "@/entities/all";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";
import { base44 } from "@/api/base44Client";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import BottomSheetSelect from "@/components/shared/BottomSheetSelect";
import { Save, Edit, Plus, Loader2, X, Home, ShieldCheck, AlertCircle, Instagram, Facebook, GripVertical } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { createPageUrl } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';
import SmartImage from '@/components/shared/SmartImage';
import { createProfileDefaults } from '@/lib/profileDefaults';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { INTEREST_OPTIONS, normalizeInterestValues } from '@/lib/interests';

export default function ProfilePage() {
  const [profile, setProfile] = useState(/** @type {any} */ (null));
  const [isEditing, setIsEditing] = useState(false);
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
      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
      }

      let userData = null;
      try {
        userData = await User.me();
      } catch (error) {
        const simulatorState = getSimulatorBackendState();
        if (simulatorState?.currentUser) {
          userData = simulatorState.currentUser;
        } else {
          throw error;
        }
      }

      let userProfiles = [];
      try {
        userProfiles = await ProfileEntity.filter({ user_id: userData.id });
      } catch {
        const simulatorState = getSimulatorBackendState();
        userProfiles = simulatorState?.collections?.Profile?.filter((profile) => String(profile.user_id) === String(userData.id)) || [];
      }

      if (userProfiles.length > 0) {
        const mergedProfile = createProfileDefaults({
          ...userProfiles[0],
          interests: normalizeInterestValues(userProfiles[0].interests),
        });
        setProfile(mergedProfile);
        setFormData(mergedProfile);
      } else {
        window.location.href = createPageUrl('Onboarding');
      }
    } catch (error) { 
      console.error("Error loading profile:", error);
      setProfile(null);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (uploadingIndex !== null || uploadingApartmentIndex !== null) {
        alert("אנא המתן לסיום העלאת התמונות");
        return;
    }

    if (isRuumrSimulatorMode()) {
      enableSimulatorBackend(base44);
    }

    // Clean social link
    let cleanSocial = formData.social_link || "";
    // If user entered full URL, keep it. If they entered "instagram.com/user", ensure protocol. 
    // If they just entered "user", we might want to leave it or assume instagram? 
    // For now, just ensure it doesn't have double protocols if they copy-pasted.
    
    // Check for blob URLs
    const hasBlobPhotos = formData.photos.some(p => p && p.startsWith('blob:'));
    const hasBlobApartment = formData.apartment_photos && formData.apartment_photos.some(p => p && p.startsWith('blob:'));
    
    if (hasBlobPhotos || hasBlobApartment) {
        alert("חלק מהתמונות לא עלו כראוי. אנא נסה להעלות אותן שוב.");
        return;
    }

    try {
      if (profile) {
        const dataToSave = {
          ...formData,
          interests: normalizeInterestValues(formData.interests),
          social_link: cleanSocial,
        };
        if(!dataToSave.budget_min) dataToSave.budget_min = 0;
        await ProfileEntity.update(profile.id, dataToSave);
      }
      try {
        await syncCurrentProfileToRuumrPlus();
      } catch (syncError) {
        console.error("Failed to sync profile changes to Ruumr Plus:", syncError);
      }
      await loadProfile();
      setIsEditing(false);
    } catch (error) { console.error("Error saving profile:", error); }
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
        alert(error.message || "העלאת הקובץ נכשלה");
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
        alert("העלאת התמונה נכשלה");
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
          alert("הקובץ גדול מדי. אנא העלה סרטון קטן יותר (עד 50MB)");
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
                  alert("הסרטון ארוך מדי. אנא העלה סרטון של עד 15 שניות.");
                  setIsUploadingVideo(false);
                  return;
              }

              try {
                  const { file_url } = await UploadFile({ file });
                  setFormData(prev => ({ ...prev, video_url: file_url }));
              } catch (error) {
                  console.error("Video upload failed", error);
                  alert("העלאת הסרטון נכשלה. אנא נסה שוב.");
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
              alert("לא נמצא שיר");
          }
      } catch (e) {
          console.error(e);
      }
      setIsSearchingSong(false);
  };

  const setFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const vibeText = ["שקט", "רגוע", "מאוזן", "חברותי", "תוסס"];

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.62)_0%,_rgba(255,255,255,0.04)_100%)]" />
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-3 h-10 w-48 rounded-2xl" />
          <Skeleton className="mt-3 h-4 w-[86%] rounded-full" />
            <div className="mt-5 flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="aspect-[4/5] rounded-[32px]" />
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-[28px]" />
            <Skeleton className="h-36 rounded-[28px]" />
            <Skeleton className="h-24 rounded-[28px]" />
          </div>
        </div>
      </div>
  );
}
  
  if (!profile) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.62)_0%,_rgba(255,255,255,0.04)_100%)]" />
        <div className="w-full max-w-sm rounded-[2rem] border border-rose-200 bg-rose-50/90 p-6 text-center shadow-[0_24px_80px_rgba(244,63,94,0.08)] backdrop-blur-2xl">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
          <p className="text-lg font-black text-rose-900">שגיאה בטעינת הפרופיל</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-sm font-bold text-rose-600 hover:underline">
            טען מחדש
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.62)_0%,_rgba(255,255,255,0.04)_100%)]" />
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
              aria-label="סגור"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img src={selectedApartmentPhoto} className="max-w-full max-h-full object-contain" alt="דירה" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-md space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Profile studio</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">הפרופיל שלי</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {profile.name}, {profile.age} · {profile.location || "מיקום לא צוין"}
              </p>
            </div>
            <Button
              onClick={() => {
                if (!isEditing) {
                  setIsEditing(true);
                } else {
                  handleSave();
                }
              }}
              className="min-h-[44px] rounded-full bg-[--theme-orange] px-4 text-white shadow-[0_14px_30px_rgba(255,122,69,0.24)]"
            >
              {isEditing ? <><Save className="w-4 h-4 ml-2" /> שמור</> : <><Edit className="w-4 h-4 ml-2" /> ערוך</>}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {profile.is_verified ? "Verified" : "Needs verification"}
            </span>
            <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange] ring-1 ring-orange-100">
              {formData.current_status === "has_apartment" ? "Has apartment" : "Looking"}
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
              {formData.search_area || "Search area"}
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
              {formData.budget_max ? `₪${Number(formData.budget_max).toLocaleString()}` : "Budget"}
            </span>
          </div>

          {!profile.is_verified ? (
            <div
              onClick={() => window.location.href = createPageUrl("Verification")}
              className="mt-4 rounded-[24px] border border-orange-100 bg-orange-50/80 p-4 text-right shadow-[0_12px_30px_rgba(255,122,69,0.10)] cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white p-2 text-[--theme-orange] shadow-sm">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">הפרופיל לא מאומת</p>
                    <p className="text-xs text-slate-500">אמת את זהותך כדי לקבל יותר פניות</p>
                  </div>
                </div>
                <div className="rounded-full bg-[--theme-orange] px-4 py-2 text-xs font-bold text-white">
                  אמת עכשיו
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4 text-right shadow-[0_12px_30px_rgba(16,185,129,0.10)]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white p-2 text-emerald-600 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="font-bold text-emerald-700 text-sm">פרופיל מאומת</p>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/76 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="mb-3 flex items-center justify-between px-1" dir="ltr">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">Portfolio</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
              {isEditing ? "Drag to reorder" : "Tap to enlarge"}
            </span>
          </div>

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
                                    <img src={formData.photos[i]} alt={`תמונה ${i+1}`} className="w-full h-full object-cover" />
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
                                    aria-label="מחק תמונה"
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
                                  {i === 0 && <span className="text-[10px] text-gray-400">תמונות/וידאו</span>}
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
                          alt={`תמונה ${i+1}`}
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
        </motion.section>

      <div className="space-y-4 pb-2">

        <div className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
            <div className="grid grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="mb-1 block text-sm font-medium text-slate-500">גיל</label>
                  <p className="text-lg font-bold text-[--theme-orange]">{profile.age}</p>
                </div>
                <div className="text-right">
                  <label className="mb-1 block text-sm font-medium text-slate-500">מגדר</label>
                  {isEditing ? (
                    <BottomSheetSelect
                      value={formData.gender}
                      onValueChange={(v) => setFormField('gender', v)}
                      label="מגדר"
                      options={[
                        { value: "male", label: "זכר" },
                        { value: "female", label: "נקבה" },
                        { value: "other", label: "אחר" },
                      ]}
                    />
                  ) : (
                     <p className="text-lg font-bold text-[--theme-orange]">{formData.gender === 'male' ? 'זכר' : formData.gender === 'female' ? 'נקבה' : 'אחר'}</p>
                  )}
                </div>
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="rounded-[28px] border border-white/70 bg-white/76 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
              <h3 className="mb-3 text-right text-lg font-black tracking-tight text-slate-950">בעלי חיים והעדפות</h3>
              <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                      {['none', 'dog', 'cat', 'other'].map(type => (
                          <button 
                              key={type} 
                              disabled={!isEditing}
                              onClick={() => setFormField('pet_type', type)} 
                              className={`py-3 px-2 min-h-[44px] border rounded-lg flex flex-col items-center justify-center transition-colors ${formData.pet_type === type ? 'border-[--theme-orange] bg-orange-50 text-[--theme-orange]' : 'border-gray-200 text-gray-600'} ${!isEditing && formData.pet_type !== type ? 'opacity-50' : ''}`}
                              aria-label={`בחר ${{'none': 'אין', 'dog': 'כלב', 'cat': 'חתול', 'other': 'אחר'}[type]}`}
                          >
                              <span className="text-sm font-medium">{
                                  {'none': 'אין', 'dog': 'כלב', 'cat': 'חתול', 'other': 'אחר'}[type]
                              }</span>
                          </button>
                      ))}
                  </div>
                  {formData.pet_type === 'other' && (
                       <Input 
                          disabled={!isEditing} 
                          value={formData.pet_other_description || ''} 
                          onChange={(e) => setFormField('pet_other_description', e.target.value)} 
                          placeholder="איזו חיה?" 
                          className="bg-white border-gray-300 text-right" 
                          dir="rtl"
                       />
                  )}
              </div>

              <h3 className="mb-3 text-right text-lg font-black tracking-tight text-slate-950">העדפות דת ומסורת</h3>
              <div className="space-y-3">
                  <div>
                      <label className="mb-1 block text-right text-sm font-medium text-slate-600">זיקה לדת</label>
                      <BottomSheetSelect
                           disabled={!isEditing}
                           value={formData.religion}
                           onValueChange={(v) => setFormField('religion', v)}
                           label="זיקה לדת"
                           placeholder="בחר..."
                           options={[
                             { value: "secular", label: "חילוני/ת" },
                             { value: "traditional", label: "מסורתי/ת" },
                             { value: "national_religious", label: "דתי/ה לאומי/ת" },
                             { value: "religious", label: "דתי/ה" },
                             { value: "haredi", label: "חרדי/ת" },
                           ]}
                       />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-right text-sm font-medium text-gray-600 mb-1">כשרות</label>
                          <BottomSheetSelect
                              disabled={!isEditing}
                              value={formData.kosher_preference}
                              onValueChange={(v) => setFormField('kosher_preference', v)}
                              label="כשרות"
                              placeholder="בחר..."
                              options={[
                                { value: "for", label: "בעד" },
                                { value: "against", label: "נגד" },
                                { value: "flow", label: "זורם/ת" },
                              ]}
                          />
                      </div>
                      <div>
                          <label className="block text-right text-sm font-medium text-gray-600 mb-1">שמירת שבת</label>
                          <BottomSheetSelect
                              disabled={!isEditing}
                              value={formData.shabbat_preference}
                              onValueChange={(v) => setFormField('shabbat_preference', v)}
                              label="שמירת שבת"
                              placeholder="בחר..."
                              options={[
                                { value: "for", label: "בעד" },
                                { value: "against", label: "נגד" },
                                { value: "flow", label: "זורם/ת" },
                              ]}
                          />
                      </div>
                  </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-right font-bold text-slate-700">קצת עליי</label>
              <Textarea disabled={!isEditing} value={formData.about_me || ""} onChange={(e) => setFormField('about_me', e.target.value)} className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right" dir="rtl" />
            </div>

            <div>
              <label className="mb-2 block text-right font-bold text-slate-700 flex items-center gap-2">
                  קישור לרשת חברתית
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
                  placeholder="הדבק קישור כאן" 
                  className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right" 
                  dir="rtl" 
              />
            </div>
            <div>
              <label className="block text-right font-bold text-gray-700 mb-2">מה אני מחפש/ת</label>
              <Textarea disabled={!isEditing} value={formData.looking_for_description || ""} onChange={(e) => setFormField('looking_for_description', e.target.value)} className="mt-1 bg-white focus:ring-[--theme-orange] focus:border-[--theme-orange] border-gray-300 text-right" dir="rtl" />
            </div>
        </div>
        
        <div className="space-y-4">
            {/* SONG SECTION - MOVED HERE */}
            <div className="relative mx-auto max-w-[280px] w-full aspect-square group">
                <div className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] transition-all duration-500 ${isEditing || !formData.song_name ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
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
                        <div className="absolute -top-2 -right-2 rounded-full bg-[#FFE8E2] px-2 py-1 text-[10px] font-bold text-[#FA3803] shadow-lg z-10 animate-bounce">
                            MY VIBE
                        </div>
                    </div>

                    {(isEditing && !formData.song_name) ? (
                        <div className="w-full space-y-2 relative z-20" onClick={e => e.stopPropagation()}>
                        <Input 
                            value={spotifySearch} 
                            onChange={(e) => setSpotifySearch(e.target.value)} 
                            placeholder="חפש שיר..." 
                            className="bg-gray-100 border-gray-300 text-black text-center placeholder:text-gray-400 h-10 text-sm"
                            dir="rtl"
                            onKeyDown={(e) => e.key === 'Enter' && searchSong()}
                        />
                        <Button 
                            onClick={searchSong} 
                            disabled={isSearchingSong || !spotifySearch.trim()} 
                            className="w-full bg-[#FFE8E2] hover:bg-[#FFDDD0] text-[#FA3803] h-8 text-xs font-semibold"
                        >
                            {isSearchingSong ? <Loader2 className="animate-spin w-3 h-3"/> : "חפש"}
                        </Button>
                        </div>
                    ) : (
                        <div className="relative z-20 w-full">
                            <h3 className="mb-1 truncate px-2 text-xl font-black text-slate-950">{formData.song_name || "אם היית שיר..."}</h3>
                            <p className="truncate px-4 text-sm text-slate-600">{formData.song_artist || "איזה שיר הוא אתה?"}</p>
                            
                            {formData.song_preview_url && (
                                <audio controls src={formData.song_preview_url} className="mt-3 h-8 w-full" style={{filter: 'invert(1) hue-rotate(180deg)', accentColor: '#FF5722'}} />
                            )}
                            
                            {!formData.song_name && !isEditing && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE8E2] px-3 py-1.5 text-xs font-semibold text-[#FA3803] transition-colors hover:bg-[#FFDDD0]">
                                        <Plus className="w-3 h-3" /> בחר שיר או אמן
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {isEditing && formData.song_name && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, itunes_track_id: '', song_name: '', song_preview_url: null, song_artist: '', song_image: '' })); }}
                            className="absolute top-4 right-4 text-[#FA3803] hover:text-[#E64A19] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="הסר שיר"
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
                <label className="mb-2 block text-right font-bold text-slate-700">
                  מחפש/ת
                </label>
                <BottomSheetSelect
                    disabled={!isEditing}
                    value={formData.looking_for_gender}
                    onValueChange={(v) => setFormField('looking_for_gender', v)}
                    label="מחפש/ת"
                    className="mt-1"
                    options={[
                      { value: "male", label: "שותף" },
                      { value: "female", label: "שותפה" },
                      { value: "any", label: "לא משנה" },
                    ]}
                />
            </div>
            <div>
                <label className="mb-3 block text-right font-bold text-slate-700">
                  וייב: <span className="text-[--theme-orange] font-black text-lg">{vibeText[formData.vibe_level-1] || 'מאוזן'}</span>
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
                    <span>תוסס</span>
                    <span>חברותי</span>
                    <span>מאוזן</span>
                    <span>רגוע</span>
                    <span>שקט</span>
                  </div>
                </div>
            </div>
        </div>

        {/* תחומי עניין */}
        <div className="rounded-[28px] border border-orange-100 bg-orange-50/80 p-4 shadow-[0_18px_50px_rgba(255,122,69,0.08)]">
          <h3 className="mb-3 text-right text-lg font-black tracking-tight text-slate-950">תחומי עניין</h3>
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
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    selected
                      ? 'border-[--theme-orange] bg-orange-50 text-[--theme-orange]'
                      : 'border-gray-200 bg-white text-gray-600'
                  } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {interest.label}
                </button>
              );
            })}
          </div>
          {!isEditing && (!formData.interests || formData.interests.length === 0) && (
            <p className="mt-2 text-center text-sm text-slate-400">לחץ על "ערוך" להוספת תחומי עניין</p>
          )}
        </div>

        <div className="space-y-4">
            <div className="text-right">
                <label className="mb-2 block text-right font-bold text-slate-700">
                  סטטוס דירה
                </label>
                <BottomSheetSelect
                     disabled={!isEditing}
                     value={formData.current_status}
                     onValueChange={(v) => setFormField('current_status', v)}
                     label="סטטוס דירה"
                     className="mt-1"
                     options={[
                       { value: "seeking_apartment", label: "מחפש/ת דירה" },
                       { value: "has_apartment", label: "יש לי דירה" },
                     ]}
                 />
            </div>

            {formData.current_status === 'has_apartment' && (
            <div className="rounded-[28px] border border-orange-100 bg-orange-50/80 p-4 shadow-[0_18px_50px_rgba(255,122,69,0.08)]">
            <div className="mb-3 flex items-center">
                <div className="p-2 bg-[--theme-orange] rounded-full text-white ml-2">
                     <Home className="w-4 h-4" />
                </div>
                <label className="block text-lg font-black tracking-tight text-slate-950">
                    הדירה שלי
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
                              alt={`דירה ${i+1}`} 
                              className="w-full h-full"
                              priority={false}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                              {isEditing ? (
                                  <>
                                      <Plus className="w-8 h-8 mb-1 text-[--theme-orange]"/>
                                      <span className="text-xs text-[--theme-orange]">הוסף תמונה</span>
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
            <p className="mt-2 text-center text-xs text-slate-500">
                {isEditing ? 'יש להעלות תמונות ברורות של החללים המשותפים והחדר הפנוי' : 'לחץ על תמונה להגדלה'}
            </p>
            </div>
            )}

            <div>
                <label className="mb-1 block text-right text-sm font-bold text-slate-700">תקציב חודשי לשכירות</label>
                <Input disabled={!isEditing} type="number" placeholder="לדוגמה: 3500" value={formData.budget_max} onChange={e => setFormField('budget_max', parseInt(e.target.value) || 0)} className="bg-white border-gray-300 text-right" dir="rtl" />
            </div>
            
            <div>
                <label className="mb-2 block text-right text-sm font-bold text-slate-700">איזור חיפוש מועדף</label>
                <BottomSheetSelect
                    disabled={!isEditing}
                    value={formData.search_area}
                    onValueChange={(v) => setFormField('search_area', v)}
                    label="איזור חיפוש מועדף"
                    options={[
                      { value: "צפון", label: "צפון" },
                      { value: "מרכז", label: "מרכז" },
                      { value: "דרום", label: "דרום" },
                      { value: "שפלה", label: "שפלה" },
                      { value: "ירושלים", label: "ירושלים והסביבה" },
                    ]}
                />
            </div>
            
            <div>
                <label className="mb-1 block text-right text-sm font-bold text-slate-700">עיר מועדפת (אופציונלי)</label>
                <Input disabled={!isEditing} value={formData.location} onChange={e => setFormField('location', e.target.value)} placeholder="לדוגמה: תל אביב" className="bg-white border-gray-300 text-right" dir="rtl" />
            </div>
        </div>
      </div>
    </div>
    </div>
  );
}
