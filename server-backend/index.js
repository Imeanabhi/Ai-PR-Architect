const express = require("express");
const cors = require("cors");
const { Octokit } = require("@octokit/rest");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const parseGitHubUrl = (url) => {
  try {
    const urlWithoutQuery = url.split("?")[0];
    const parts = urlWithoutQuery.split("/");
    const owner = parts[3];
    const repo = parts[4];

    if (urlWithoutQuery.includes("/compare/")) {
      const comparisonPath = urlWithoutQuery.split("/compare/")[1];
      const branches = comparisonPath.split("...");
      const base = branches.length > 1 ? branches[0] : "main";
      const head = branches.length > 1 ? branches[1] : branches[0];
      return { owner, repo, type: "compare", base, head };
    }
    return { owner, repo, type: "pull", pull_number: parts[6] };
  } catch (err) {
    return null;
  }
};

app.post("/generate-summary", async (req, res) => {
  const { prUrl, hfToken } = req.body;
  const info = parseGitHubUrl(prUrl);
  if (!info) return res.status(400).json({ error: "Invalid URL" });

  try {
    let diffData;
    if (info.type === "compare") {
      const { data } = await octokit.repos.compareCommits({
        owner: info.owner,
        repo: info.repo,
        base: `${info.owner}:${info.base}`,
        head: `${info.owner}:${info.head}`,
        mediaType: { format: "diff" },
      });
      diffData = data;
    } else {
      const { data } = await octokit.pulls.get({
        owner: info.owner,
        repo: info.repo,
        pull_number: parseInt(info.pull_number),
        mediaType: { format: "diff" },
      });
      diffData = data;
    }

    const cleanDiff = diffData.substring(0, 4000);
    const modelId = "mistralai/Mistral-7B-Instruct-v0.3";
    const routerURL = `https://router.huggingface.co/hf-inference/v1/chat/completions`;

    const aiResponse = await axios.post(
      routerURL,
      {
        model: modelId,
        messages: [
          {
            role: "system",
            content:
              "Summarize code changes into a professional PR description with bullet points.",
          },
          { role: "user", content: `Here is the git diff:\n\n${cleanDiff}` },
        ],
        max_tokens: 500,
      },
      { headers: { Authorization: `Bearer ${hfToken}` } },
    );

    const summary = aiResponse.data.choices[0].message.content;
    res.json({ summary: summary.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// This tells the browser what to show on the main page
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
      <h1 style="color: #238636;">🚀 PR Architect Backend is Live</h1>
      <p>Listening for requests from the Chrome Extension...</p>
      <div style="margin-top: 20px; padding: 10px; background: #f6f8fa; display: inline-block; border-radius: 6px;">
        Status: <span style="color: green;">● Healthy</span>
      </div>
    </div>
  `);
});
app.listen(5000, () => console.log(`🚀 Server: http://localhost:5000`));
