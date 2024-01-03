import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { withSSRContext } from 'aws-amplify';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    try{
    const body = JSON.parse(req.body);
    const SSR = withSSRContext({ req });
    const credentials = await SSR.Auth.currentCredentials();
    const text = body.text;
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
        chunkSize: 256,
        chunkOverlap: 20,
      });
      let vectors = [];
      const splitDocuments = await splitter.createDocuments([text]);
      const bedrock = new BedrockRuntimeClient({
        serviceId: 'bedrock',
        region: 'us-east-1',
        credentials
        });
        for(const d of splitDocuments) {
            const result = await bedrock.send(
                new InvokeModelCommand({
                modelId: 'amazon.titan-embed-text-v1',
                contentType: 'application/json',
                accept: '*/*',
                body: JSON.stringify({
                    inputText:d.pageContent
                })
                })
            );
            const resBody = JSON.parse(new TextDecoder().decode(result.body))
            vectors.push(resBody.embedding)
          }
      res.status(200).json(vectors);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
      
    }
}

  