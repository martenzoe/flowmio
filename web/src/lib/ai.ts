import { supabase } from './supabase';

type AiParams = {
  promptType: string;
  inputs?: Record<string, any>;
  moduleId?: string | null;
  temperature?: number;
};

export async function callAi(params: AiParams): Promise<{ text: string }> {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: params,
  });

  if (error) {
    throw new Error(error.message || 'Edge Function error');
  }

  if (!data?.ok) {
    throw new Error(data?.error || 'AI call failed');
  }

  return { text: data.text as string };
}
