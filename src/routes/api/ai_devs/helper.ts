import { AntonSDK } from "@mrck-labs/anton-sdk";

export const antonAnswerAgent = async (chunk) => {
    const anton = AntonSDK.create({
        model: "claude-3-5-sonnet-20240620",
        apiKey: process.env.ANTHROPIC_API_KEY as string,
        type: "anthropic",
    });

    anton.setSystemMessage?.(`
        Answer the questions in test key and return the same structure but with answer in "a" key. Return only the structure in JSON format. And nothing else.
        <structure>
        { 
            question: ..., 
            answer: ..., 
            test: {
                "q": ...,
                "a": ...
            } 
        }
        </structure>
    `)

    const antonAnswer = await anton.chat({
        messages: [
            {
                role: "user",
                content: JSON.stringify(chunk)
            }
        ]
    })

    const dataWithAnswers = antonAnswer[0].content

    return JSON.parse(dataWithAnswers)
}

export const findAndAnswerQuestions = async (data: any) => {
    const testData = data['test-data']

    const dataWithAnswers = await Promise.all(testData.map(async (chunk) => {
        if(chunk.test) {
            console.log("Answering question", chunk)
            return await antonAnswerAgent(chunk)
        }
        
        return chunk
    }))

    return {
        ...data,
        'test-data': dataWithAnswers
    }
}

export const checkCalculationsErrors = (data: any) => {
    const testData = data['test-data']

    const dataWithCorrectedAnswers = testData.map((chunk: any) => {
        const calculation = chunk.question.split(" ")
        const firstNumber = parseInt(calculation[0])
        const operator = calculation[1]
        const secondNumber = parseInt(calculation[2])

        let result = 0;

        if(operator === "+") {
            result = firstNumber + secondNumber
        } else if(operator === "-") {
            result = firstNumber - secondNumber
        } else if(operator === "*") {
            result = firstNumber * secondNumber
        } else if(operator === "/") {
            result = firstNumber / secondNumber
        }

        if(result === chunk.answer ) {
            return chunk
        } else {
            console.log("--------------------------------")
            console.log("Wrong structure: !")
            console.log(chunk)
            console.log("Corrected structure: ", {
                ...chunk,
                answer: result
            })
            console.log("--------------------------------")
            return {
                ...chunk,
                answer: result
            }
        }
    })

    return {
        ...data,
        'test-data': dataWithCorrectedAnswers
    }
}