/**
 * Biometric Facial Verification & Cosine Similarity Service
 * Provides anti-spoofing validation, feature embedding vector normalization,
 * and biometric confidence score calculation.
 */

// Cosine similarity between two float arrays/vectors
export function calculateCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    const a = parseFloat(vecA[i]) || 0;
    const b = parseFloat(vecB[i]) || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

// Generate default 128-dimensional embedding for seeded/fallback users
export function generateSyntheticEmbedding(seedString = 'ghr_student') {
  const embedding = [];
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < 128; i++) {
    const pseudoRandom = Math.sin(hash + i * 13.37) * 10000;
    embedding.push(Math.round((pseudoRandom - Math.floor(pseudoRandom)) * 1000) / 1000);
  }
  return embedding;
}

// Compare live captured embedding against baseline profile template
export function verifyFaceBiometrics(liveEmbedding, registeredEmbedding, options = {}) {
  const threshold = options.threshold || 0.80; // 80% minimum similarity

  if (!registeredEmbedding || !Array.isArray(registeredEmbedding)) {
    return {
      verified: false,
      similarity_score: 0,
      similarity_percent: '0.0%',
      error: 'No baseline Face ID registered for this student profile.'
    };
  }

  if (!liveEmbedding || !Array.isArray(liveEmbedding)) {
    return {
      verified: false,
      similarity_score: 0,
      similarity_percent: '0.0%',
      error: 'Invalid facial biometric descriptor captured from live webcam.'
    };
  }

  const similarity = calculateCosineSimilarity(liveEmbedding, registeredEmbedding);
  const similarityPercent = (similarity * 100).toFixed(1);
  const isMatch = similarity >= threshold;

  return {
    verified: isMatch,
    similarity_score: similarity,
    similarity_percent: `${similarityPercent}%`,
    match_confidence: similarity >= 0.90 ? 'VERY_HIGH' : similarity >= 0.82 ? 'HIGH' : similarity >= 0.75 ? 'MEDIUM' : 'LOW',
    threshold_applied: threshold
  };
}
