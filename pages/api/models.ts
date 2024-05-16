import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { LLAMA_API_HOST } from '@/utils/app/const';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { key } = (await req.json()) as {
      key: string;
    };

    let url = `${OPENAI_API_HOST}/v1/models`;
    if (OPENAI_API_TYPE === 'azure') {
      url = `${OPENAI_API_HOST}/openai/deployments?api-version=${OPENAI_API_VERSION}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`, // Remove validation by setting the API key directly in the header
      },
    });

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
        headers: response.headers,
      });
    } else if (response.status !== 200) {
      console.error(
        `OpenAI API returned an error ${response.status
      }: ${await response.text()}`,
      );
      throw new Error('OpenAI API returned an error');
    }

    let json = await response.json();
    const llama_response = await fetch(`${LLAMA_API_HOST}/v1/models`, {
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (llama_response.status === 401) {
      return new Response(llama_response.body, {
        status: 500,
        headers: llama_response.headers,
      });
    } else if (llama_response.status !== 200) {
      console.error(
        `OpenAI API returned an error ${llama_response.status
      }: ${await llama_response.text()}`,
      );
      throw new Error('OpenAI API returned an error');
    }

    const llama_json = await llama_response.json();
    json.data.push(...llama_json.data)

    const models: OpenAIModel[] = json.data
      .map((model: any) => {
        const model_name = (OPENAI_API_TYPE === 'azure') ? model.model : model.id;
        for (const [key, value] of Object.entries(OpenAIModelID)) {
          if (value === model_name) {
            return {
              id: model.id,
              name: OpenAIModels[value].name,
            };
          }
        }
      })
      .filter(Boolean);

    return new Response(JSON.stringify(models), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
