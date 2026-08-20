/**
 * Utility function to view or download uploaded PDF documents and images
 * Supports both standard URLs (http/https) and Base64 Data URLs (data:application/pdf;base64,...)
 */
export function viewOrDownloadPdf(fileUrl, defaultFilename = 'document.pdf') {
  if (!fileUrl) {
    alert('No document file attached.');
    return;
  }

  // If standard HTTP/HTTPS URL
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // If Base64 Data URL
  try {
    const parts = fileUrl.split(',');
    const mimeMatch = fileUrl.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const base64Data = parts.length > 1 ? parts[1] : parts[0];

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const win = window.open(blobUrl, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      // Fallback if browser blocks popups: trigger direct download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (err) {
    console.error('Error opening document blob:', err);
    // Fallback
    window.open(fileUrl, '_blank');
  }
}
