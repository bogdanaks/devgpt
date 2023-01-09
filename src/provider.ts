import * as vscode from "vscode"
import { Configuration, OpenAIApi } from "openai"
import { createPrompt } from "./utils"

export type Settings = {
  apiKey: string
  model: string
  maxTokens?: number
  temperature?: number
}

export class DevGPTProvider implements vscode.TextDocumentContentProvider {
  static SCHEME = "devgpt"
  private _settings: Settings = {
    apiKey: "",
    model: "text-davinci-003",
    maxTokens: 500,
    temperature: 0.7,
  }
  private _apiConfiguration?: Configuration
  private _openai?: OpenAIApi

  private _response = ""
  private _uri: vscode.Uri = vscode.Uri.parse(
    `${DevGPTProvider.SCHEME}:DevGPT.md`
  )
  private _id = 0
  private _textDocument: vscode.TextDocument | null = null

  private _statusBarItem: vscode.StatusBarItem

  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem()
    this._statusBarItem.text = "$(loading~spin) Loading DevGPT"
  }

  provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<string> {
    return this._response
  }

  private _newAPI() {
    if (!this._apiConfiguration || !this._settings.apiKey) {
      console.warn(
        "API key not set, please go to extension settings (read README.md for more info)"
      )
    } else {
      this._openai = new OpenAIApi(this._apiConfiguration)
    }
  }

  public setSettings(settings: Settings) {
    this._settings = settings
    this._apiConfiguration = new Configuration({ apiKey: settings.apiKey })
  }

  public updateApiKey(apiKey: string) {
    this._settings = {
      ...this._settings,
      apiKey,
    }
    this._apiConfiguration = new Configuration({ apiKey })
    this._openai = new OpenAIApi(this._apiConfiguration)
  }

  public removeApiKey() {
    this._settings = {
      ...this._settings,
      apiKey: "",
    }
    this._apiConfiguration = undefined
    this._openai = undefined
  }

  public async search(prompt: string) {
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: "DevGPT",
      cancellable: true,
    }
    await vscode.window.withProgress(
      progressOptions,
      async (progress, token) => {
        progress.report({ message: "Preparation..." })

        if (token.isCancellationRequested) {
          return
        }

        if (!this._openai) {
          this._newAPI()
        }

        if (!this._openai) {
          this.showErrorAlert(
            "API token not set, please go to extension settings to set it (read README.md for more info)"
          )
          return
        }

        try {
          this._statusBarItem.show()
          if (this._textDocument) {
            this._response = ""
          }

          if (!this._textDocument?.isClosed) {
            this.incrementUri()
          }

          const selection = vscode.window.activeTextEditor?.selection
          const selectedText =
            vscode.window.activeTextEditor?.document.getText(selection)
          const searchPrompt = createPrompt(prompt, selectedText)

          progress.report({ increment: 75, message: "Loading..." })
          const completion = await this._openai.createCompletion({
            model: this._settings.model,
            max_tokens: this._settings.maxTokens,
            prompt: searchPrompt,
          })

          this._response = completion.data.choices[0].text?.trim() || ""
          progress.report({ increment: 90, message: "Formatting..." })

          this._textDocument = await vscode.workspace.openTextDocument(
            this._uri
          )
          await vscode.window.showTextDocument(this._textDocument, {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true,
            preview: true,
          })

          this._statusBarItem.hide()
        } catch (error: any) {
          let errMsg = ""
          if (error.response) {
            errMsg = `${error.response.status} ${error.response.data.error.message}`
          } else {
            errMsg = error.message
          }

          this.showErrorAlert(errMsg)
        }

        progress.report({ increment: 100, message: "" })
      }
    )
  }

  protected incrementUri() {
    this._uri = vscode.Uri.parse(
      `${DevGPTProvider.SCHEME}:DevGPT[${this._id}].md`
    )
    this._id++
  }

  protected showErrorAlert(error: string) {
    vscode.window.showErrorMessage(`[ERROR] ${error}`)
  }
}
