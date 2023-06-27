import { generateImage } from './imageUtilsFromSwell.mjs';
import swell from 'swell-node';

swell.init('matrix', '75Xly12eYCN0MEiv7M7NZl3hOkYTnUob');

const styles = ["Full Frame Inset"];
const orientations = ["Vertical", "Horizontal"];

async function updateVariantImages(style, orientation) {
  try {
    const variants = await getProductVariants(style, orientation);
    for (let variant of variants) {
      const newImageUrl = await generateImage(variant.imageUrl, variant.sensorOption);
      await updateProductVariant(variant.id, newImageUrl);
    }
    console.log(`Updated ${variants.length} product variants for ${style} style with ${orientation} orientation.`);
  } catch (err) {
    console.error(`Failed to update product variants for ${style} style with ${orientation} orientation:`, err);
  }
}

async function getProductVariants(style, orientation) {
  try {
    const response = await swell.get('/products:variants', {
      where: {
        name: {
          $regex: `^(?=.*Black\\sMetal)(?=.*${style})(?=.*Thin)(?=.*${orientation}\\sMounting)(?=.*None).*`,
          $options: "i"
        }
      },
      page: 1
    });
    return response.results;
  } catch (err) {
    console.error(`Failed to fetch product variants for ${style} style with ${orientation} orientation:`, err);
    return [];
  }
}

async function updateProductVariant(variantId, newImageUrl) {
  try {
    await swell.put(`/products:variants/${variantId}`, {
      images: [{ file: { url: newImageUrl } }]
    });
    console.log(`Updated variant ${variantId}`);
  } catch (err) {
    console.error(`Failed to update variant ${variantId}:`, err);
  }
}

async function updateAllProductVariants() {
  for (let style of styles) {
    for (let orientation of orientations) {
      await updateVariantImages(style, orientation);
    }
  }
}

updateAllProductVariants();
