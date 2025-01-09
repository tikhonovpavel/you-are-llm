# You Are LLM

An interactive game where you can experience being a language model by predicting the next token in a sequence. This project demonstrates how large language models process and predict text token by token.

## Features

- Token-by-token text prediction game
- Real-time feedback on your predictions
- Visual comparison with actual LLM predictions
- Token highlighting and error tracking
- Progress and accuracy statistics
- Skip tokens functionality
- Multiple text samples to choose from

## Tech Stack

- Next.js 15.1.4
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components
- shadcn/ui for styled components

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tikhonovpavel/you-are-llm.git
```

2. Install dependencies:
```bash
cd you-are-llm
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
```

### Deployment

The project is configured for GitHub Pages deployment. To deploy:

```bash
npm run deploy
```

## How to Play

1. Select a text sample from the dropdown menu
2. Try to predict the next token in the sequence
3. Type your prediction or select from suggestions
4. Get immediate feedback:
   - Green: Correct prediction
   - Red: Incorrect prediction
   - Gray: Skipped token
5. Click on any token to see actual LLM predictions for that position
6. Track your accuracy and progress throughout the game

## Project Structure

- `/app`: Next.js app router and main layout
- `/components`: React components including UI components from shadcn/ui
- `/assets`: Game data including text samples and LLM predictions
- `/public`: Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Tailwind CSS for styling
- Next.js framework