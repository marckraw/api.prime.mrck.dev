import fs from "fs";

const createImageService = () => {
  // Public methods
  const test = async () => {
    return "test";
  };

  const getImageAsBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  };

  const getImageAsBase64FromLocalFile = async (
    imageUrl: string
  ): Promise<string> => {
    const fileBuffer = await fs.readFileSync(imageUrl);
    const buffer = Buffer.from(fileBuffer);
    return buffer.toString("base64");
  };

  const imageContentFromBase64 = async (
    base64Image: string,
    company: string
  ) => {
    if (company === "openai") {
      return {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
          detail: "high",
        },
      };
    } else if (company === "anthropic") {
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Image,
        },
      };
    }
  };

  const imageContent = async ({
    imageUrl,
    company,
  }: {
    imageUrl: string;
    company: string;
  }) => {
    if (company === "openai") {
      return {
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      };
    } else if (company === "anthropic") {
      const convertedBase64Image = await getImageAsBase64(imageUrl as string);
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: convertedBase64Image,
        },
      };
    }
  };

  // Return public interface
  return {
    test,
    getImageAsBase64,
    imageContentFromBase64,
    imageContent,
    getImageAsBase64FromLocalFile,
  };
};

export { createImageService };
export const imageService = createImageService();
