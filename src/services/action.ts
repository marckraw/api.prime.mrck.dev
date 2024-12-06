import { actions } from "../routes/api/ai/prompts/intentionValidationPrompts"
import { createImageService } from "./images"

export const executeAction = async (action: (typeof actions)[number], payload: any) => {
    switch(action) {
        case "create_image": {
            const imageService = createImageService()
            const imageResponse = await imageService.generateImageWithImprovedPrompt({
                prompt: payload.originalMessage,
            })
            return imageResponse
        }
        default:
            return "Action not found"
    }
}