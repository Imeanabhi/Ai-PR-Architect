const injectAIButton = () => {
  const tabNav = document.querySelector(
    ".js-previewable-comment-form .tabnav-tabs",
  );

  if (tabNav && !document.getElementById("ai-gen-btn")) {
    const btn = document.createElement("button");
    btn.id = "ai-gen-btn";
    btn.innerText = "📊 PR Architect";
    btn.type = "button";
    btn.className = "btn btn-sm ml-2";
    btn.style.backgroundColor = "#238636";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "12px";

    btn.onclick = async () => {
      const textBox = document.querySelector(
        'textarea[name="pull_request[body]"], textarea[id="pull_request_body"]',
      );
      if (!textBox) {
        alert("Description box not found!");
        return;
      }

      const originalText = btn.innerText;
      btn.innerText = "⏳ Generating...";
      btn.disabled = true;

      try {
        const response = await fetch(
          "http://localhost:5000/generate-pr-summary",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prUrl: window.location.href,
            }),
          },
        );

        const data = await response.json();

        if (response.ok && data.summary) {
          textBox.value = data.summary;
          btn.innerText = "✅ Added!";

          // Show success message
          const successMsg = document.createElement("div");
          successMsg.textContent = "✓ PR summary generated!";
          successMsg.style.position = "fixed";
          successMsg.style.bottom = "20px";
          successMsg.style.right = "20px";
          successMsg.style.backgroundColor = "#238636";
          successMsg.style.color = "white";
          successMsg.style.padding = "10px 20px";
          successMsg.style.borderRadius = "6px";
          successMsg.style.zIndex = "9999";
          document.body.appendChild(successMsg);
          setTimeout(() => successMsg.remove(), 3000);
        } else {
          throw new Error(data.error || "Failed to generate summary");
        }
      } catch (err) {
        console.error("Error:", err);
        btn.innerText = "❌ Error";
        alert(
          `Error: ${err.message}\n\nMake sure backend is running on port 5000`,
        );
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

// Check for GitHub's dynamic page changes
setInterval(injectAIButton, 1000);
