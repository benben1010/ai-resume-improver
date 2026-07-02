const OPENROUTER_API_KEY = "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";

async function processFile() {
    console.log("Button clicked");

    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Please upload a PDF or DOCX file.");
        return;
    }

    let text = "";

    try {
        if (file.type === "application/pdf") {
            text = await readPDF(file);
        } else if (file.name.toLowerCase().endsWith(".docx")) {
            text = await readDOCX(file);
        } else {
            alert("Only PDF and DOCX files are supported.");
            return;
        }

        document.getElementById("resumeText").innerText = text;

        await improveWithAI(text);

    } catch (error) {
        console.error(error);

        document.getElementById("output").innerText =
            "Error processing file: " + error.message;
    }
}

async function readPDF(file) {
    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: buffer
    }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const strings = content.items.map(item => item.str);

        text += strings.join(" ") + "\n\n";
    }

    return text;
}

async function readDOCX(file) {
    const buffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({
        arrayBuffer: buffer
    });

    return result.value;
}

async function improveWithAI(text) {

    document.getElementById("output").innerText =
        "Analyzing resume...";

    const jobDescription =
        document.getElementById("jobDescription")?.value || "";

    const prompt = `
You are a senior recruiter and ATS expert.

Analyze the following resume and provide:

1. Overall Resume Score (/100)
2. ATS Compatibility Score (/100)
3. Top Strengths
4. Weaknesses
5. Missing Keywords
6. Suggestions for Improvement
7. Improved Professional Summary
8. Improved Experience Bullet Points
9. Tailored Advice for the Job Description

Job Description:
${jobDescription}

Resume:
${text}
`;

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                
headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": window.location.origin,
    "X-Title": "AI Resume Improver"
}

                body: JSON.stringify({
                    model: "meta-llama/llama-3.1-8b-instruct:free",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        
console.log("HTTP Status:", response.status);

const rawResponse = await response.text();

console.log("Raw Response:", rawResponse);

if (!response.ok) {
    document.getElementById("output").innerText =
        `HTTP ${response.status}\n\n${rawResponse}`;
    return;
}

const data = JSON.parse(rawResponse);

document.getElementById("output").innerText =
    data.choices[0].message.content;


        document.getElementById("output").innerText =
            data.choices[0].message.content;

    } catch (error) {

        console.error(error);

        document.getElementById("output").innerText =
            "Request failed: " + error.message;
    }
}
