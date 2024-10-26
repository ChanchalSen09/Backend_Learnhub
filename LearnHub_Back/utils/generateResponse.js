const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getResponseFromAPI(prompt) {
    try {

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([prompt]);

        console.log('API Response:', JSON.stringify(result, null, 2));

        return result;

    } catch (error) {
        console.error('Error encountered:', error.message);
        return {
            message: `Error generating content: ${error.message}`
        };
    }
}

module.exports = { getResponseFromAPI };
