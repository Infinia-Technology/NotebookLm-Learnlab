from faster_whisper import WhisperModel
import sys

audio_file = "/tmp/test_speech.wav"
print(f"Loading Whisper model to transcribe {audio_file}...")
model = WhisperModel("base", device="cpu", compute_type="int8")

print("Transcribing with VAD enabled...")
segments, info = model.transcribe(
    audio_file,
    beam_size=5,
    language="en",
    condition_on_previous_text=False,
    vad_filter=True,
    vad_parameters=dict(min_silence_duration_ms=2000, speech_pad_ms=400)
)

text_out = []
for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
    text_out.append(segment.text)

final_text = " ".join(text_out).strip()
print("\nFINAL TRANSCRIPTION:")
print(f"'{final_text}'")
