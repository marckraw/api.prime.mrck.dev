import fs from "fs";

const createImageServerService = () => {
  const getImageAsBase64FromLocalFile = async (
    imageUrl: string
  ): Promise<string> => {
    const fileBuffer = await fs.readFileSync(imageUrl);
    const buffer = Buffer.from(fileBuffer);
    return buffer.toString("base64");
  };

  // Return public interface
  return {
    getImageAsBase64FromLocalFile,
  };
};

export { createImageServerService };
export const imageServerService = createImageServerService();
