import { Hono } from "hono";
import { AntonSDK } from "@mrck-labs/anton-sdk";
import { zValidator } from "@hono/zod-validator";
import { aiDevsExampleSchema } from "./validators/aiDevs";
import fs from "fs";
import {
  AI_DEVS_API_KEY,
  AI_DEVS_XYZ_COMPANY_VERIFY_URL,
  POLIGON_API_KEY,
  POLIGON_API_URL,
  AI_DEVS_SYSTEM_ROBOTOW_URL,
  AI_DEVS_SYSTEM_ROBOTOW_URL_PASSWORD,
  AI_DEVS_SYSTEM_ROBOTOW_URL_LOGIN,
  AI_DEVS_CENZURA_URL,
  AI_DEVS_CENTRALA_URL,
} from "./constants";
import { POLIGON_API_VERIFY_URL } from "./constants";
import { checkCalculationsErrors } from "./helper";
import { findAndAnswerQuestions } from "./helper";
import { imageService } from "../../../services/ImageService/image.service";

const aiDevs = new Hono();

aiDevs.post("/example", zValidator("json", aiDevsExampleSchema), async (c) => {
  const requestData = c.req.valid("json");

  const anton = AntonSDK.create({
    model: "claude-3-5-sonnet-20240620",
    apiKey: process.env.ANTHROPIC_API_KEY as string,
    type: "anthropic",
  });

  const response = await anton.chat({
    messages: requestData.messages,
  });

  return c.json({ response });
});

aiDevs.get("/0-1", async (c) => {
  const response = await fetch(POLIGON_API_URL + "/dane.txt");
  const data = await response.text();

  const answer = data
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");

  const responseFromPoligonApi = await fetch(POLIGON_API_VERIFY_URL, {
    method: "POST",
    body: JSON.stringify({
      task: "POLIGON",
      apikey: POLIGON_API_KEY,
      answer,
    }),
  });

  const responseFromPoligonApiJson = await responseFromPoligonApi.json();

  return c.json({ response: responseFromPoligonApiJson });
});

aiDevs.get("/1-1", async (c) => {
  console.log("AI DEVS 1-1");
  const response = await fetch(AI_DEVS_SYSTEM_ROBOTOW_URL as string);
  console.log("This is html");
  const html = await response.text();

  console.log("This is html");

  console.log(html);

  // Using regex to parse HTML since we're in an edge environment
  // where DOM parsing libraries may not be available
  const idPattern = /<[^>]*id="([^"]*)"[^>]*>(.*?)<\/[^>]*>/g;
  const matches = [...html.matchAll(idPattern)];

  console.log(matches);

  const contentById: Record<string, string[]> = {};
  matches.forEach((match) => {
    const id = match[1];
    const fullContent = match[2].trim();
    if (!contentById[id]) {
      contentById[id] = [];
    }
    if (fullContent) {
      contentById[id].push(fullContent);
    }
  });

  const question = contentById["human-question"];

  const anton = AntonSDK.create({
    model: "claude-3-5-sonnet-20240620",
    apiKey: process.env.ANTHROPIC_API_KEY as string,
    type: "anthropic",
  });

  const answerResponse: any = await anton.chat({
    messages: [
      {
        role: "assistant",
        content:
          "You are a helpful assistant that can answer questions and help with tasks. Your answers are conscise and to the point, without any additional information.",
      },
      {
        role: "user",
        content: question[0],
      },
    ],
  });

  const answer = answerResponse[0].content;

  console.log(process.env.AI_DEVS_SYSTEM_ROBOTOW_URL);

  console.log("To send: ");
  console.log({
    login: AI_DEVS_SYSTEM_ROBOTOW_URL_LOGIN,
    password: AI_DEVS_SYSTEM_ROBOTOW_URL_PASSWORD,
    answer,
  });

  const formData = new URLSearchParams();
  formData.append("username", AI_DEVS_SYSTEM_ROBOTOW_URL_LOGIN as string);
  formData.append("password", AI_DEVS_SYSTEM_ROBOTOW_URL_PASSWORD as string);
  formData.append("answer", answer);

  const loginToSite = await fetch(AI_DEVS_SYSTEM_ROBOTOW_URL as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const finalAnswer = await loginToSite.text();
  console.log(finalAnswer);

  // Parse HTML string to find href attributes using regex
  const hrefPattern = /href=["']([^"']+)["']/g;
  const hrefMatches = [...finalAnswer.matchAll(hrefPattern)];
  const finalHref = hrefMatches
    .map((match) => match[1])
    .find((match) => match.includes("files"));

  return c.json({
    response: {
      question,
      answer,
      finalUrl: `${(AI_DEVS_SYSTEM_ROBOTOW_URL as string) + finalHref}`,
    },
  });
});

aiDevs.get("/1-2", async (c) => {
  const startMsgID = 0;
  const body = {
    msgID: startMsgID,
    text: "READY",
  };

  const robotInstructions = await fetch(
    "https://xyz.ag3nts.org/files/0_13_4b.txt"
  );
  const robotInstructionsText = await robotInstructions.text();

  let verificationResponse = await fetch(AI_DEVS_XYZ_COMPANY_VERIFY_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const verificationResponseJson = await verificationResponse.json();

  const conversationId = verificationResponseJson.msgID;

  console.log("This is the response and question: ", verificationResponseJson);

  const anton = AntonSDK.create({
    model: "claude-3-5-sonnet-20240620",
    apiKey: process.env.ANTHROPIC_API_KEY as string,
    type: "anthropic",
  });

  if (!anton) {
    return c.json(
      {
        response: {
          error: "Something went wrong while creating Anton SDK instance",
        },
      },
      500
    );
  }

  anton.setSystemMessage?.(robotInstructionsText);

  const incorrectPieces = await anton.chat({
    messages: [
      {
        role: "user",
        content:
          "Given your system message find intentionally incorrect pieces of information and return them in a list.",
      },
    ],
  });

  anton.setSystemMessage?.(`
            Here is the list of intentionally incorrect pieces of information:
            ${incorrectPieces[0].content}
            You will be using them to answer some questions.
            Remember to always speak in english, never in any other language.
            Return always just an answer and nothing more.
            Be concise and straight forward.
            `);

  const antonResponse = await anton.chat({
    messages: [
      {
        role: "user",
        content: `
                    Answer the question:
                    <question>
                    ${verificationResponseJson.text}
                    </question>
                    `,
      },
    ],
  });

  if (!antonResponse) {
    return c.json(
      {
        response: {
          error: "Something went wrong while creating Anton SDK instance",
        },
      },
      500
    );
  }

  console.log("ANSWER: ");
  console.log(antonResponse);

  const response = await fetch(AI_DEVS_XYZ_COMPANY_VERIFY_URL, {
    method: "POST",
    body: JSON.stringify({
      msgID: conversationId,
      text: antonResponse[0].content,
    }),
  });

  const finalResponse = await response.json();

  console.log("This is the final response: ", finalResponse);

  return c.json({ response: finalResponse });
});

aiDevs.get("/1-3", async (c) => {
  const response = await fetch(
    `https://centrala.ag3nts.org/data/${process.env.AI_DEVS_API_KEY}/json.txt`
  );
  const responseJson = await response.json();

  let data = await findAndAnswerQuestions(responseJson);
  data = checkCalculationsErrors(data);
  data = {
    ...data,
    apikey: AI_DEVS_API_KEY,
  };

  const finalResponse = await fetch(AI_DEVS_CENTRALA_URL, {
    method: "POST",
    body: JSON.stringify({
      task: "JSON",
      apikey: AI_DEVS_API_KEY,
      answer: data,
    }),
  });

  const finalResponseJson = await finalResponse.json();

  return c.json({ response: finalResponseJson });
});

aiDevs.get("/1-4", async (c) => {
  const myFinalPromptForRobot = `
        - You are the robot that can move UP, DOWN, RIGHT, LEFT
        - Your job is to return a JSON with list of steps in steps key, comma separated to reach the finish place.
        - map is represented as 2 dimensional array
        - example of 1 step:
        moving UP from the initial position is changing your position ([3,0]) to position: ([2, 0])
        <MAP>
        [
        [ROAD,WALL,ROAD,ROAD,ROAD,ROAD],
        [ROAD,ROAD,ROAD,WALL,ROAD,ROAD],
        [ROAD,WALL,ROAD,WALL,ROAD,ROAD],
        [YOU,WALL,ROAD,ROAD,ROAD,FINISH]
        ]
        </MAP>

        <LEGEND>
        ROAD - Space where you can step in
        WALL - wall, avoid stepping on it at all cost!
        FINISH - Finish position
        YOU - You
        </LEGEND>

        <thinking>your's thinking</thinking>
        <RESULT>
        {
        steps: "UP, RIGHT, etc..."
        }
        </RESULT>
        `;
  return c.json({ response: myFinalPromptForRobot });
});

aiDevs.get("/1-5", async (c) => {
  const cenzuraResponse = await fetch(AI_DEVS_CENZURA_URL);
  const cenzuraResponseText = await cenzuraResponse.text();

  console.log(cenzuraResponseText);

  const anton = AntonSDK.create({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string,
    type: "openai",
  });

  const antonResponse = await anton.chat({
    messages: [
      {
        role: "user",
        content:
          "Please make sure the data is censored. Return whole text with personal data replaced with CENZURA word.",
      },
      {
        role: "user",
        content: cenzuraResponseText,
      },
    ],
  });

  console.log(antonResponse);
  const finalResponse = antonResponse[0].content;

  console.log("This is what we send: ");
  console.log({
    task: "CENZURA",
    apikey: AI_DEVS_API_KEY,
    answer: finalResponse,
  });

  const responseFromCentrala = await fetch(
    "https://centrala.ag3nts.org/report ",
    {
      method: "POST",
      body: JSON.stringify({
        task: "CENZURA",
        apikey: AI_DEVS_API_KEY,
        answer: finalResponse,
      }),
    }
  );

  const responseFromCentralaJson = await responseFromCentrala.json();

  return c.json({ response: responseFromCentralaJson });
});

aiDevs.get("/2-1", async (c) => {
  // 1. generate transcript from mp3 file
  // 2. build common context for my prompt
  // 3. find an answer about on what street is profesor Maj teaching
  // 4.

  const anton = AntonSDK.create({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string,
    type: "openai",
  });

  const audio_file_path = `${process.cwd()}/local_files/przesluchania/adam.m4a`;
  console.log(audio_file_path);

  // Read file into a Buffer
  //   const fileBuffer = await fs.readFileSync(audio_file_path);
  const przesluchania_dir = `${process.cwd()}/local_files/przesluchania`;

  // Read all files in directory
  const files = fs.readdirSync(przesluchania_dir);

  console.log("This is files");
  console.log(files);

  // Process each file
  const transcripts = await Promise.all(
    files.map(async (file_name) => {
      const file_path = `${przesluchania_dir}/${file_name}`;

      try {
        // Get transcript for each audio file
        const transcript = await anton.transcribeAudio(file_path);

        // Save transcript to file
        // const transcript_path = `${przesluchania_dir}/${
        //   file_name.split(".")[0]
        // }_transcript.txt`;
        // await fs.promises.writeFile(transcript_path, transcript);

        return {
          file_name,
          transcript,
          success: true,
        };
      } catch (error) {
        console.error(`Error processing file ${file_name}:`, error);
        return {
          file_name,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        };
      }
    })
  );

  const successful_transcripts = transcripts.filter((t) => t.success);
  const failed_transcripts = transcripts.filter((t) => !t.success);

  console.log(`Successfully processed ${successful_transcripts.length} files`);
  if (failed_transcripts.length > 0) {
    console.log(
      `Failed to process ${failed_transcripts.length} files:`,
      failed_transcripts
    );
  }

  const promptPrzesluchania = `Below are testimonies from different people. Analyze carefully the information they provide.

        Please follow these rules:
        - Asses who is telling the truth
        - Resolve conflicts between testimonies
        - Find a institute name
        - Make sure to find a correct insitute name that Andrzej Maj teaches (not only the university name)
        - Use your own knowledge of geography to answer what is the street name of the institute that Andrzej Maj teaches

          <testimonies>
          ${successful_transcripts.map((t) => {
            const imie = t.file_name.split(".")[0];
            return `
                testimony from ${imie}
                ${t.transcript.text}
                ______________________
                `;
          })}
          </testimonies>

          Return strictly and exclusively the answer to the question (street name). No explanations. No other information.

          Make sure you take you time to analyze and think about all this information.
          `;

  //   Return your way of thinking and analysis. and the correct answer.

  //   console.log(promptPrzesluchania);

  const antonResponse = await anton.chat({
    messages: [
      {
        role: "user",
        content: promptPrzesluchania,
      },
    ],
  });
  //   const transcript = await anton.transcribeAudio(audio_file_path);
  //   console.log(transcript);

  //     messages: [
  //       {
  //         role: "user",
  //         content:
  //           "Please make sure the data is censored. Return whole text with personal data replaced with CENZURA word.",
  //       },
  //     ],
  //   });

  //   console.log(antonResponse);
  //   const finalResponse = antonResponse[0].content;

  console.log("This is what we send: ");
  console.log({
    task: "mp3",
    apikey: AI_DEVS_API_KEY,
    answer: antonResponse[0].content,
  });

  const responseFromCentrala = await fetch(
    "https://centrala.ag3nts.org/report",
    {
      method: "POST",
      body: JSON.stringify({
        task: "mp3",
        apikey: AI_DEVS_API_KEY,
        answer: antonResponse[0].content,
      }),
    }
  );

  const responseFromCentralaJson = await responseFromCentrala.json();

  console.log("This is response from centrala");
  console.log(responseFromCentralaJson);

  //   const responseFromCentralaJson = await responseFromCentrala.json();

  return c.json({
    response: {
      responseFromCentrala: responseFromCentralaJson,
      antonResponse: antonResponse,
      successful_transcripts,
      failed_transcripts,
      promptPrzesluchania,
    },
  });
});

aiDevs.get("/2-2", async (c) => {
  const anton = AntonSDK.create({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string,
    type: "openai",
  });

  // Read file into a Buffer
  //   const fileBuffer = await fs.readFileSync(audio_file_path);
  const images_dir = `${process.cwd()}/local_files/mapa`;

  // Read all files in directory
  const files = fs.readdirSync(images_dir);

  console.log("This is files");
  console.log(files);

  // Process each file
  const base64Images = await Promise.all(
    files.map(async (file_name) => {
      const file_path = `${images_dir}/${file_name}`;
      console.log("This is file path");
      console.log(file_path);

      try {
        const base64Image = await imageService.getImageAsBase64FromLocalFile(
          file_path
        );

        const imageContent = await imageService.imageContentFromBase64(
          base64Image,
          "openai"
        );

        const response = await anton.chat({
          messages: [
            {
              role: "user",
              // @ts-ignore
              content: [
                imageContent,
                {
                  type: "text",
                  text: `
                  Image is the image of the map of the city. Please describe it in detail. Focus on details that can help you identify the city.
                  Maybe some special point of interest, streets etc.
                  We have some assumptions:
                  - It has to be in Poland
                  - It is not Krakow
                  `,
                },
              ],
            },
          ],
        });

        return response[0].content;
      } catch (error) {
        console.error(`Error processing file ${file_name}:`, error);
        return {
          file_name,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        };
      }
    })
  );

  const finalAntonResponse = await anton.chat({
    messages: [
      {
        role: "user",
        content: `
        In <descriptions> you have 4 images of part of maps.
        One of the image is from different city than the other 3. 
        Based on the descriptions, figure out in which city the map is.

        Some things we know about the result city:
        - It's not Krakow
        - It is not: Toruń, Wroclaw, Lublin, Bydgoszcz, Elblag, Malbork, Gdansk
        - It is in Poland
        - The city has granaries and fortresses


        <descriptions>
        ${base64Images.map((image, index) => {
          return `
          Image ${index + 1}: ${image}
          ______________________
          `;
        })}
        </descriptions>

        Make sure you really think through this one. Take your time.

        Return ONLY the 3 potentiall guesses as the result of your reasoning. Without any other explanation.
        `,
      },
    ],
  });

  return c.json({
    response: {
      base64Images,
      finalAntonResponse,
    },
  });
});

aiDevs.get("/2-3", async (c) => {
  const anton = AntonSDK.create({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string,
    type: "openai",
  });

  const response = await fetch(
    `https://centrala.ag3nts.org/data/${AI_DEVS_API_KEY}/robotid.json`
  );
  const responseJson = await response.json();
  const robotDescription = responseJson.description;

  const image = await anton.createImage({
    model: "dall-e-3",
    n: 1,
    quality: "hd",
    size: "1024x1024",
    prompt: robotDescription,
  });

  const imageUrl = image.data[0].url;

  const responseFromCentrala = await fetch(
    "https://centrala.ag3nts.org/report ",
    {
      method: "POST",
      body: JSON.stringify({
        task: "robotid",
        apikey: AI_DEVS_API_KEY,
        answer: imageUrl,
      }),
    }
  );

  const responseFromCentralaJson = await responseFromCentrala.json();

  return c.json({
    response: {
      responseFromCentralaJson,
      image,
      imageUrl,
      robotDescription,
    },
  });
});

const avoidFacts = (file: string) => {
  return file !== 'facts';
};

const categorize = async (content: string, anton: any) => {
  const response = await anton.chat({
    messages: [
      {
        role: "user",
        content: `
        This is a daily report. Some of them are regular technical reports, while others are security-related reports. The data collected is in various formats and not all of it contains useful data. Please only retrieve for us the notes containing information about people captured or traces of their presence and hardware failures fixed (ignore those related to software).
        
        Categorize below <content> with "people" or "hardware". If its not clear which one, return "dunno". 
        The rules is you are looking for information about captured people or repaired HARDWARE. Ignore the software mentions.
        Take some time to think about it. Do not rush. There will be misleading information.
        Never every return anything else.
        Always return just one word. It's an order!
        <content>
        ${content}
        </content>
        `,
      },
    ],
  });

  return response[0].content;
};

aiDevs.get("/2-4", async (c) => {
  const anton = AntonSDK.create({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string,
    type: "openai",
  });

  const files_dir = `${process.cwd()}/local_files/files_from_factory`;

  // Read all files in directory
  const files = fs.readdirSync(files_dir)
    .filter(avoidFacts)

  // Object to store file contents
  const file_contents: Record<string, any> = {};

  // Process each file based on extension
  await Promise.all(files.map(async (file) => {
    const file_extension = file.split('.').pop()?.toLowerCase();
    const file_path = `${files_dir}/${file}`;

    switch (file_extension) {
      case 'txt': {
        try {
          const content = await fs.promises.readFile(file_path, 'utf-8');
          file_contents[file] = {
            content,
            category: await categorize(content, anton)
          };
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
        break;
      }
      case 'mp3': {
        const transcript = await anton.transcribeAudio(file_path);
        file_contents[file] = {
          content: transcript.text,
          category: await categorize(transcript.text, anton)
        };
        break;
      }
      case 'png': {
        const base64Image = await imageService.getImageAsBase64FromLocalFile(
          file_path
        );

        const imageContent = await imageService.imageContentFromBase64(
          base64Image,
          "openai"
        );

        const response = await anton.chat({
          messages: [
            {
              role: "user",
              // @ts-ignore
              content: [
                imageContent,
                {
                  type: "text",
                  text: `
                  Describe an image in detail.
                  `,
                },
              ],
            },
          ],
        });

        file_contents[file] = {
          content: response[0].content,
          category: await categorize(response[0].content, anton)
        };

        console.log(`Found PNG file: ${file} - Will be analyzed with AI later`);
        break;
      }
      default: {
        console.log(`Unhandled file type for ${file}`);
      }
    }
  }));

  console.log("File contents:", file_contents);

  const hardware_values = Object.values(file_contents).filter(file => file.category === 'hardware');
  const people_values = Object.values(file_contents).filter(file => file.category === 'people');

  const hardware_keys = Object.entries(file_contents)
    .filter(([_, file]) => file.category === 'hardware')
    .map(([key]) => key)
    .sort();

  const people_keys = Object.entries(file_contents)
    .filter(([_, file]) => file.category === 'people')
    .map(([key]) => key)
    .sort();
  const results = {
    hardware: hardware_keys,
    people: people_keys
  }

  const resultToSend = {
    hardware: hardware_keys,
    people: people_keys
  }
    
  console.log("This is results");
  console.log(resultToSend);

  const responseFromCentrala = await fetch(
    "https://centrala.ag3nts.org/report ",
    {
      method: "POST",
      body: JSON.stringify({
        task: "kategorie",
        apikey: AI_DEVS_API_KEY,
        answer: resultToSend,
      }),
    }
  );

  const responseFromCentralaJson = await responseFromCentrala.json();

  return c.json({
    response: {
      file_contents,
      files,
      resultToSend,
      responseFromCentralaJson
    },
  });
});

aiDevs.get("/2-5", async (c) => {
  const anton = AntonSDK.create({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY as string,
    type: "openai",
  });

  const response = await fetch(
    `https://centrala.ag3nts.org/data/${AI_DEVS_API_KEY}/arxiv.txt`
  );
  const pytaniaZCentrali = await response.text();

  

  // const responseFromCentrala = await fetch(
  //   "https://centrala.ag3nts.org/report ",
  //   {
  //     method: "POST",
  //     body: JSON.stringify({
  //       task: "kategorie",
  //       apikey: AI_DEVS_API_KEY,
  //       answer: resultToSend,
  //     }),
  //   }
  // );

  // const responseFromCentralaJson = await responseFromCentrala.json();

  return c.json({
    response: {
      pytaniaZCentrali
    },
  });
});

export default aiDevs;
