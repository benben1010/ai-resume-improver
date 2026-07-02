async function processFile() {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    alert("Please upload a file");
    return;
  }

  let text = "";

  if (file.type === "application/pdf") {
    text = await readPDF(file);
  } else if (file.name.endsWith(".docx")) {
    text = await readDOCX(file);
  } else {
    alert("Only PDF or DOCX allowed");
    return;
  }

  document.getElementById("text").innerText = text;

  improveWithAI(text);
}

async function readPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(buffer).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(" ") + "\n";
  }

  return text;
}

async function readDOCX(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function improveWithAI(text) {
  document.getElementById("output").innerText = "Analyzing...";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Analyze and improve this resume:
        
        1. Give a score out of 100
        2. List weaknesses
        3. Suggest improvements
        4. Rewrite key sections
        
        Resume:
        ${text}`
      }]
    })
  });

  const data = await response.json();
  document.getElementById("output").innerText =
    data.choices[0].message.content;
}
