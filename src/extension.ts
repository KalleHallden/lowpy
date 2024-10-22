import { exec } from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let currentDecorationType: vscode.TextEditorDecorationType | undefined;
let timeout: NodeJS.Timeout | undefined;

function activate(context: vscode.ExtensionContext) {
    console.log('Python Live Execution Extension is now active!');

    // Subscribe to text document change events and selection change events
    let disposable = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateOutput(editor);
        }
    });

    let selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        const editor = event.textEditor;
        updateOutput(editor);
    });

    context.subscriptions.push(disposable, selectionChangeDisposable);
}

function updateOutput(editor: vscode.TextEditor) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const currentLine = editor.selection.active.line;
        const currentLineText = editor.document.lineAt(currentLine).text.trim();
        if ((currentLineText.startsWith('print(') || 
            (/\w+\s*\(.*\)/.test(currentLineText) && !currentLineText.startsWith('def '))) &&
            !currentLineText.startsWith('for ') && !currentLineText.startsWith('while ') && 
            !currentLineText.startsWith('if ') && !currentLineText.startsWith('elif ') && 
            !currentLineText.startsWith('else:')) {
            const documentText = editor.document.getText();
            runPythonCode(documentText, editor, currentLine);
        } else {
            clearOutput(editor);
        }
    }, 300);
}

// Function to clear the output decoration
function clearOutput(editor: vscode.TextEditor) {
    if (currentDecorationType) {
        editor.setDecorations(currentDecorationType, []);
        currentDecorationType.dispose();
        currentDecorationType = undefined;
    }
}

// Function to run Python code and display results inline
function runPythonCode(code: string, editor: vscode.TextEditor, currentLine: number) {
    const lines = code.split('\n');
    const currentLineText = lines[currentLine].trim();
    if (!currentLineText) {
        return;
    }

    // Prepare the code to execute
    const codeToExecute = lines.slice(0, currentLine + 1).join('\n') + '\n';
    const tempFilePath = path.join(__dirname, 'temp.py');
    fs.writeFileSync(tempFilePath, codeToExecute);

    // Execute the code up to the current line
    exec(`python3 "${tempFilePath}"`, (error, stdout, stderr) => {
        if (error || stderr) {
            let errorMessage = stderr || (error ? error.message : '');
            // Check if the error is a NameError and format it accordingly
            if (errorMessage.includes('NameError:')) {
                const match = errorMessage.match(/NameError: name '(\w+)' is not defined/);
                if (match) {
                    errorMessage = `NameError: name '${match[1]}' is not defined`;
                }
            }
            displayInlineOutput(errorMessage, editor, currentLine);
        } else {
            // Split the output and get the last non-empty line
            const outputLines = stdout.trim().split('\n');
            const lastOutput = outputLines[outputLines.length - 1];
            displayInlineOutput(lastOutput, editor, currentLine);
        }

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);
    });
}

// Function to display inline results in the editor
function displayInlineOutput(output: string, editor: vscode.TextEditor, currentLine: number) {
    if (!output.trim()) {
        return;
    }

    const currentLineText = editor.document.lineAt(currentLine).text;
    const decorations: vscode.DecorationOptions[] = [{
        range: new vscode.Range(currentLine, currentLineText.length, currentLine, currentLineText.length),
        renderOptions: {
            after: {
                contentText: ` # ${output.trim()}`,
                color: 'grey'
            }
        }
    }];

    // Clear the previous decoration if it exists
    if (currentDecorationType) {
        editor.setDecorations(currentDecorationType, []);
        currentDecorationType.dispose();
    }

    // Define a new decoration type with greyed-out text
    currentDecorationType = vscode.window.createTextEditorDecorationType({});

    // Apply the decorations
    editor.setDecorations(currentDecorationType, decorations);
}

function deactivate() {
    console.log('Python Live Execution Extension is now deactivated.');
}

module.exports = {
    activate,
    deactivate
};
