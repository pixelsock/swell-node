import { generateImage } from './imageUtilsFromSwell.mjs';
import swell from 'swell-node';

swell.init('matrix', '75Xly12eYCN0MEiv7M7NZl3hOkYTnUob');

const sensorOptions = ["None", "Double", "Triple"];

async function getProductVariants(style, orientation, sensorOption) {
    try {
        let page = 1;
        let allVariants = [];

        while (true) {
            const response = await swell.get('/products:variants', {
                where: {
                    name: {
                        $regex: `^(?=.*Black\\sMetal)(?=.*${style})(?=.*Thin)(?=.*${orientation}\\sMounting)(?=.*${sensorOption}).*`,
                        $options: "i"
                    }
                },
                page
            });

            const variants = response.results;
            allVariants = allVariants.concat(variants);

            if (!response.pages[page + 1]) {
                break; // No more pages available, exit the loop
            }

            page++;
        }

        console.log(allVariants); // Add this line to log all the retrieved variants

        return allVariants;
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function updateProductVariant(baseImageUrl, variant, sensorOption) {
    try {
        // Generate the new image URL
        const newImageUrl = await generateImage(baseImageUrl, sensorOption);

        // Update the variant with the new image URL
        await swell.put(`/products:variants/${variant.id}`, {
            id: variant.id,
            name: variant.name,
            parent_id: variant.parent_id,
            images: [
                {
                    file: {
                        url: newImageUrl
                    }
                }
            ]
        });

        console.log(`Updated variant ${variant.id}`);
    } catch (err) {
        console.error(`Failed to update variant ${variant.id}:`, err);
    }
}

export async function updateVariantImages(style, orientation) {
    for (let sensorOption of sensorOptions) {
        if (sensorOption === "None") continue;  // Skip "None" since these are the base images

        const baseVariants = await getProductVariants(style, orientation, "None");
        const variants = await getProductVariants(style, orientation, sensorOption);

        for (let variant of variants) {
            for (let baseVariant of baseVariants) {
                // Check if the base variant has an image before processing
                if (!baseVariant.images || baseVariant.images.length === 0) continue;

                const baseImageUrl = baseVariant.images[0].file.url;
                await updateProductVariant(baseImageUrl, variant, sensorOption);
            }
        }
    }

    console.log(`Updated all product variants for ${style} style with ${orientation} orientation.`);
}
