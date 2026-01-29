// Convert Blob to Base64 string
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data url prefix (e.g. "data:audio/wav;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  // Audio Decoding for TTS (PCM to AudioBuffer)
  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  export async function playPCMData(
    base64Audio: string, 
    audioContext: AudioContext
  ): Promise<void> {
    try {
        const bytes = decode(base64Audio);
        
        // Gemini TTS returns raw PCM 24kHz mono (usually)
        // We need to decode this raw data. 
        // Note: The @google/genai documentation example constructs an Int16Array and then float conversion.
        // However, the simplest way for standard PCM responses in browser is often treating it as raw buffer if we know format,
        // or using decodeAudioData if it had a header. 
        // Gemini API `gemini-2.5-flash-preview-tts` returns raw PCM.
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const sampleRate = 24000;
        const numChannels = 1;
        const frameCount = dataInt16.length / numChannels;
        
        const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
        
        for (let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
            // Convert Int16 to Float32 [-1.0, 1.0]
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
          }
        }
  
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        
    } catch (e) {
        console.error("Error playing audio", e);
    }
  }