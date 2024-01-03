import {
    BedrockRuntimeClient,
    InvokeModelCommand
  } from '@aws-sdk/client-bedrock-runtime';
  import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

  import { Amplify, withSSRContext } from 'aws-amplify';
  import type { NextApiRequest, NextApiResponse } from 'next';
  import awsExports from '@/aws-exports';
  
  Amplify.configure({
    ...awsExports,
    ssr: true
  });
  
  const formatMessage = (message: VercelChatMessage) => {
    const role = message.role === "assistant" ? "Assistant" : "Human"; 
    return `${role} : ${message.content}`;
  };
  const formatVercelMessages = (chatHistory: VercelChatMessage[]) => {
    const formattedDialogueTurns = chatHistory.map((message) => {
      if (message.role === "user") {
        return `Human: ${message.content}`;
      } else if (message.role === "assistant") {
        return `Assistant: ${message.content}`;
      } else {
        return `${message.role}: ${message.content}`;
      }
    });
    return formattedDialogueTurns.join("\n");
  };

  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const body = req.body;
    const SSR = withSSRContext({ req });
    const credentials = await SSR.Auth.currentCredentials();
    const bedrock = new BedrockRuntimeClient({
      serviceId: 'bedrock',
      region: 'us-east-1',
      credentials
    });
  
    // Anthropic's Claude model expects a chat-like string
    // of 'Human:' and 'Assistant:' responses separated by line breaks.
    // You should always end your prompt with 'Assistant:' and Claude
    // will respond. There are various prompt engineering techniques
    // and frameworks like LangChain you can use here too.
    const prompt1 = `Human:who are you, assitant?\n\nAssistant:`;
    

    
    const messages = body.messages ?? [];
    
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;
    
    let prompt = formatVercelMessages(messages);
    prompt += `\nAssistant:`
    console.log(prompt)
    
    //const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    //const currentMessageContent = messages[messages.length - 1].content;
    //let prompt = formattedPreviousMessages.join('\n\n');
    //prompt = prompt + '\n\nHuman : ' + currentMessageContent + '\n\nAssistant :';
    //const formattedMessages = messages.map(formatMessage).join("\n") + "\n\nAssistant : ";
    //let prompt = "Human: Hello there\n\nAssistant: Hi, I'm Claude. How can I help?\n\nHuman: Can you explain Glycolysis to me?\n\nAssistant:"
    //let prompt = msgs.map(formatMessage).join('\n\n');
    //prompt += '\n\nAssistant:';
    //console.log(prompt)
    /*const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    const formattedPrompt = await prompt.format({
        chat_history: formattedPreviousMessages,
        input : currentMessageContent
      });*/

    const result = await bedrock.send(
      new InvokeModelCommand({
        modelId: 'anthropic.claude-v2',
        contentType: 'application/json',
        accept: '*/*',
        body: JSON.stringify({
            prompt,
          // LLM costs are measured by Tokens, which are roughly equivalent
          // to 1 word. This option allows you to set the maximum amount of
          // tokens to return
          max_tokens_to_sample: 2000,
          // Temperature (1-0) is how 'creative' the LLM should be in its response
          // 1: deterministic, prone to repeating
          // 0: creative, prone to hallucinations
          temperature: 1,
          top_k: 250,
          top_p: 0.99,
          // This tells the model when to stop its response. LLMs
          // generally have a chat-like string of Human and Assistant message
          // This says stop when the Assistant (Claude) is done and expects
          // the human to respond
          stop_sequences: ['\n\nHuman:'],
          anthropic_version: 'bedrock-2023-05-31'
        })
      })
    );
    // The response is a Uint8Array of a stringified JSON blob
    // so you need to first decode the Uint8Array to a string
    // then parse the string.
    let aiRes = JSON.parse(new TextDecoder().decode(result.body))
    res.status(200).send(aiRes.completion);
  }