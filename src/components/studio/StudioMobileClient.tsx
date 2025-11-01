import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, Play, Pause, Trash2, LoaderCircle, Wand2, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectById, updateProject } from '@/lib/graphql';
import { getApiUrl, fetchVoices, uploadAudioSegment } from '@/lib/tts';
import { StudioBlock, Project, Voice } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import getMP3Duration from 'get-mp3-duration';
import CenteredLoader from '@/components/CenteredLoader';

const PRO_VOICES_IDS = ['0', '1', '2', '3'];
const MAINTENANCE_VOICES = ['0', '1', '2', '3'];

export default function StudioMobileClient() {
  const [project, setProject] = useState<Project | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [blocks, setBlocks] = useState<StudioBlock[]>([]);
  const [voices, setVoices] = useState<(Voice & { isPro?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoad = useRef(true);

  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user, token, subscription } = useAuth();

  // Fetch project data
  useEffect(() => {
    if (!projectId || !token) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [projectData, voicesData, blocksData] = await Promise.all([
          getProjectById(projectId),
          fetchVoices().catch(e => { console.error("Voice fetch failed:", e); return []; }),
          fetch(getApiUrl(`/api/project/get-records?projectId=${projectId}`), {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.ok ? res.json() : []),
        ]);

        if (!projectData) {
          setError('Project not found.');
          return;
        }

        const allVoices = voicesData.map((v: Voice) => ({ 
          ...v, 
          isPro: v.provider === 'ghaymah' && PRO_VOICES_IDS.includes(v.name) 
        }));

        setProject(projectData);
        setProjectTitle(projectData.name || "Untitled Project");
        setProjectDescription(projectData.description || "");
        setVoices(allVoices);
        setBlocks(blocksData.map((block: StudioBlock) => ({ ...block, isGenerating: false })));

      } catch (err) {
        console.error("Failed to fetch project data:", err);
        setError("Failed to load project data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId, token]);

  // Auto-save project metadata
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (!token) return;
    
    const handler = setTimeout(() => {
      updateProject(projectId, projectTitle, projectDescription, token)
        .catch(err => console.error("Auto-save for metadata failed:", err));
    }, 2000);
    
    return () => clearTimeout(handler);
  }, [projectTitle, projectDescription, projectId, token]);

  // Save blocks function
  const saveBlocks = useCallback(async (blocksToSave: StudioBlock[]) => {
    try {
      await fetch(`/api/project/save-editor-blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          blocksJson: blocksToSave,
        }),
      });
    } catch (err) {
      console.error("Blocks save failed:", err);
    }
  }, [projectId]);

  // Auto-save blocks
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    const handler = setTimeout(() => {
      if (blocks.length > 0) {
        saveBlocks(blocks);
      }
    }, 1000);
    
    return () => clearTimeout(handler);
  }, [blocks, saveBlocks]);

  // Calculate audio durations
  useEffect(() => {
    const calculateMissingDurations = async () => {
      const blocksToUpdate = blocks.filter(block => block.audioUrl && !block.duration);
      if (blocksToUpdate.length === 0) return;

      let hasUpdates = false;
      const updatedBlocks = await Promise.all(
        blocks.map(async (block) => {
          if (block.audioUrl && !block.duration) {
            try {
              const audio = new Audio(block.audioUrl);
              const duration = await new Promise<number>((resolve, reject) => {
                audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
                audio.addEventListener('error', (e) => reject(e));
              });
              hasUpdates = true;
              return { ...block, duration };
            } catch (error) {
              console.warn(`Could not calculate duration for block ${block.id}:`, error);
            }
          }
          return block;
        })
      );

      if (hasUpdates) {
        setBlocks(updatedBlocks);
      }
    };
    calculateMissingDurations();
  }, [blocks]);

  // Audio player progress
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setActiveBlockId(null);
      setProgress(0);
    };
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

  // Add new block
  const addBlock = () => {
    const newBlockId = uuidv4();
    const defaultVoice = "ar-EG-ShakirNeural";

    const newBlock: StudioBlock = {
      id: newBlockId,
      project_id: projectId,
      block_index: blocks.length.toString(),
      content: {
        time: Date.now(),
        blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }],
        version: "2.28.2"
      },
      s3_url: '',
      created_at: new Date().toISOString(),
      voice: defaultVoice,
      isGenerating: false,
      isArabic: true,
      voiceSelected: false,
    };

    setBlocks(prev => [...prev, newBlock]);
    toast.success('Block added');
  };

  // Delete block
  const deleteBlock = async (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    toast.success('Block deleted');
  };

  // Update block content
  const updateBlockContent = (id: string, text: string) => {
    setBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.id === id
          ? {
              ...block,
              content: {
                ...block.content,
                blocks: [{ id: uuidv4(), type: 'paragraph', data: { text } }]
              }
            }
          : block
      )
    );
  };

  // Play/pause/stop audio
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);

  const togglePlay = async (block: StudioBlock) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeBlockId === block.id && isPlaying) {
      audio.pause();
      return;
    }

    if (block.audioUrl) {
      setActiveBlockId(block.id);
      if (audio.src !== block.audioUrl) {
        audio.src = block.audioUrl;
      }
      audio.play().catch(e => console.error("Audio play failed", e));
      return;
    }

    if (block.job_id) {
      setLoadingAudioId(block.id);
      try {
        const res = await fetch(getApiUrl(`/api/tts/result/${block.job_id}`));
        if (!res.ok) {
          throw new Error('Failed to fetch audio data.');
        }
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        setBlocks(currentBlocks =>
          currentBlocks.map(b => b.id === block.id ? { ...b, audioUrl } : b)
        );

        setActiveBlockId(block.id);
        audio.src = audioUrl;
        audio.play().catch(e => console.error("Audio play failed", e));

      } catch (err) {
        console.error("Failed to fetch and play audio:", err);
        toast.error("Could not load audio. Please try generating it again.");
      } finally {
        setLoadingAudioId(null);
      }
    } else {
      toast.error("No audio available for this block.");
    }
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setActiveBlockId(null);
    setProgress(0);
  };

  // Generate all audio - SAME AS DESKTOP VERSION
  const handleGenerateAll = async () => {
    if (!subscription?.active || subscription.remaining_chars <= 0) {
        toast.error('Your subscription is inactive or you have no remaining characters.');
        return;
    }

    if (isGenerating) return;
    if (!user) return;

    if (blocks.length > 50) {
      toast.error('لقد تجاوزت الحد الأقصى لعدد الكتل المسموح به وهو 50.');
      return;
    }

    for (const block of blocks) {
      const text = block.content.blocks.map(b => b.data.text).join(' \n');
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (wordCount > 1000) {
        toast.error(`تجاوزت كتلة واحدة الحد الأقصى للكلمات وهو 1000 كلمة. (الكتلة الحالية: ${wordCount} كلمة)`);
        return;
      }
    }

    const blocksToGenerate = blocks.filter(block =>
      block.content.blocks.some(b => b.data.text && b.data.text.trim().length > 0) &&
      !block.audioUrl &&
      !block.isGenerating
    );

    if (blocksToGenerate.length === 0) {
      toast.error('أضف نصًا لإنشاء الصوت أو انتظر حتى تكتمل العملية الحالية.');
      return;
    }

    setIsGenerating(true);
    const generationToastId = toast.loading(`Generating audio for ${blocksToGenerate.length} block(s)...`);

    setBlocks(currentBlocks =>
      currentBlocks.map(block =>
        blocksToGenerate.find(c => c.id === block.id)
          ? { ...block, isGenerating: true, job_id: undefined, error: undefined }
          : block
      )
    );

    const BATCH_SIZE = 1;

    type GenerationResult = {
      id: string;
      s3_url: string;
      audioUrl: string;
      duration: number;
      job_id: string;
      error?: undefined;
    } | {
      id: string;
      error: string;
      s3_url?: undefined;
      audioUrl?: undefined;
      duration?: undefined;
      job_id?: undefined;
    };

    const allResults: GenerationResult[] = [];

    for (let i = 0; i < blocksToGenerate.length; i += BATCH_SIZE) {
      const batch = blocksToGenerate.slice(i, i + BATCH_SIZE);

      const generationPromises = batch.map(async (block): Promise<GenerationResult> => {
        const sanitizedText = block.content.blocks.map(b => b.data.text).join(' \n').replace(/[^\u0621-\u064A\u0660-\u0669\u064B-\u0652a-zA-Z0-9\s،.؟]/g, '');
        const selectedVoice = voices.find(v => v.name === block.voice);

        const doGenerate = async (withDiacritics: boolean): Promise<GenerationResult> => {
          if (selectedVoice?.provider === 'ghaymah' && MAINTENANCE_VOICES.includes(selectedVoice.voiceId)) {
            const voiceName = selectedVoice?.characterName || block.voice;
            throw new Error(`Voice "${voiceName}" is currently under maintenance.`);
          }

          if (!selectedVoice) {
            throw new Error(`Voice for block not found. Please re-select a voice.`);
          }

          const provider = selectedVoice.provider;

          const res = await fetch(`/api/tts/generate-segment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: sanitizedText,
              voice: selectedVoice.voiceId,
              provider: provider,
              project_id: projectId,
              user_id: user?.id,
              arabic: withDiacritics,
            }),
          });

          const job = await res.json();
          if (!res.ok) {
            let errorMessage = 'Failed to start generation job.';
            if (job.error) {
              errorMessage = typeof job.error === 'object' ? JSON.stringify(job.error) : job.error;
            }
            throw new Error(errorMessage);
          }

          let status = '';
          while (status !== 'completed' && status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusRes = await fetch(`/api/tts/status/${job.job_id}`);
            const statusData = await statusRes.json();
            status = statusData.status;
          }

          if (status === 'failed') {
            throw new Error(`Generation failed for block: ${block.id}`);
          }

          const audioRes = await fetch(`/api/tts/result/${job.job_id}`);
          if (!audioRes.ok) {
            throw new Error(`Failed to fetch audio result for job: ${job.job_id}`);
          }

          const audioBlob = await audioRes.blob();

          if (audioBlob.size < 1000) {
            throw new Error(`Generation resulted in an empty audio file for job: ${job.job_id}`);
          }

          const s3_url = await uploadAudioSegment(audioBlob, projectId);
          const duration = getMP3Duration(Buffer.from(await audioBlob.arrayBuffer())) / 1000;
          const audioUrl = URL.createObjectURL(audioBlob);

          return { id: block.id, s3_url, audioUrl, duration, job_id: job.job_id };
        };

        try {
          return await doGenerate(block.isArabic || false);
        } catch (error: any) {
          if (error.message.includes('diacritizer')) {
            toast('Diacritization failed for a block, retrying without...', { icon: '⚠️' });
            try {
              setBlocks(currentBlocks =>
                currentBlocks.map(b => b.id === block.id ? { ...b, isArabic: false } : b)
              );
              return await doGenerate(false);
            } catch (retryError: any) {
              return { id: block.id, error: retryError.message };
            }
          }
          toast(`An error occurred for a block, retrying...`, { icon: '⚠️' });
          try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await doGenerate(block.isArabic || false);
          } catch (retryError: any) {
            return { id: block.id, error: retryError.message };
          }
        }
      });

      const batchResults = await Promise.all(generationPromises);
      allResults.push(...batchResults);

      if (i + BATCH_SIZE < blocksToGenerate.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    try {
      setBlocks(currentBlocks => {
        const newBlocks = [...currentBlocks];
        allResults.forEach(result => {
          const blockIndex = newBlocks.findIndex(c => c.id === result.id);
          if (blockIndex !== -1) {
            if (result.error) {
              newBlocks[blockIndex] = {
                ...newBlocks[blockIndex],
                isGenerating: false,
                error: result.error,
              };
            } else {
              newBlocks[blockIndex] = {
                ...newBlocks[blockIndex],
                isGenerating: false,
                s3_url: result.s3_url,
                audioUrl: result.audioUrl,
                duration: result.duration,
                job_id: result.job_id,
                error: undefined,
              };
            }
          }
        });
        return newBlocks;
      });

      const successCount = allResults.filter(r => !r.error).length;
      const failureCount = allResults.length - successCount;

      if (failureCount > 0) {
        toast.error(`Generation failed for ${failureCount} block(s).`, { id: generationToastId });
      }
      if (successCount > 0) {
        toast.success(`Successfully generated audio for ${successCount} block(s).`, { id: generationToastId });
      }

    } catch (e) {
      toast.error('An unexpected error occurred during generation.', { id: generationToastId });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <CenteredLoader message="Loading project..." />;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <audio ref={audioRef} />
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link href="/projects" className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0">
                <ArrowLeft className="h-6 w-6 text-gray-700" />
              </Link>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="text-lg font-semibold text-gray-800 bg-transparent border-0 focus:ring-0 truncate flex-1 min-w-0"
                placeholder="Untitled Project"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleGenerateAll}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Generate'}</span>
              </button>
              {user && (
                <div className="flex items-center gap-2">
                    {subscription && (
                        <div className="text-xs font-medium text-gray-500 pr-2 border-r border-gray-200">
                            <span>{subscription.remaining_chars.toLocaleString()}</span> chars left
                        </div>
                    )}
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-5 relative overflow-hidden ${
                block.isGenerating ? 'opacity-75' : ''
              }`}
            >
              <div
                className="absolute top-0 left-0 h-full bg-indigo-100/50 transition-all duration-100 ease-linear"
                style={{ width: `${activeBlockId === block.id ? progress : 0}%` }}
              ></div>
              {block.isGenerating && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                  <LoaderCircle className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              )}
              {block.error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {block.error}
                </div>
              )}
              <textarea
                className="w-full resize-none border-0 bg-transparent p-1 focus:ring-0 text-gray-900 placeholder:text-gray-400"
                rows={4}
                placeholder="اكتب هنا..."
                value={block.content.blocks[0]?.data?.text || ''}
                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                disabled={block.isGenerating}
              />
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  onClick={() => togglePlay(block)}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                  disabled={(!block.job_id && !block.audioUrl) || loadingAudioId === block.id}
                >
                  {loadingAudioId === block.id ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : activeBlockId === block.id && isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  <span>
                    {loadingAudioId === block.id
                      ? 'Loading...'
                      : activeBlockId === block.id && isPlaying
                      ? 'Pause'
                      : 'Play Audio'}
                  </span>
                </button>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  aria-label="Delete block"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addBlock}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Block</span>
          </button>
        </div>
      </main>
    </div>
  );
}