const express = require("express");
const cors = require("cors");
const { Octokit } = require("@octokit/rest");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Robust GitHub URL Parser
const parseGitHubUrl = (url) => {
  const cleanUrl = url.split("?")[0]; // Remove ?expand=1
  const parts = cleanUrl.split("/");
  const owner = parts[3];
  const repo = parts[4];

  if (cleanUrl.includes("/compare/")) {
    const comparisonPath = cleanUrl.split("/compare/")[1];
    const branches = comparisonPath.split("...");

    // If URL is just /compare/feature-branch, base is 'main'
    const base = branches.length > 1 ? branches[0] : "main";
    const head = branches.length > 1 ? branches[1] : branches[0];

    return { owner, repo, type: "compare", base, head };
  }

  return { owner, repo, type: "pull", pull_number: parts[6] };
};
// Add this so your browser shows something friendly
app.get("/", (req, res) => {
  res.send("🚀 PR Architect Backend is live and listening for the extension!");
});
app.post("/generate-summary", async (req, res) => {
  const { prUrl, hfToken } = req.body;
  console.log(`🚀 Processing Request for: ${prUrl}`);

  try {
    const info = parseGitHubUrl(prUrl);
    let diffData;

    // Inside app.post("/generate-summary", ...)
    if (info.type === "compare") {
      console.log(`🔍 Comparing: ${info.base} ↔ ${info.head}`);

      const { data } = await octokit.repos.compareCommits({
        owner: info.owner,
        repo: info.repo,
        // Use the 'base...head' syntax which is often more robust
        basehead: `${info.base}...${info.head}`,
        headers: {
          accept: "application/vnd.github.v3.diff", // Explicitly ask for diff
        },
      });
      diffData = data;
    } else {
      console.log(`🔍 Fetching PR: #${info.pull_number}`);
      const { data } = await octokit.pulls.get({
        owner: info.owner,
        repo: info.repo,
        pull_number: parseInt(info.pull_number),
        mediaType: { format: "diff" },
      });
      diffData = data;
    }

    // Prepare AI Prompt
    const cleanDiff = diffData.substring(0, 4000);
    const prompt = `### Instruction:
Summarize the following code changes into a professional PR description. Use bullet points.

### Git Diff:
${cleanDiff}

### Response:`;

    // Call Hugging Face
    const aiResponse = await axios.post(
      "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${hfToken}` } },
    );

    const fullText = aiResponse.data[0].generated_text;
    const summary =
      fullText.split("### Response:")[1] || "Summary generated successfully.";

    res.json({ summary: summary.trim() });
    console.log("✅ Summary sent to extension!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
