from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile
import os
import torch
from pydantic import BaseModel
from io import BytesIO


app = FastAPI()

# cors policy @ any
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_size = "large-v3-turbo"  #"large-v3"
model = WhisperModel(model_size, device="cuda" if torch.cuda.is_available() else "cpu", compute_type="float16")

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio_file:
        temp_audio_file.write(audio_bytes)
        temp_path = temp_audio_file.name

    segments, info = model.transcribe(temp_path, beam_size=5)

    srt_output = []
    transcription = []

    def format_timestamp(seconds):
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds - int(seconds)) * 1000)
        return f"{h:02}:{m:02}:{s:02},{ms:03}"

    for idx, segment in enumerate(segments, start=1):
        start_time = format_timestamp(segment.start)
        end_time = format_timestamp(segment.end)
        text = segment.text.strip()

        transcription.append({
            "start": segment.start,
            "end": segment.end,
            "text": text
        })

        srt_output.append(
            f"{idx}\n{start_time} --> {end_time}\n{text}\n"
        )

    os.remove(temp_path)

    return {
        "language": info.language,
        "transcription": transcription,
        "srt": "".join(srt_output)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
