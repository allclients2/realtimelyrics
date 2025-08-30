import { useRef, useState, useMemo, useEffect } from "react";
import ReactPlayer from "react-player";
import axios from "axios";

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [fileType, setFileType] = useState<"audio" | "video" | null>(null);
  const playerRef = useRef<any>(null);
  const transcriptionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fileUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files ? event.target.files[0] : null;
    if (uploadedFile) {
      setFile(uploadedFile);

      const type = uploadedFile.type.split("/")[0];
      setFileType(type === "audio" || type === "video" ? type : null);

      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", uploadedFile);

      try {
        const response = await axios.post("http://localhost:8000/transcribe", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setTranscription(response.data.transcription);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
  };

  useEffect(() => {
    const currentVerseIndex = transcription?.findIndex(
      (segment: any) => currentTime >= segment.start && currentTime <= segment.end
    );

    if (currentVerseIndex !== -1 && transcriptionRefs.current[currentVerseIndex]) {
      transcriptionRefs.current[currentVerseIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentTime, transcription]);

  return (
    <div className="upload-container" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <h1>Upload an Audio or Video File for Transcription</h1>
      <input type="file" accept="audio/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
      {isUploading && <p>Uploading and transcribing...</p>}
 
      {file && fileUrl && fileType && transcription && (
        <div className="player-transcription-container">
          <div className="media-player">
            <ReactPlayer
              key={fileUrl}
              ref={playerRef}
              url={fileUrl}
              playing={playing}
              progressInterval={10}
              controls
              width="100%"
              height="auto"
              onProgress={handleProgress}
              config={{
                file: {
                  forceAudio: fileType === 'audio',
                  forceVideo: fileType === 'video',
                  attributes: {
                    controlsList: 'nodownload'
                  }
                }
              }}
            />
          </div>

          <div className="transcription">
            {transcription.map((segment: any, index: number) => (
              <div
                ref={(el) => transcriptionRefs.current[index] = el}
                key={index}
                className={`verse ${
                  currentTime >= segment.start && currentTime <= segment.end
                    ? "current"
                    : ""
                }`}
              >
                <span className="verse-timing">
                  [{segment.start.toFixed(2)}s - {segment.end.toFixed(2)}s]
                </span>
                <p>{segment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
