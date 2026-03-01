/**
 * Download an SVG element as a PNG image
 */
export function downloadQRCode(svgElement: SVGSVGElement, filename: string = 'qrcode.png'): void {
  try {
    // Get the SVG data
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas size (increase for higher resolution)
    const scale = 4; // 4x resolution for better quality
    const svgRect = svgElement.getBoundingClientRect();
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;
    
    // Create an image from SVG
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image scaled up
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to PNG and download
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = pngUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup
          URL.revokeObjectURL(pngUrl);
        }
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  } catch (error) {
    console.error('Failed to download QR code:', error);
  }
}
