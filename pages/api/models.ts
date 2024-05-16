import { LLAMA_API_HOST } from '@/utils/app/const';
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { key } = (await req.json()) as {
      key: string;
    };

    const response = await fetch(${LLAMA_API_HOST}/v1/models, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
        headers: response.headers,
      });
    } else if (response.status !== 200) {
      console.error(
        LLAMA API returned an error ${response.status}: ${await response.text()},
      );
      throw new Error('LLAMA API returned an error');
    }

    let json = await response.json();
    const models = json.data.map((model: any) => ({
      id: model.id,
      name: model.name,
    }));

    return new Response(JSON.stringify(models), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
