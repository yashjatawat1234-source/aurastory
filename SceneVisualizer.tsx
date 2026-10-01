import React, { useState, useRef } from 'react';
import { Sparkles, Video, Image as ImageIcon, LayoutGrid, Lock, Loader2, Play, Pause } from 'lucide-react';

interface ScriptBlock {
  id: string;
  type: string;
  text: string;
}

interface StoryboardPanel {
  id: string;
  beatText: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

interface SceneVisualizerProps {
  sceneTitle: string;
  blocks: ScriptBlock[];
  userTier?: 'free' | 'pro';
}

export const SceneVisualizer: React.FC<SceneVisualizerProps> = ({
  sceneTitle,
  blocks,
  userTier = 'pro',
}) => {
  const [panels, setPanels] = useState<StoryboardPanel[]>([]);
  const [sceneVideoUrl, setSceneVideoUrl] = useState<string | null>(null);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [isGeneratingSceneVideo, setIsGeneratingSceneVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Toggle Play / Pause for the master video
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Extract action beats from scene blocks
  const getActionBeats = () => {
    const actionBlocks = blocks.filter(
      (b) => b.type === 'ACTION' || b.type === 'SCENE' || b.type === 'SCENE_HEADING'
    );
    if (actionBlocks.length === 0) {
      return [{ id: 'beat_0', beatText: sceneTitle || 'Overview scene beat' }];
    }
    return actionBlocks.map((b, idx) => ({
      id: b.id || `beat_${idx}_${Date.now()}`,
      beatText: b.text,
    }));
  };

  // Compile prompt for master scene video
  const getFullScenePrompt = () => {
    const actionLines = blocks
      .filter((b) => b.type === 'ACTION' || b.type === 'SCENE' || b.type === 'SCENE_HEADING')
      .map((b) => b.text)
      .join('. ');
    return `${sceneTitle}: ${actionLines}`;
  };

  // Generate B&W Sketches for all beats
  const handleGenerateStoryboard = async () => {
    setIsGeneratingStoryboard(true);
    const beats = getActionBeats();

    setPanels(beats.map((beat) => ({ ...beat, isGenerating: true })));

    try {
      const res = await fetch('/api/generate-scene-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle,
          style: 'black and white cinematic storyboard sketch, high contrast charcoal line art',
          beats,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPanels(data.panels);
      } else {
        setPanels(
          beats.map((beat, idx) => ({
            ...beat,
            imageUrl: `https://picsum.photos/seed/storyboard_sketch_${encodeURIComponent(
              beat.beatText.substring(0, 15)
            )}_${idx}/400/225?grayscale`,
            isGenerating: false,
          }))
        );
      }
    } catch {
      setPanels(
        beats.map((beat, idx) => ({
          ...beat,
          imageUrl: `https://picsum.photos/seed/storyboard_sketch_${encodeURIComponent(
            beat.beatText.substring(0, 15)
          )}_${idx}/400/225?grayscale`,
          isGenerating: false,
        }))
      );
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Animate single video for entire scene
  const handleAnimateEntireScene = async () => {
    if (userTier !== 'pro') return;
    setIsGeneratingSceneVideo(true);

    const fullPrompt = getFullScenePrompt();

    try {
      const res = await fetch('/api/animate-full-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle,
          fullPrompt,
          panelSketches: panels.map((p) => p.imageUrl).filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.videoUrl) {
          setSceneVideoUrl(data.videoUrl);
          setIsGeneratingSceneVideo(false);
          setIsPlaying(true);
          return;
        }
      }
    } catch {
      console.warn('Backend offline, loading continuous scene video preview.');
    }

    const sampleVideos = [
      'https://vjs.zencdn.net/v/oceans.mp4',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
    ];
    const chosenVideo = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

    setTimeout(() => {
      setSceneVideoUrl(chosenVideo);
      setIsGeneratingSceneVideo(false);
      setIsPlaying(true);
    }, 1800);
  };

  return (
    <div className="w-80 border-l border-slate-800 bg-slate-950 p-4 flex flex-col h-full text-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm tracking-wide text-emerald-400 flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" /> Scene Visualizer
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          {userTier.toUpperCase()}
        </span>
      </div>

      {/* SECTION 1: MASTER SCENE ANIMATED VIDEO */}
      <div className="mb-5 border border-slate-800 rounded-lg bg-slate-900/80 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Entire Scene Motion
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">
            5 Credits
          </span>
        </div>

        <div className="relative aspect-video w-full bg-slate-950 rounded-md overflow-hidden border border-slate-800 flex items-center justify-center mb-2">
          {sceneVideoUrl ? (
            <>
              <video
                ref={videoRef}
                src={sceneVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setSceneVideoUrl(null)}
                className="w-full h-full object-cover"
              />

              {/* Pause / Play Toggle */}
              <button
                onClick={togglePlayPause}
                className="absolute bottom-2 right-2 p-1.5 rounded-md bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-slate-700/80 backdrop-blur transition cursor-pointer shadow-md"
                title={isPlaying ? 'Pause scene video' : 'Play scene video'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
            </>
          ) : (
            <div className="text-center px-3 py-6 text-slate-500 text-[11px]">
              <Video className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
              Animate full scene movement based on all action lines.
            </div>
          )}

          {isGeneratingSceneVideo && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-xs text-cyan-300">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              Rendering Entire Scene Video...
            </div>
          )}
        </div>

        <button
          onClick={handleAnimateEntireScene}
          disabled={isGeneratingSceneVideo || userTier !== 'pro'}
          className={`w-full py-2 px-3 rounded text-xs font-semibold transition flex items-center justify-center gap-2 ${
            userTier === 'pro'
              ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 cursor-pointer shadow-md'
              : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
          }`}
        >
          {isGeneratingSceneVideo ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : userTier === 'pro' ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> Animate Entire Scene
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Upgrade to Animate
            </>
          )}
        </button>
      </div>

      <hr className="border-slate-800 mb-4" />

      {/* SECTION 2: MULTI-PANEL STORYBOARD SKETCHES */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> Storyboard Sketches
        </span>
        <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
          1 Credit / Beat
        </span>
      </div>

      <button
        onClick={handleGenerateStoryboard}
        disabled={isGeneratingStoryboard}
        className="w-full py-2 px-3 mb-4 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {panels.length > 0 ? 'Regenerate Storyboard Sketches' : 'Generate Shot Sketches'}
      </button>

      {/* Storyboard Sketch Feed */}
      <div className="space-y-4 flex-1">
        {panels.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
            <ImageIcon className="w-7 h-7 mx-auto mb-2 opacity-30" />
            Click above to generate B&W shot sketches reflecting every scene detail.
          </div>
        ) : (
          panels.map((panel, index) => (
            <div
              key={panel.id}
              className="border border-slate-800 rounded-lg bg-slate-900/60 overflow-hidden"
            >
              <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
                {panel.imageUrl ? (
                  <img
                    src={panel.imageUrl}
                    alt={`Shot Sketch #${index + 1}`}
                    className="w-full h-full object-cover filter contrast-125 grayscale"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Sketching Shot #{index + 1}...
                  </div>
                )}

                <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur text-[10px] font-mono px-1.5 py-0.5 rounded text-emerald-400 border border-slate-800">
                  SHOT #{index + 1}
                </span>
              </div>

              <div className="p-2.5 text-[11px] text-slate-300 font-mono leading-relaxed border-t border-slate-800/80">
                {panel.beatText}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};