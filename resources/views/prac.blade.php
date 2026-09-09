<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viral Video Script & Hook Generator</title>
    <!-- Google Fonts & Remix Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">

    <!-- Puter.js SDK for Frontend AI Capabilities -->
    <script src="https://js.puter.com/v2/"></script>

    <style>
        :root {
            --bg: #0f172a;
            --card-bg: #1e293b;
            --border: #334155;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --primary: #8b5cf6;
            --primary-hover: #7c3aed;
            --accent: #ec4899;
            --radius: 12px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }

        body {
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .generator-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            width: 100%;
            max-width: 800px;
            padding: 28px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .header {
            margin-bottom: 24px;
        }

        .header h2 {
            font-size: 1.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .header h2 i {
            color: var(--primary);
        }

        .header p {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-top: 4px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text);
        }

        input,
        select,
        textarea {
            width: 100%;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            color: var(--text);
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s;
        }

        input:focus,
        select:focus,
        textarea:focus {
            border-color: var(--primary);
        }

        .row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        /* Tone Selector Chips */
        .tone-chips {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .chip {
            background: var(--bg);
            border: 1px solid var(--border);
            padding: 8px 14px;
            border-radius: 20px;
            font-size: 0.85rem;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s ease;
        }

        .chip.active {
            background: var(--primary);
            border-color: var(--primary);
            color: #fff;
        }

        .btn-generate {
            width: 100%;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: #fff;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            transition: opacity 0.2s;
        }

        .btn-generate:hover {
            opacity: 0.9;
        }

        .btn-generate:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Output Results Area */
        .output-container {
            margin-top: 28px;
            display: none;
            border-top: 1px solid var(--border);
            padding-top: 24px;
        }

        .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .hooks-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 24px;
        }

        .hook-card {
            background: var(--bg);
            border: 1px dashed var(--primary);
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.95rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .script-box {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            white-space: pre-wrap;
            font-size: 0.9rem;
            line-height: 1.6;
            color: #cbd5e1;
            max-height: 350px;
            overflow-y: auto;
        }

        .copy-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s;
        }

        .copy-btn:hover {
            background: var(--border);
            color: var(--text);
        }

        /* Spinner */
        .spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        @media (max-width: 600px) {
            .row {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>

    <div class="generator-card">
        <div class="header">
            <h2><i class="ri-flashlight-fill"></i> Viral Script & Hook Generator</h2>
            <p>Turn core ideas into high-converting TikTok & Short video hooks with scene breakdowns.</p>
        </div>

        <div class="form-group">
            <label for="topic">Topic or Core Concept</label>
            <input type="text" id="topic" placeholder="e.g., How to learn JavaScript in 30 days without burnout">
        </div>

        <div class="row">
            <div class="form-group">
                <label for="platform">Target Platform</label>
                <select id="platform">
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                </select>
            </div>

            <div class="form-group">
                <label for="targetAudience">Target Audience</label>
                <input type="text" id="targetAudience" placeholder="e.g., Beginner Developers, Students">
            </div>
        </div>

        <div class="form-group">
            <label>Content Style & Tone</label>
            <div class="tone-chips" id="toneChips">
                <div class="chip active" data-tone="Controversial/Curiosity">Controversial</div>
                <div class="chip" data-tone="Educational/Actionable">Educational</div>
                <div class="chip" data-tone="Storytelling">Storytelling</div>
                <div class="chip" data-tone="Energetic/Hype">Energetic</div>
            </div>
        </div>

        <button class="btn-generate" id="generateBtn">
            <i class="ri-magic-line"></i> Generate Viral Script
        </button>

        <div class="output-container" id="outputContainer">

            <div class="section-title">
                <span><i class="ri-fire-line" style="color: #f59e0b;"></i> Top 3 High-Retention Hooks</span>
            </div>
            <div class="hooks-list" id="hooksList"></div>

            <div class="section-title">
                <span><i class="ri-movie-line" style="color: var(--primary);"></i> Script Breakdown</span>
                <button class="copy-btn" id="copyScriptBtn">
                    <i class="ri-file-copy-line"></i> Copy Script
                </button>
            </div>
            <div class="script-box" id="scriptBox"></div>

        </div>
    </div>

    <script>
        let selectedTone = 'Controversial/Curiosity';
        const toneChips = document.querySelectorAll('.chip');
        const generateBtn = document.getElementById('generateBtn');
        const outputContainer = document.getElementById('outputContainer');
        const hooksList = document.getElementById('hooksList');
        const scriptBox = document.getElementById('scriptBox');
        const copyScriptBtn = document.getElementById('copyScriptBtn');
        toneChips.forEach(chip => {
            chip.addEventListener('click', () => {
                toneChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedTone = chip.getAttribute('data-tone');
            });
        });
        generateBtn.addEventListener('click', async () => {
            const topic = document.getElementById('topic').value.trim();
            const platform = document.getElementById('platform').value;
            const targetAudience = document.getElementById('targetAudience').value.trim() || 'General Audience';
            if (!topic) {
                alert('Please enter a topic or core concept!');
                return;
            }
            generateBtn.disabled = true;
            generateBtn.innerHTML = `<span class="spinner"></span> Generating Content...`;
            outputContainer.style.display = 'none';
            const prompt = `You are an expert short-form viral content creator for ${platform}.
                            Generate 3 high-converting, curiosity-driven hooks and a scene-by-scene script breakdown (under 60s) for the following request:
                            - Topic: "${topic}"
                            - Target Audience: ${targetAudience}
                            - Tone/Style: ${selectedTone}
                            Return the response in strictly VALID JSON format without extra text outside the JSON object:
                            {
                            "hooks": [
                                "Hook option 1",
                                "Hook option 2",
                                "Hook option 3"
                            ],
                            "script": "[00:00 - 00:03] Scene 1 (Visual + Audio description)\\n[00:03 - 00:15] Scene 2...\\n[00:15 - 00:45] Body...\\n[00:45 - 00:60] CTA..."
                            }`;
            try {
                const response = await puter.ai.chat(prompt);

                // Clean JSON formatting if model returns markdown ticks
                const cleanJSON = response.message.content.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(cleanJSON);

                // Render Hooks
                hooksList.innerHTML = '';
                data.hooks.forEach((hook, index) => {
                    const hookCard = document.createElement('div');
                    hookCard.className = 'hook-card';
                    hookCard.innerHTML = `
            <span><strong>#${index + 1}:</strong> "${hook}"</span>
            <button class="copy-btn" onclick="copyToClipboard('${hook.replace(/'/g, "\\'")}', this)">
              <i class="ri-file-copy-line"></i>
            </button>
          `;
                    hooksList.appendChild(hookCard);
                });

                // Render Script
                scriptBox.textContent = data.script;

                // Display results
                outputContainer.style.display = 'block';

            } catch (error) {
                console.error("AI Generation Error:", error);
                alert("Failed to generate content. Please try again.");
            } finally {
                // Reset button state
                generateBtn.disabled = false;
                generateBtn.innerHTML = `<i class="ri-magic-line"></i> Generate Viral Script`;
            }
        });

        // Utility: Copy function
        function copyToClipboard(text, buttonEl) {
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = buttonEl.innerHTML;
                buttonEl.innerHTML = `<i class="ri-check-line" style="color:#10b981;"></i>`;
                setTimeout(() => {
                    buttonEl.innerHTML = originalHTML;
                }, 1500);
            });
        }

        // Copy full script listener
        copyScriptBtn.addEventListener('click', function() {
            copyToClipboard(scriptBox.textContent, this);
        });
    </script>
</body>

</html>