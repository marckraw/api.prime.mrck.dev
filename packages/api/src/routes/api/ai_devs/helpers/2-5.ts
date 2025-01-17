export const answerQuestion = async (question: string, anton: any) => {
    const response = await anton.chat({
        messages: [
            {
                role: "user",
                // TODO: Change this to use the context that i will gather from the Andrzej Maj Article
                content: "Answer the question using just one sentence. Use your internal knowledge"
            },
            {
                role: "user",
                content: question
            }
        ]
    })

    console.log("This ios rtesponse", response)

    return response
}


export const constructAnswer = async (pytaniaZCentrali: string, anton: any) => {
    const pytaniaZCentraliArray = pytaniaZCentrali.split("\n").filter(Boolean);
    
    const promises = pytaniaZCentraliArray.map(async (question: string) => {
        const [questionNumber, questionText] = question.split("=");
        const questionAnswer = await answerQuestion(questionText, anton);
        return {
            questionNumber,
            answer: questionAnswer[0].content // Access the content from the response
        };
    });

    const results = await Promise.all(promises);
    
    const pytaniaZCentraliObject = results.reduce((acc, {questionNumber, answer}) => {
        acc[`${questionNumber}`] = answer;
        return acc;
    }, {} as any);

    return pytaniaZCentraliObject;
};

