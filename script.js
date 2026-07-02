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

    document.getElementById("output").innerText = "Testing API...";

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-3.1-8b-instruct:free",
                    messages: [
                        {
                            role: "user",
                            content: "Say only HELLO"
                        }
                    ]
                })
            }
        );

        const raw = await response.text();

        console.log("Status:", response.status);
        console.log("Response:", raw);

        document.getElementById("output").innerText =
            `Status: ${response.status}\n\n${raw}`;

    } catch (error) {
        document.getElementById("output").innerText =
            error.message;
    }
}
}
