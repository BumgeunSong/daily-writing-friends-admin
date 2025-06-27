'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import useAudioRecorder from '@/hooks/useAudioRecorder'
import { 
  Play, 
  Trash2, 
  Save, 
  Clock, 
  Loader2,
  Mic,
  Square,
  Pause
} from 'lucide-react'
import { NarrationSection } from '@/types/firestore'
import { useSection } from '@/hooks/useSection'
import { ref, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

interface SectionCardProps {
  narrationId: string
  section: NarrationSection
  sectionIndex: number
}

export function SectionCard({ narrationId, section, sectionIndex }: SectionCardProps) {
  const { updateSection, deleteSection, uploadAudio, isUpdating, isDeleting, isUploading } = useSection(narrationId)
  
  const [title, setTitle] = useState(section.title)
  const [script, setScript] = useState(section.script)
  const [pauseMinutes, setPauseMinutes] = useState(section.pauseMinutes.toString())
  const [isPlaying, setIsPlaying] = useState(false)
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Custom audio recorder hook
  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime
  } = useAudioRecorder({
    noiseSuppression: true,
    echoCancellation: true,
  })

  // Load existing audio file if storagePath exists
  useEffect(() => {
    const loadExistingAudio = async () => {
      if (section.storagePath) {
        setIsLoadingAudio(true)
        try {
          const audioRef = ref(storage, section.storagePath)
          const downloadUrl = await getDownloadURL(audioRef)
          setExistingAudioUrl(downloadUrl)
        } catch (error) {
          console.error('Failed to load existing audio:', error)
          // If audio file doesn't exist, we'll just not show the play button
        } finally {
          setIsLoadingAudio(false)
        }
      }
    }

    loadExistingAudio()
  }, [section.storagePath])

  const handleSaveSection = async () => {
    if (!title.trim() || !script.trim()) {
      toast.error("제목과 스크립트를 모두 입력해주세요.")
      return
    }

    try {
      await updateSection(section.id, {
        title: title.trim(),
        script: script.trim(),
        pauseMinutes: parseInt(pauseMinutes) || 0
      })
      
      toast.success("섹션이 저장되었습니다.")
    } catch (error) {
      console.error('Failed to save section:', error)
      toast.error("섹션 저장에 실패했습니다.")
    }
  }

  const handleDeleteSection = async () => {
    if (!confirm('이 섹션을 삭제하시겠습니까? 녹음된 오디오도 함께 삭제됩니다.')) {
      return
    }

    try {
      await deleteSection(section.id)
      toast.success("섹션이 삭제되었습니다.")
    } catch (error) {
      console.error('Failed to delete section:', error)
      toast.error("섹션 삭제에 실패했습니다.")
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayRecording = () => {
    if (!recordingBlob || !audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      const url = URL.createObjectURL(recordingBlob)
      audioRef.current.src = url
      audioRef.current.play()
      setIsPlaying(true)
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }
    }
  }

  const handlePlayExistingAudio = () => {
    if (!existingAudioUrl || !audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.src = existingAudioUrl
      audioRef.current.play()
      setIsPlaying(true)
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }

  const handleUploadAudio = async () => {
    console.log('🎤 handleUploadAudio called')
    console.log('📦 recordingBlob:', recordingBlob)
    console.log('📄 section:', section)
    console.log('🔢 sectionIndex:', sectionIndex)
    
    if (!recordingBlob) {
      console.log('❌ No recording blob found')
      toast.error("먼저 오디오를 녹음해주세요.")
      return
    }

    console.log('🚀 Starting upload process...')
    try {
      await uploadAudio(section.id, recordingBlob, sectionIndex)
      console.log('🎉 Upload successful!')
      toast.success("오디오가 업로드되었습니다.")
    } catch (error) {
      console.error('💥 Failed to upload audio:', error)
      toast.error("오디오 업로드에 실패했습니다.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>섹션 {sectionIndex + 1}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteSection}
            className="text-destructive hover:text-destructive"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`title-${section.id}`}>섹션 제목</Label>
            <Input
              id={`title-${section.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="섹션 제목을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`pause-${section.id}`}>
              <Clock className="inline h-4 w-4 mr-1" />
              일시정지 (분)
            </Label>
            <Select value={pauseMinutes} onValueChange={setPauseMinutes}>
              <SelectTrigger>
                <SelectValue placeholder="일시정지 시간 선택" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes}분
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`script-${section.id}`}>스크립트</Label>
          <Textarea
            id={`script-${section.id}`}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="내레이션 스크립트를 입력하세요"
            rows={6}
            className="resize-none"
          />
        </div>

        <div className="border-t pt-4">
          <Label className="text-sm font-medium">오디오 녹음</Label>
          <div className="mt-2 space-y-3">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startRecording}
                  disabled={isUploading}
                >
                  <Mic className="h-4 w-4 mr-1" />
                  녹음 시작
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePauseResume}
                    disabled={isUploading}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    {isPaused ? '재개' : '일시정지'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                    disabled={isUploading}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    정지
                  </Button>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {formatTime(recordingTime)} {isPaused && '(일시정지됨)'}
                  </span>
                </div>
              )}
            </div>

            {recordingBlob && !isRecording && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayRecording}
                  disabled={isUploading}
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isPlaying ? '일시정지' : '재생'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUploadAudio}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  {isUploading ? '업로드 중...' : '오디오 저장'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startRecording}
                  disabled={isUploading}
                >
                  <Mic className="h-4 w-4 mr-1" />
                  다시 녹음
                </Button>
              </div>
            )}

            {section.storagePath && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">
                  ✓ 오디오가 저장되었습니다: {section.storagePath}
                </p>
                {existingAudioUrl && !isLoadingAudio && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handlePlayExistingAudio}
                      disabled={isUploading}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {isPlaying ? '일시정지' : '저장된 오디오 재생'}
                    </Button>
                  </div>
                )}
                {isLoadingAudio && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">오디오 로딩 중...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSaveSection} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isUpdating ? '저장 중...' : '섹션 저장'}
          </Button>
        </div>

        <audio ref={audioRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  )
}