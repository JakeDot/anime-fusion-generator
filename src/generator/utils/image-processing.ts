export const processTransparency = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Remove white/near-white pixels
        if (r > 245 && g > 245 && b > 245) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => resolve(base64);
  });
};

export const compressImageForFirestore = (base64: string, maxSizeKB: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Scale down if image is too large (e.g., > 1024px)
      const MAX_DIMENSION = 1024;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      
      // Fill with white background in case of transparency to JPEG conversion
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try to compress as JPEG
      let quality = 0.8;
      let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      // Calculate approximate size in bytes (base64 length * 0.75)
      let approxSizeKB = (compressedBase64.length * 0.75) / 1024;
      
      // Reduce quality if still too large
      while (approxSizeKB > maxSizeKB && quality > 0.1) {
        quality -= 0.1;
        compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        approxSizeKB = (compressedBase64.length * 0.75) / 1024;
      }
      
      resolve(compressedBase64);
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};
