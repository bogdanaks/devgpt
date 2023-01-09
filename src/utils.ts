import * as vscode from "vscode"
import { OPENAI_API_KEY } from "./extension"

export const setApiKey = async (context: vscode.ExtensionContext) => {
  const apiKey = await vscode.window.showInputBox({
    title: "Enter your API KEY",
    password: true,
    placeHolder: "sk-**********************************",
    ignoreFocusOut: true,
  })

  if (!apiKey) {
    vscode.window.showWarningMessage("API KEY is empty")
    return
  }

  await context.secrets.store(OPENAI_API_KEY, apiKey)

  vscode.window.showInformationMessage("API KEY successfully saved")

  return apiKey
}

export const createPrompt = (question: string, selection?: string) => {
  let prompt = ""
  prompt = `${question}\n\`\`\`\n${selection}\n\`\`\``

  prompt = `You are ASSISTANT helping the USER with coding.
You are intelligent, helpful and an expert developer, who always gives the correct answer and only does what instructed. You always answer truthfully and don't make thing up.
(When responding to the following prompt, please make sure to properly style your response using Github Flavored Markdown.
Use markdown syntax for things like headings, lists, colored text, code blocks, highlights etc. Make sure not to mention markdown or stying in your actual response.
Try to write code inside a single code block if possible)
\n\nUSER: ${prompt}\n\nASSISTANT: `

  return prompt
}
