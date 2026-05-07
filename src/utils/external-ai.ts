import { ExternalModelsConfig } from '../types';

export async function delegateSubtaskToExternalModel(
  prompt: string,
  config: ExternalModelsConfig
): Promise<string> {
  const systemPrompt = "You are an expert anime image generation prompt engineer. Enhance the following prompt to make it more detailed, vivid, and suitable for a high-quality anime image generator. Keep the core subject and intent intact. Return ONLY the enhanced prompt text, without any conversational filler.";

  if (config.activeSubtaskModel === 'claude') {
    if (!config.claudeApiKey) throw new Error("Claude API key missing");
    
    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } 
  
  if (config.activeSubtaskModel === 'github') {
    // Mock implementation for GitHub Copilot as there's no direct public REST API for this specific use case
    console.log("Simulating GitHub Copilot prompt enhancement with token:", config.githubCopilotToken ? "Provided" : "Missing");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return prompt + " (Enhanced by GitHub Copilot)";
  }

  if (config.activeSubtaskModel === 'microsoft') {
    console.log("Simulating Microsoft Copilot prompt enhancement");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return prompt + " (Enhanced by Microsoft Copilot)";
  }

  if (config.activeSubtaskModel === 'pi') {
    const endpoint = config.piAgentEndpoint || 'http://localhost:11434/v1';
    const model = config.piAgentModel || 'llama3';
    
    console.log(`Delegating to Pi Agent at ${endpoint} using model ${model}`);
    
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.piAgentToken ? { 'Authorization': `Bearer ${config.piAgentToken}` } : {})
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Pi Agent API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    
    throw new Error("Invalid response format from Pi Agent");
  }

  return prompt;
}
