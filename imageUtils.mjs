import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const baseDir = './pre_sharp_imgs';

// Get the list of folders in the base directory
fs.readdir(baseDir, (err, folders) => {
  if (err) {
    console.error('Error reading base directory:', err);
    return;
  }

  console.log('Folders:', folders);

  // Process each folder
  folders.forEach((folder) => {
    const folderPath = path.join(baseDir, folder);

    // Check if the item is a directory and starts with 'V' or 'H'
    if (fs.statSync(folderPath).isDirectory() && (folder[0] === 'V' || folder[0] === 'H')) {
      console.log('Processing folder:', folder);

      // Find the image in the folder
      fs.readdir(folderPath, (err, files) => {
        if (err) {
          console.error(`Error reading directory ${folderPath}:`, err);
          return;
        }

        const imageFile = files.find(file => path.extname(file) === '.webp');
        if (!imageFile) {
          console.error(`No webp image found in folder ${folderPath}`);
          return;
        }

        const imagePath = path.join(folderPath, imageFile);

        // Generate new composited images
        ['2', '3'].forEach(num => {
          const overlayImagePath = path.join(baseDir, `${folder[0]}_${num}.webp`);
          const outputFilePath = path.join(folderPath, `output_${num}.webp`);

          // Resize and overlay images
          Promise.all([
            sharp(imagePath).toBuffer(),
            sharp(overlayImagePath).toBuffer(),
          ])
            .then(([baseImageBuffer, overlayImageBuffer]) => {
              return sharp(baseImageBuffer)
                .composite([{ input: overlayImageBuffer }])
                .toFile(outputFilePath);
            })
            .then(() => {
              console.log(`Composite image created in ${outputFilePath}`);
            })
            .catch((err) => {
              console.error(`Error creating composite image in ${outputFilePath}:`, err);
            });
        });
      });
    }
  });
});
