const axios = require('axios');

const API_URL = 'http://localhost:3000/lm-studio/chat/completions';

async function testChatCompletion(useTools = false, streaming = false) {
    const requestBody = {
        modelId: '66b6a854bcba73dc6f1c363e',
        messages: [
            { role: 'system', content: useTools ? 'You are a helpful assistant with access to tools.' : 'You are a helpful assistant.' },
            { role: 'user', content: useTools ? 'Can you see a tool you have access to? Dont make up shit. Name the functions you see in this conversation' : 'What is the capital of France?' }
        ],
        max_tokens: 100,
        temperature: 0.7,
        stream: streaming
    };

    if (useTools) {
        requestBody.tools = [
            {
                type: 'function',
                function: {
                    name: 'calculate',
                    description: 'Perform a mathematical calculation',
                    parameters: {
                        type: 'object',
                        properties: {
                            expression: {
                                type: 'string',
                                description: 'The mathematical expression to calculate'
                            }
                        },
                        required: ['expression']
                    }
                }
            }
        ];
        requestBody.tool_choice = 'auto';
    }

    try {
        console.log('Sending request:', requestBody);
        const response = await axios.post(API_URL, requestBody, {
            responseType: streaming ? 'stream' : 'json'
        });

        if (streaming) {
            console.log(`Starting ${useTools ? 'tool' : 'non-tool'} streaming test:`);
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    if (line.includes('[DONE]')) {
                        console.log('Stream finished');
                        return;
                    }
                    if (line.startsWith('data: ')) {
                        const jsonData = JSON.parse(line.slice(6));
                        console.log('Streamed chunk:', jsonData);
                    }
                }
            });
        } else {
            console.log(`${useTools ? 'Tool' : 'Non-tool'} non-streaming response:`, response.data);
            console.log(`Response messages: ${response.data.choices[0].message.content}`);
            console.log(`Choices: ${JSON.stringify(response.data.choices)}`);
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// Run non-tool, non-streaming test
testChatCompletion(false, false);

// Run non-tool, streaming test
testChatCompletion(false, true);

// Run tool, non-streaming test
testChatCompletion(true, false);

// Run tool, streaming test
testChatCompletion(true, true);