# Lowpy

[![Build Status](https://img.shields.io/github/workflow/status/kallehallden/lowpy/CI)](https://github.com/kallehallden/lowpy/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Lowpy is a **Visual Studio Code extension** that provides **live feedback** on Python code execution. With Lowpy, you can instantly see the results of your code execution inline, making it easier to debug, test, and iterate faster.

## Features 

- **Live Execution**: Get instant feedback as you write Python code. Lowpy evaluates code on the fly and displays the results in your editor.

## TODO:
- **Inline Results**: Results of expressions, variables, and function calls are displayed inline in the code, so you don’t have to leave the editor to check the output.
- **Context Awareness**: Keep track of global and local variables, function definitions, and scopes as you write code, ensuring accurate evaluation of complex programs.
- **Efficient Execution**: Optimize code execution by running only the necessary parts of the code, avoiding unnecessary recomputation.
- **Basic math inline execution**: Make sure that even statements like: test = 2 * 2, should give an inline output of # 4

## Contributing

We welcome contributions to improve Lowpy! Here’s how you can get started:

1. Fork the repository and clone it locally:
   ```bash
   git clone https://github.com/kallehallden/lowpy.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open the project in Visual Studio Code and start developing.
4. Make your changes and submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgements

- Inspired by [Quokka.js](https://quokkajs.com/) for JavaScript
- Built using the [VS Code API](https://code.visualstudio.com/api) and [Python](https://www.python.org/)

## Contact

For any questions, issues, or suggestions, feel free to reach out or open an issue on GitHub.


