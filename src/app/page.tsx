"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PhotoGallery } from "@/components/PhotoGallery";
import { VoiceInterface } from "@/components/VoiceInterface";
import { WorldViewer, applySceneEditGlobal } from "@/components/WorldViewer";
import { SceneEditBar } from "@/components/SceneEditBar";
import { NetworkBackground } from "@/components/NetworkBackground";
import type { PhotoMetadata } from "@/lib/types";

const SUGGESTIONS = [
  "What was I doing on December 1st, 2009?",
  "Show me my summer vacation photos",
  "Take me back to my birthday party",
  "Find photos from 2015",
];

export default function Home() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [worldUrl, setWorldUrl] = useState<string | undefined>();
  const [splatUrl, setSplatUrl] = useState<string | undefined>();
  const [splatUrls, setSplatUrls] = useState<{ "100k"?: string; "500k"?: string; full_res?: string } | undefined>();
  const [worldCaption, setWorldCaption] = useState<string | undefined>();
  const [worldThumbnail, setWorldThumbnail] = useState<string | undefined>();
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [highlightedPhotoIds, setHighlightedPhotoIds] = useState<string[]>([]);
  const [showLightbox, setShowLightbox] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const vaultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/photos")
      .then((res) => res.json())
      .then((data) => {
        if (data.photos?.length > 0) setPhotos(data.photos);
      })
      .catch(console.error);
  }, []);

  const handlePhotosUploaded = useCallback((newPhotos: PhotoMetadata[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const handleWorldGenerated = useCallback((url: string, splat?: string, allSplatUrls?: { "100k"?: string; "500k"?: string; full_res?: string }) => {
    setWorldUrl(url);
    if (splat) setSplatUrl(splat);
    if (allSplatUrls) setSplatUrls(allSplatUrls);
    setIsGeneratingWorld(false);
    setShowLightbox(true);
  }, []);

  return (
    <main className="min-h-screen bg-transparent selection:bg-orange-100">
      <NetworkBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent spatial-header __enableXr__">
        <div className="max-w-screen-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-sm font-bold tracking-widest text-primary uppercase">
            SceneForge
          </h1>
        </div>
      </header>

      {/* ── Drawer toggle (left edge) ── */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-6 h-16 bg-white/80 backdrop-blur-md border border-l-0 border-slate-200 flex items-center justify-center hover:bg-primary/10 transition-colors rounded-r-lg shadow-sm group"
        title={drawerOpen ? "Close archive" : "Open archive"}
      >
        <svg
          className={`w-3.5 h-3.5 text-muted group-hover:text-primary transition-all duration-300 ${drawerOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ── Photos / Upload drawer ── */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-30 w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-xl transition-transform duration-300 ease-out overflow-y-auto ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pt-24 px-6 pb-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-primary font-bold">Photo Archive</h2>
            <button onClick={() => setDrawerOpen(false)} className="text-muted hover:text-main transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <PhotoUploader onPhotosUploaded={handlePhotosUploaded} />

          {photos.length > 0 && (
            <PhotoGallery photos={photos} highlightedIds={highlightedPhotoIds} />
          )}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-12 min-h-[80vh]">

            {/* Left Column: Voice Orb + Suggestions */}
            <div className="flex flex-col items-center justify-center gap-8">
              <VoiceInterface onWorldGenerated={handleWorldGenerated} />

              {/* Example prompts */}
              <div className="w-full max-w-xs space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted font-bold text-center mb-3">
                  Try saying...
                </p>
                {SUGGESTIONS.map((s, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-slate-200 text-xs text-main tracking-wide hover:border-primary/40 hover:text-primary transition-colors cursor-default text-center"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: World Viewer */}
            <div className="space-y-8">
              <div className="sticky top-24">
                {worldUrl || splatUrl ? (
                  <button
                    onClick={() => setShowLightbox(true)}
                    className="w-full relative overflow-hidden bg-white border border-slate-100 aspect-video group cursor-pointer shadow-sm"
                  >
                    {worldThumbnail ? (
                      <img src={worldThumbnail} alt="World preview" className="w-full h-full object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-1000" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <span className="text-xs uppercase tracking-widest text-muted font-bold">World Ready</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-8 py-4 bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/40">
                        Step Into Memory
                      </div>
                    </div>
                  </button>
                ) : (
                  <WorldViewer isGenerating={isGeneratingWorld} />
                )}

                {generationError && (
                  <div className="mt-6 border border-red-100 p-4 text-center bg-white/50 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-widest font-bold text-red-600">{generationError}</p>
                    <button
                      onClick={() => setGenerationError(null)}
                      className="mt-3 text-[10px] tracking-widest uppercase text-red-600 hover:text-red-800 font-bold underline underline-offset-4"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {!worldUrl && !isGeneratingWorld && (
                  <div className="mt-6 text-center bg-white/30 p-4 border border-dashed border-slate-200">
                    <p className="text-xs text-muted font-bold uppercase tracking-widest">
                      Talk to the assistant or open the archive to generate a world.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Blinking "Example Vaults" arrow — hides on scroll ── */}
      {photos.length > 0 && !hasScrolled && (
        <button
          onClick={() => vaultsRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 animate-pulse cursor-pointer group"
        >
          <span className="text-[10px] uppercase tracking-widest text-muted font-bold group-hover:text-primary transition-colors">
            Example Vaults
          </span>
          <svg className="w-4 h-4 text-muted group-hover:text-primary transition-colors animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* ── Example Vaults section ── */}
      {photos.length > 0 && (
        <div ref={vaultsRef} className="px-6 pb-24">
          <div className="max-w-screen-2xl mx-auto">
            <div className="border-t border-slate-100 pt-16">
              <h2 className="text-xs uppercase tracking-widest text-primary font-bold text-center mb-2">
                Example Vaults
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold text-center mb-10">
                Select a memory to generate its world
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {photos.slice(0, 18).map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden bg-slate-100 border border-slate-200 hover:border-primary/40 transition-all"
                  >
                    <img
                      src={photo.url}
                      alt={photo.originalName}
                      className="w-full h-full object-cover grayscale-50 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                    {/* Hover overlay with two actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                      <button
                        disabled={isGeneratingWorld}
                        onClick={async () => {
                          setIsGeneratingWorld(true);
                          setGenerationError(null);
                          setHighlightedPhotoIds([photo.id]);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                          try {
                            const res = await fetch("/api/generate-world", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                photoUrl: photo.url,
                                photoId: photo.id,
                                displayName: photo.description || photo.originalName,
                                metadata: {
                                  dateTaken: photo.dateTaken,
                                  latitude: photo.location?.latitude,
                                  longitude: photo.location?.longitude,
                                  cameraMake: photo.camera?.make,
                                  cameraModel: photo.camera?.model,
                                  width: photo.width,
                                  height: photo.height,
                                  originalName: photo.originalName,
                                },
                              }),
                            });
                            const data = await res.json();
                            if (data.error) {
                              setGenerationError(data.details || data.error);
                              setIsGeneratingWorld(false);
                            } else if (data.worldUrl) {
                              handleWorldGenerated(data.worldUrl, data.splatUrl, data.splatUrls);
                              if (data.caption) setWorldCaption(data.caption);
                              if (data.thumbnailUrl) setWorldThumbnail(data.thumbnailUrl);
                            } else {
                              setGenerationError("Generation timed out.");
                              setIsGeneratingWorld(false);
                            }
                          } catch (err) {
                            setGenerationError(err instanceof Error ? err.message : "Failed");
                            setIsGeneratingWorld(false);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all shadow-md disabled:opacity-50"
                        title="Generate world"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                      <button
                        onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-red-400 flex items-center justify-center transition-all shadow-md"
                        title="Remove"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {showLightbox && (worldUrl || splatUrl) && (
        <div className="fixed inset-0 z-100 bg-(--bg-main) spatial-lightbox spatial-world __enableXr__">
          <div className="absolute top-8 right-8 z-110 flex items-center gap-4 group/controls">
            {worldCaption && (
              <div className="relative group/info">
                <div className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all font-bold shadow-xl cursor-help">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute top-14 right-0 w-80 p-6 bg-white/95 backdrop-blur-xl border border-primary/20 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/info:opacity-100 group-hover/info:translate-y-0 transition-all duration-300">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-3 border-b border-primary/10 pb-2">
                    Memory Reconstruction
                  </p>
                  <p className="text-xs text-main leading-relaxed tracking-wide font-medium italic">
                    &ldquo;{worldCaption}&rdquo;
                  </p>
                </div>
              </div>
            )}
            {worldUrl && (
              <a
                href={worldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/10 backdrop-blur-md border border-primary/20 text-xs text-primary font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2 shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Marble
              </a>
            )}
            <button
              onClick={() => setShowLightbox(false)}
              className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all font-bold shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="w-full h-full relative">
            <WorldViewer
              worldUrl={worldUrl}
              splatUrl={splatUrl}
              splatUrls={splatUrls}
              thumbnailUrl={worldThumbnail}
              caption={worldCaption}
              isGenerating={false}
              fullscreen
            />
            <SceneEditBar onSceneEdit={applySceneEditGlobal} />
          </div>
        </div>
      )}
    </main>
  );
}
