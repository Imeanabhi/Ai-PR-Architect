const injectAIButton = () => {
  // 1. Target the 'tab-content' where the PR description lives
  const commentActions = document.querySelector(
    ".pull-request-tab-content .d-flex",
  );

  if (commentActions && !document.getElementById("ai-gen-btn")) {
    const btn = document.createElement("button");
    btn.id = "ai-gen-btn";
    btn.innerText = "✨ AI PR Architect";
    // Using GitHub's native CSS for a seamless look
    btn.className = "btn btn-primary btn-sm ml-2";

    btn.onclick = async () => {
      const textBox = document.querySelector(
        'textarea[name="pull_request[body]"]',
      );
      if (!textBox) return alert("Could not find the PR description box!");

      // Start Loading State
      const originalText = btn.innerText;
      btn.innerText = "⏳ Analyzing Code...";
      btn.disabled = true;

      try {
        // 2. Fetch the saved Token from Chrome Storage
        const result = await chrome.storage.local.get(["hf_api_key"]);
        if (!result.hf_api_key) {
          alert(
            "Please set your Hugging Face Token in the extension popup first!",
          );
          return;
        }

        // 3. Call your Node.js Backend
        const response = await fetch("http://localhost:5000/generate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prUrl: window.location.href, // Current GitHub PR URL
            hfToken: result.hf_api_key,
          }),
        });

        const data = await response.json();

        if (data.summary) {
          // 4. Inject the AI result into the GitHub text area
          textBox.value = data.summary;
          btn.innerText = "✅ Generated!";
        } else {
          throw new Error("No summary returned");
        }
      } catch (err) {
        console.error("AI PR Error:", err);
        btn.innerText = "❌ Error";
      } finally {
        // Reset button after 3 seconds
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
        }, 3000);
      }
    };

    commentActions.appendChild(btn);
  }
};

// Check every second to handle GitHub's dynamic page loading
setInterval(injectAIButton, 1000);
