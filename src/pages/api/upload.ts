import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from "fs";
import path from "path";
import formidable, { File } from 'formidable';
import pdf from 'pdf-parse';
import sendAIRequest from './aiclient';
import { withSSRContext } from 'aws-amplify';

export const config = {
    api: {
        bodyParser: false,
    }
};

type ProcessedFiles = Array<[string, File]>;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

    let status = 200,
        resultBody = { status: 'ok', message: 'Files were uploaded successfully' };

    /* Get files using formidable */
    const files = await new Promise<ProcessedFiles | undefined>((resolve, reject) => {
        const form = new formidable.IncomingForm();
        const files: ProcessedFiles = [];
        form.on('file', function (field, file) {
            files.push([field, file]);
        })
        form.on('end', () => resolve(files));
        form.on('error', err => reject(err));
        form.parse(req, () => {
            //
        });
    }).catch(e => {
        console.log(e);
        status = 500;
        resultBody = {
            status: 'fail', message: 'Upload error'
        }
    });
    let resText = '';
    if (files?.length) {

        /* Create directory for uploads */
        /*const targetPath = path.join(process.cwd(), `/uploads/`);
        try {
            await fs.access(targetPath);
        } catch (e) {
            await fs.mkdir(targetPath);
        }*/

        /* Move uploaded files to directory */
       /* for (const file of files) {
            const tempPath = file[1].filepath;
            await fs.rename(tempPath, targetPath + file[1].originalFilename);
        }*/
        const SSR = withSSRContext({ req });
        const credentials = await SSR.Auth.currentCredentials();
    

        for (const file of files) {
            const buffer = await fs.readFile(file[1].filepath);
            const d = await pdf(buffer);
            let txt = d.text;
            var prompt = `Human:You are an expert assistant with expertise in summarizing and pulling out important sections of a text. The following text is from a PDF document. Follow these steps: read the text, summarize the text, and identify the main ideas. In your response include the summary and bullet points for the main ideas. Do not respond with more than 5 sentences.\n<TEXT>${txt}</TEXT>\n\nAssistant:`;
        
            resText = await sendAIRequest( credentials,prompt);
        }
    }
    resultBody.message = JSON.parse(resText);
    res.status(status).json(resultBody);
}

export default handler;