import { exec } from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let currentDecorationType: vscode.TextEditorDecorationType | undefined;

function activate(context: vscode.ExtensionContext) {
    console.log('Python Live Execution Extension is now active!');
    let timeout: NodeJS.Timeout;

    // Subscribe to text document change events (triggered every time the document is edited)
    let disposable = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        clearTimeout(timeout); // Clear any existing timeout to reset the timer

        timeout = setTimeout(() => {
            if (editor && event.document === editor.document) {
                // Get the entire document content (you could also limit this to the active line or selection)
                const documentText = editor.document.getText();
                const selectedText = editor.document.getText(editor.selection);

                // Run the Python code
                runPythonCode(selectedText || documentText, editor);
            }
        }, 300);
    });

    context.subscriptions.push(disposable);
}

// Function to run Python code and display results inline
function runPythonCode(code: string, editor: vscode.TextEditor) {
    if (!code.trim()) {
        // Do nothing if the document is empty or contains only whitespace
        return;
    }

    // Extract the relevant code snippet (current line or selection)
    const cursorPosition = editor.selection.active;
    const currentLine = editor.document.lineAt(cursorPosition.line).text;
    const codeSnippet = editor.selection.isEmpty ? currentLine : code;

    // Check if the code snippet is multi-line
    if (codeSnippet.includes('\n')) {
        // Write the code snippet to a temporary file
        const tempFilePath = path.join(__dirname, 'temp.py');
        fs.writeFileSync(tempFilePath, codeSnippet);

        // Execute the code snippet from the temporary file
        exec(`python3 "${tempFilePath}"`, (error, stdout, stderr) => {
            if (error || stderr) {
                displayInlineOutput(stderr || (error ? error.message : ''), editor);
            } else {
                displayInlineOutput(stdout, editor);
            }

            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);
        });
    } else {
        // Execute the single-line code snippet
        exec(`python3 -c "${codeSnippet.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
            if (error || stderr) {
                displayInlineOutput(stderr || (error ? error.message : ''), editor);
            } else {
                displayInlineOutput(stdout, editor);
            }
        });
    }
}

// Function to display inline results in the editor
function displayInlineOutput(output: string, editor: vscode.TextEditor) {
    const cursorPosition = editor.selection.active;

    // Clear the previous decoration if it exists
    if (currentDecorationType) {
        editor.setDecorations(currentDecorationType, []);
        currentDecorationType.dispose();
    }

    // Define a new decoration type with greyed-out text
    currentDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: ` # Hello Friend: ${output.trim()}`,
            color: 'grey',
            margin: '0 0 0 1em'
        }
    });

    // Create a decoration for the current line at the cursor position
    const decoration = {
        range: new vscode.Range(cursorPosition, cursorPosition),
        renderOptions: {
            after: {
                contentText: ` # Hello Friend: ${output.trim()}`,
                color: 'grey'
            }
        }
    };

    // Apply the decoration to the editor
    editor.setDecorations(currentDecorationType, [decoration]);
}

function deactivate() {
    console.log('Python Live Execution Extension is now deactivated.');
}

module.exports = {
    activate,
    deactivate
};