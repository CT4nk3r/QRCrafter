// The QR spec asks for a blank border of 4 modules around the code; without it some scanners
// cannot find the finder patterns. The on-screen preview gets this from its padding, so the
// exported PNG adds it explicitly.
const QUIET_ZONE_MODULES = 4;

/**
 * Download an SVG element as a PNG image, with a quiet zone around the code
 */
export function downloadQRCode(
  svgElement: SVGSVGElement,
  filename: string = 'qrcode.png',
  bgColor: string = '#FFFFFF',
): void {
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
    // Use the intrinsic size, not the rendered size, so the export resolution
    // doesn't depend on how far the preview is scaled down on small screens
    const svgRect = svgElement.getBoundingClientRect();
    const intrinsicWidth =
      Number(svgElement.getAttribute('width')) || svgRect.width;
    const intrinsicHeight =
      Number(svgElement.getAttribute('height')) || svgRect.height;
    canvas.width = intrinsicWidth * scale;
    canvas.height = intrinsicHeight * scale;

    // Create an image from SVG
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Fill with background color
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the code inset so the export keeps its size and gains a quiet zone
      // (react-qr-code sets viewBox="0 0 N N" with N modules per side)
      const modules = svgElement.viewBox.baseVal.width;
      const inset = modules
        ? (canvas.width * QUIET_ZONE_MODULES) /
          (modules + QUIET_ZONE_MODULES * 2)
        : 0;
      ctx.drawImage(
        img,
        inset,
        inset,
        canvas.width - inset * 2,
        canvas.height - inset * 2,
      );

      // Convert to PNG and download
      canvas.toBlob(pngBlob => {
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
