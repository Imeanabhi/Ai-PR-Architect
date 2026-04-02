const injectAIButton = () => {
  // Target the Tab Bar (Write/Preview area)
  const tabNav = document.querySelector(
    ".js-previewable-comment-form .tabnav-tabs",
  );

  if (tabNav && !document.getElementById("ai-gen-btn")) {
    const btn = document.createElement("button");
    btn.id = "ai-gen-btn";
    btn.innerText = "✨ AI PR Architect";
    btn.type = "button";

    // GitHub-style Green Button
    btn.className = "btn btn-sm ml-2";
    btn.style.backgroundColor = "#238636";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";

    btn.onclick = async () => {
      const textBox = document.querySelector(
        'textarea[name="pull_request[body]"]',
      );
      if (!textBox) return alert("Description box not found!");

      const originalText = btn.innerText;
      btn.innerText = "⏳ Analyzing...";
      btn.disabled = true;

      try {
        const result = await chrome.storage.local.get(["hf_api_key"]);
        if (!result.hf_api_key) {
          alert("Set your Hugging Face Token in the extension popup first!");
          btn.innerText = originalText;
          btn.disabled = false;
          return;
        }

        const response = await fetch("http://localhost:5000/generate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prUrl: window.location.href,
            hfToken: result.hf_api_key,
          }),
        });

        const data = await response.json();

        if (data.summary) {
          textBox.value = data.summary;
          btn.innerText = "✅ Generated!";
        } else {
          throw new Error(data.error || "AI failed to respond");
        }
      } catch (err) {
        console.error("AI PR Error:", err);
        btn.innerText = "❌ Error";
      } finally {
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
        }, 3000);
      }
    };

    tabNav.appendChild(btn);
  }
};

// Check every second for GitHub's dynamic page changes
setInterval(injectAIButton, 1000);
