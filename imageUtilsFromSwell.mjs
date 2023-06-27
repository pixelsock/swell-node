import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const baseDir = './pre_sharp_imgs';

async function downloadImage(imageUrl, imagePath) {
  const response = await axios({
    method: 'GET',
    url: imageUrl,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(imagePath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function generateImage(imageUrl, sensorOption) {
  if (sensorOption === "None") {
    return imageUrl;  // No need to generate a new image for "None" sensor option
  }

  const baseImagePath = path.join(baseDir, 'base_image.webp');
  await downloadImage(imageUrl, baseImagePath);

  const overlayImagePath = path.join(baseDir, `${sensorOption.toLowerCase()}.webp`);
  const outputFilePath = path.join(baseDir, `output_${sensorOption.toLowerCase()}.webp`);

  try {
    const [baseImageBuffer, overlayImageBuffer] = await Promise.all([
      sharp(baseImagePath).toBuffer(),
      sharp(overlayImagePath).toBuffer(),
    ]);

    await sharp(baseImageBuffer)
      .composite([{ input: overlayImageBuffer }])
      .toFile(outputFilePath);

    console.log(`Composite image created in ${outputFilePath}`);

    const newImageUrl = await uploadImageToSwell(outputFilePath);

    return newImageUrl;
  } catch (err) {
    console.error(`Error creating composite image in ${outputFilePath}:`, err);
    throw err;
  }
}

async function uploadImageToSwell(imagePath, variantId) {
  try {
    // Upload the image to Swell and get the response data
    const response = await swell.uploadImage(imagePath);
    const imageData = response.data;

    // Construct the payload to update the variant's image
    const variantUpdatePayload = {
      images: [
        {
          file: {
            url: imageData.url,
            width: imageData.width,
            height: imageData.height,
          },
        },
      ],
    };

    // Update the variant's image using the Swell API
    await swell.put(`/products:variants/${variantId}`, variantUpdatePayload);

    console.log(`Updated variant ${variantId} with new image`);

    // Return the new image URL
    return imageData.url;
  } catch (err) {
    console.error('Failed to update variant image:', err);
    throw err;
  }
}



export { generateImage };
