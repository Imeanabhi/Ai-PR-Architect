const express = require("express");
const cors = require("cors");
const { Octokit } = require("@octokit/rest");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Helper function to parse GitHub URL: https://github.com/owner/repo/pull/1
const parseGitHubUrl = (url) => {
  const parts = url.split("/");
  return {.
    owner: parts[3],
    repo: parts[4],
    pull_number: parts[6],
  };
};

app.post("/generate-summary", async (req, res) => {
  const { prUrl, hfToken } = req.body;

  try {
    const { owner, repo, pull_number } = parseGitHubUrl(prUrl);

    // 1. Fetch the "Diff" (The actual code changes) from GitHub
    const { data: diff } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: parseInt(pull_number),
      mediaType: { format: "diff" }, // This gets the text representation of changes
    });

    // 2. Prepare the Prompt for Hugging Face
    // We trim the diff if it's too long for the AI model's context window
    const cleanDiff = diff.substring(0, 3000);

    const prompt = `### Instruction:
Summarize the following GitHub Pull Request code changes into a professional PR description. 
Use bullet points for features, bug fixes, and refactors.

### Git Diff:
${cleanDiff}

### Response:`;

    // 3. Call Hugging Face Inference API (using Llama 3 or Mistral)
    const aiResponse = await axios.post(
      "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${hfToken}` } },
    );

    // 4. Return the generated text back to the Chrome Extension
    const summary =
      aiResponse.data[0].generated_text.split("### Response:")[1] ||
      "AI couldn't generate a summary.";

    res.json({ summary: summary.trim() });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Failed to generate summary. Check your tokens and URL.",
      });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
