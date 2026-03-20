/**
 * Compresses an image file below a target size (in MB)
 * using the Canvas API.
 */
export async function compressImage(file: File, maxMb: number = 0.9): Promise<File> {
  // If file is already small enough, return it
  if (file.size <= maxMb * 1024 * 1024) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions to help with compression
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Start with 0.7 quality
        let quality = 0.7;
        
        const convertToBlob = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size <= maxMb * 1024 * 1024 || q <= 0.1) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Recursively try lower quality
                  convertToBlob(q - 0.1);
                }
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            q
          );
        };

        convertToBlob(quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
