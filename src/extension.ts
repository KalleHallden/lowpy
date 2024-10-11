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
	let linesAboveCursor = [];

	// Temporary solution to get the code snippet above the cursor 
	// But only for the current function
	for (let i = 0; i <= cursorPosition.line; i++) {
		const lineText = editor.document.lineAt(i).text;
		const functions = lineText.match(/^\s*def\s+\w+\s*\(.*\)\s*:/);
		if (functions) {
			linesAboveCursor = [];
		} else {
			linesAboveCursor.push(lineText.trim());
		}
	}

	// Check if the line that the cursor is on is empty
    const currentLineText = editor.document.lineAt(cursorPosition.line).text;
	let isEmpty = false;
    if (!currentLineText.trim()) {
        isEmpty = true;
		displayInlineOutput("", editor);
    } else {
		const codeSnippet = linesAboveCursor.join('\n');
	
		const functionMatch = codeSnippet.match(/def\s+(\w+)\s*\(.*\)\s*:/);
		if (functionMatch) {
			const functionName = functionMatch[1];
			//console.log(functionName);
		}
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
			const escapedCodeSnippet = codeSnippet.replace(/^\s+/gm, '\t').replace(/"/g, "'");
			const command = `python3 -c "${escapedCodeSnippet.trim()}"`;
			exec(command, (error, stdout, stderr) => {
				if (error || stderr) {
					const errorMessage = stderr.split('\n').filter(line => line.trim() !== '').pop() || (error ? error.message : '');
					displayInlineOutput(errorMessage, editor);
				} else {
					displayInlineOutput(stdout, editor);
				}
			});
		}
	}
}

// Function to display inline results in the editor
function displayInlineOutput(output: string, editor: vscode.TextEditor) {
    const cursorPosition = editor.selection.active;
	const line = editor.document.lineAt(cursorPosition.line);
    const endOfLine = line.range.end;
    const range = new vscode.Range(endOfLine, endOfLine);

	// Split the output by newlines and filter out empty lines
	const outputLines = output.split('\n').filter(line => line.trim() !== '');
	const mostRecentOutput = outputLines.pop() || '';

    // Clear the previous decoration if it exists
    if (currentDecorationType) {
        editor.setDecorations(currentDecorationType, []);
        currentDecorationType.dispose();
    }

    // Define a new decoration type with greyed-out text
    currentDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: ` # ${mostRecentOutput.trim()}`,
            color: 'grey',
            margin: '0 0 0 1em'
        }
    });

    // Create a decoration for the current line at the cursor position
    const decoration = {
        range: range,
        renderOptions: {
            after: {
                contentText: ` # ${mostRecentOutput.trim()}`,
                color: 'grey'
            }
        }
    };
	if (output !== "") {
    // Apply the decoration to the editor
    editor.setDecorations(currentDecorationType, [decoration]);
	} else {
		editor.setDecorations(currentDecorationType, []);
	}
}

function deactivate() {
    console.log('Python Live Execution Extension is now deactivated.');
}

module.exports = {
    activate,
    deactivate
};