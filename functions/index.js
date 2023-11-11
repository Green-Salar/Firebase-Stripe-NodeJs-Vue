import express from "express";
import {OpenAI} from "openai";
import cors from "cors";
import * as functions from "firebase-functions";

// Fetch the API key from Firebase functions configuration
const apiKey = functions.config().api.openai_secretkey;

const app = express();
app.use(cors());
app.use(express.json());
const openai = new OpenAI({
  apiKey: apiKey,
});


app.post("/chat", async (req, res) => {
  if (!req.body) {
    console.log("No request body received");
    res.status(400).json({error: "No request body"});
    return;
  }
  if (!req.body.resume || !req.body.jobDescription) {
    console.log("Required fields missing");
    res.status(400).json({error: "Required fields missing"});
    return;
  }

  console.log("Request received:", req.body);

  // Extracting the relevant information from the request body
  const resume = req.body.resume;
  const jobDescription = req.body.jobDescription;
  const optimizeResume = req.body.optimizeResume;
  const writeCoverLetter = req.body.writeCoverLetter;

  // Preparing a clear and explicit instruction for the assistant
  let instruction = "Based on the provided resume and job description:";

  if (optimizeResume) {
    instruction += " Optimize the resume.";
  }

  if (writeCoverLetter) {
    instruction += " Write a cover letter.";
  }

  instruction += ` Resume: ${resume}. Job Description: ${jobDescription}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: "You are a professional resume writer. "+
        "Do not fictionalize any information."},
        {role: "user", content: instruction},
      ],
    });

    const outputText = completion.choices[0].message.content;

    res.json({botResponse: outputText});
    console.log("Response sent:", outputText);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred");
  }
});
app.post("/chatTest", async (req, res) => {
  console.log("Request received:", req.body);

  // Extracting the relevant information from the request body
  const resume = req.body.resume;
  const jobDescription = req.body.jobDescription;
  const optimizeResume = req.body.optimizeResume;
  const writeCoverLetter = req.body.writeCoverLetter;

  // Preparing a clear and explicit instruction for the assistant
  let instruction = "Based on the provided resume and job description:";

  if (optimizeResume) {
    instruction += " Optimize the resume and start with \"Optimized Resume:\".";
  }

  if (writeCoverLetter) {
    instruction += " Write a cover letter starting with \"Cover Letter:\".";
  }

  instruction += ` Resume: ${resume}. Job Description: ${jobDescription}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: "You are a professional resume writer."+
        "Do not fictionalize any information."},
        {role: "user", content: instruction},
      ],
    });

    const outputText = completion.choices[0].message.content;

    // Split the output into optimized resume and cover letter
    let optimizedResume = "";
    let coverLetter = "";

    if (optimizeResume) {
      optimizedResume = outputText.split("Optimized Resume:")[1]
          .split("Cover Letter:")[0].trim();
    }
    if (writeCoverLetter) {
      coverLetter = outputText.split("Cover Letter:")[1].trim();
    }

    res.json({
      optimizedResume: optimizedResume,
      coverLetter: coverLetter,
    });
    console.log("Response sent:", {optimizedResume, coverLetter});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred");
  }
});

// Export the API as a Firebase function
export const api = functions.https.onRequest(app);
