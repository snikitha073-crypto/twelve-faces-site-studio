// Browser-only speech playback for AI opponents. Call only from effects or event handlers.
import type { VoiceProfile } from "./characters";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function pickVoice(profile: VoiceProfile): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!voices.length) return null;
  for (const hint of profile.voiceHints) {
    const match = voices.find((v) => v.name.toLowerCase().includes(hint.toLowerCase()));
    if (match) return match;
  }
  return voices[0] ?? null;
}

/** Strips markdown-ish symbols so the voice doesn't read them out. */
export function speakableText(text: string): string {
  return text.replace(/[*_#`>~]/g, "").replace(/\s+/g, " ").trim();
}

export function speak(text: string, profile: VoiceProfile, onEnd?: () => void): void {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(speakableText(text));
  const voice = pickVoice(profile);
  if (voice) utterance.voice = voice;
  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
