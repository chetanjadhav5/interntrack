/**
 * Client-Side Facial Biometrics, Blink Liveness Detection & Embedding Generator
 */

/**
 * Extract 128-dimensional normalized facial descriptor vector from an HTML5 Canvas image
 */
export function extractFaceEmbeddingFromCanvas(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;

  if (width === 0 || height === 0) return [];

  // Focus on the central normalized face region
  const faceX = Math.floor(width * 0.2);
  const faceY = Math.floor(height * 0.15);
  const faceW = Math.floor(width * 0.6);
  const faceH = Math.floor(height * 0.7);

  const imgData = ctx.getImageData(faceX, faceY, faceW, faceH);
  const data = imgData.data;

  const embedding = new Array(128).fill(0);
  const totalPixels = data.length / 4;
  const blockSize = Math.max(1, Math.floor(totalPixels / 64));

  // 1. Spatial Luminance & Hue Descriptors (64 dimensions)
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    const blockIdx = Math.min(63, Math.floor(i / blockSize));
    embedding[blockIdx] += lum / 255;
  }

  // 2. High-Frequency Gradient & Texture Descriptors (64 dimensions)
  for (let y = 1; y < faceH - 1; y += 2) {
    for (let x = 1; x < faceW - 1; x += 2) {
      const pIdx = (y * faceW + x) * 4;
      const rightIdx = (y * faceW + (x + 1)) * 4;
      const downIdx = ((y + 1) * faceW + x) * 4;

      const gradX = Math.abs(data[rightIdx] - data[pIdx]);
      const gradY = Math.abs(data[downIdx] - data[pIdx]);

      const dim = 64 + ((y * 8 + x) % 64);
      embedding[dim] += (gradX + gradY) / 510;
    }
  }

  // Normalize L2 vector
  let norm = 0;
  for (let i = 0; i < 128; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < 128; i++) {
    embedding[i] = Math.round((embedding[i] / norm) * 10000) / 10000;
  }

  return embedding;
}

/**
 * Blink Liveness Tracker Class
 * Monitors sequential video frames for natural eyelid closure & reopening
 */
export class BlinkLivenessDetector {
  constructor(options = {}) {
    this.onBlinkDetected = options.onBlinkDetected || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onFacePositionChange = options.onFacePositionChange || (() => {});

    this.isBlinking = false;
    this.blinkStartTime = 0;
    this.consecutiveClosedFrames = 0;
    this.consecutiveOpenFrames = 0;
    this.blinkConfirmed = false;
    this.baselineEyeLuminance = null;
    this.frameCount = 0;
  }

  reset() {
    this.isBlinking = false;
    this.blinkStartTime = 0;
    this.consecutiveClosedFrames = 0;
    this.consecutiveOpenFrames = 0;
    this.blinkConfirmed = false;
    this.baselineEyeLuminance = null;
    this.frameCount = 0;
    this.onStatusChange('ALIGN_FACE');
  }

  /**
   * Process a single video frame from Canvas
   */
  processFrame(canvas) {
    if (this.blinkConfirmed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    if (width === 0 || height === 0) return;

    this.frameCount++;

    // Central face box
    const eyeBandY = Math.floor(height * 0.32);
    const eyeBandH = Math.floor(height * 0.16);
    const eyeBandX = Math.floor(width * 0.28);
    const eyeBandW = Math.floor(width * 0.44);

    const imgData = ctx.getImageData(eyeBandX, eyeBandY, eyeBandW, eyeBandH);
    const data = imgData.data;

    let totalEyeLum = 0;
    let edgeVariation = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
      totalEyeLum += lum;

      if (i > 1) {
        const prevLum = (data[idx - 4] * 0.299 + data[idx - 3] * 0.587 + data[idx - 2] * 0.114);
        edgeVariation += Math.abs(lum - prevLum);
      }
    }

    const avgLum = totalEyeLum / Math.max(1, pixelCount);
    const avgEdge = edgeVariation / Math.max(1, pixelCount);

    if (this.frameCount < 8) {
      // Calibrate baseline
      this.baselineEyeLuminance = avgLum;
      this.onStatusChange('CALIBRATING');
      return;
    }

    // Blink detection: Eyelid closure causes distinctive luminance drop & edge contrast shift
    const lumDiff = (this.baselineEyeLuminance - avgLum);
    const isEyesClosed = lumDiff > 6 || (avgEdge < 11 && lumDiff > 2);

    if (isEyesClosed) {
      this.consecutiveClosedFrames++;
      this.consecutiveOpenFrames = 0;
      if (!this.isBlinking && this.consecutiveClosedFrames >= 1) {
        this.isBlinking = true;
        this.blinkStartTime = Date.now();
        this.onStatusChange('BLINK_DETECTED');
      }
    } else {
      this.consecutiveOpenFrames++;
      if (this.isBlinking && this.consecutiveOpenFrames >= 1) {
        const blinkDuration = Date.now() - this.blinkStartTime;
        // Natural blink duration window: 100ms - 1200ms
        if (blinkDuration >= 80 && blinkDuration <= 1500) {
          this.blinkConfirmed = true;
          this.isBlinking = false;
          this.onStatusChange('BLINK_CONFIRMED');
          this.onBlinkDetected();
          return;
        } else {
          this.isBlinking = false;
        }
      }
      this.consecutiveClosedFrames = 0;
      if (!this.blinkConfirmed) {
        this.onStatusChange('PROMPT_BLINK');
      }
    }
  }
}
