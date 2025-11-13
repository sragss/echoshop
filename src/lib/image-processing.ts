import sharp from 'sharp';

/**
 * Process an image for Sora video generation
 * - Crops to target aspect ratio (center crop)
 * - Upscales if too small
 * - Downscales if too large
 *
 * @param imageBuffer - Input image buffer
 * @param targetSize - Target dimensions ('720x1280' for portrait, '1280x720' for landscape)
 * @returns Processed image buffer ready for Sora
 */
export async function processImageForSora(
  imageBuffer: Buffer,
  targetSize: '720x1280' | '1280x720'
): Promise<Buffer> {
  // Parse target dimensions
  const [targetWidth, targetHeight] = targetSize.split('x').map(Number);
  if (!targetWidth || !targetHeight) {
    throw new Error(`Invalid target size: ${targetSize}`);
  }

  const targetAspect = targetWidth / targetHeight;

  // Load image and get metadata
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  const currentAspect = metadata.width / metadata.height;

  // Determine if we need to crop
  let processedImage = image;

  if (Math.abs(currentAspect - targetAspect) > 0.01) {
    // Aspect ratios don't match - need to crop
    let cropWidth: number;
    let cropHeight: number;

    if (currentAspect > targetAspect) {
      // Image is wider than target - crop width
      cropHeight = metadata.height;
      cropWidth = Math.round(cropHeight * targetAspect);
    } else {
      // Image is taller than target - crop height
      cropWidth = metadata.width;
      cropHeight = Math.round(cropWidth / targetAspect);
    }

    // Center crop
    processedImage = image.extract({
      left: Math.round((metadata.width - cropWidth) / 2),
      top: Math.round((metadata.height - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight,
    });
  }

  // Resize to target dimensions
  // Sharp will upscale or downscale as needed
  processedImage = processedImage.resize(targetWidth, targetHeight, {
    fit: 'fill', // Fill the exact dimensions (we already cropped to correct aspect)
    kernel: 'lanczos3', // High-quality resampling
  });

  // Convert to PNG for consistent output
  processedImage = processedImage.png({
    quality: 100,
    compressionLevel: 6,
  });

  // Return processed buffer
  return await processedImage.toBuffer();
}
