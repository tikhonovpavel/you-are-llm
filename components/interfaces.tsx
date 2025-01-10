interface TextData {
  sequence: string[];
}

interface PredictionItem {
  token: string;
  probability: number;
}

interface ModelPredictions {
  [modelName: string]: PredictionItem[];
}

interface TextPreview {
  id: string;
  preview: string;
}

interface DisplayedToken {
  text: string;
  isCorrect: boolean;
  wrongGuess: string | null;
}

interface SuggestionItem {
    token: string;
    distance: number;
    isExactMatch: boolean;
}

interface WebpackRequire {
    context(
        directory: string,
        useSubdirectories?: boolean,
        regExp?: RegExp
    ): {
        keys(): string[];
        <T>(id: string): T;
        resolve(id: string): string;
    };
}

export type {
    TextData,
    PredictionItem,
    ModelPredictions,
    TextPreview,
    DisplayedToken,
    SuggestionItem,
    WebpackRequire
}