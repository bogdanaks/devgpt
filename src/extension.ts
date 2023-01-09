import * as vscode from "vscode"

import { DevGPTProvider } from "./provider"
import { setApiKey } from "./utils"

export const OPENAI_API_KEY = "OPENAI_API_KEY"

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("devgpt")

  const devGPT = new DevGPTProvider()
  devGPT.setSettings({
    apiKey: config.get<string>("apiKey") || "",
    model: config.get<string>("model") || "",
    maxTokens: config.get<number>("maxTokens"),
    temperature: config.get<number>("temperature"),
  })

  const commandHandler = (command: string) => {
    const prompt = config.get(command) as string
    devGPT.search(prompt)
  }

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      DevGPTProvider.SCHEME,
      devGPT
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("devgpt.ask", () =>
      vscode.window
        .showInputBox({ prompt: "What do you want to do?" })
        .then((value) => devGPT.search(value || ""))
    ),
    vscode.commands.registerCommand("devgpt.explain", () =>
      commandHandler("promptPrefix.explain")
    ),
    vscode.commands.registerCommand("devgpt.refactor", () =>
      commandHandler("promptPrefix.refactor")
    ),
    vscode.commands.registerCommand("devgpt.optimize", () =>
      commandHandler("promptPrefix.optimize")
    ),
    vscode.commands.registerCommand("devgpt.findProblems", () =>
      commandHandler("promptPrefix.findProblems")
    ),
    vscode.commands.registerCommand("devgpt.documentation", () =>
      commandHandler("promptPrefix.documentation")
    ),
    vscode.commands.registerCommand("devgpt.setApiKey", async () => {
      await setApiKey(context)
    }),
    vscode.commands.registerCommand("devgpt.removeApiKey", async () => {
      await context.secrets.delete(OPENAI_API_KEY)
      vscode.window.showWarningMessage("Your API KEY was removed")
    })
  )
}

// This method is called when your extension is deactivated
export function deactivate() {}
