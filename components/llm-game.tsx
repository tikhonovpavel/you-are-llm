'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { SkipForward } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import seedrandom from 'seedrandom';

import {
    TextData,
    PredictionItem,
    ModelPredictions,
    TextPreview,
    DisplayedToken,
    SuggestionItem,
    WebpackRequire
} from './interfaces';
import { levenshteinDistance, normalizeToken } from './utils';
import TOKEN_VOCABULARY from './assets/llama-3-8b__tokens.json';


const LLMGame: React.FC = () => {
    const [availableTexts, setAvailableTexts] = useState<TextPreview[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string>('');
    const [currentText, setCurrentText] = useState<TextData | null>(null);
    const [predictions, setPredictions] = useState<ModelPredictions[] | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [displayedTokens, setDisplayedTokens] = useState<DisplayedToken[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [score, setScore] = useState<number>(0);
    const [gameCompleted, setGameCompleted] = useState<boolean>(false);
    const [isInputActive, setIsInputActive] = useState<boolean>(true);
    const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
    const [skipCount, setSkipCount] = useState<number>(0);
    const [isHardcoreMode, setIsHardcoreMode] = useState<boolean>(true);

    const SPACE_SYMBOL = 'Ġ';

    useEffect(() => {
        const loadAvailableTexts = async () => {
            try {
                const textsContext = (require as unknown as WebpackRequire).context('./assets/texts', false, /\.json$/);
                const texts = await Promise.all(
                    textsContext.keys().map(async (key: string) => {
                        const path = key.slice(2);
                        const textModule = await import(`./assets/texts/${path}`);
                        const preview = textModule.default.sequence
                            .slice(0, 10)
                            .map((token: string) => token.startsWith(SPACE_SYMBOL) ? ' ' + token.slice(1) : token)
                            .join('');
                        
                        return {
                            id: path.replace('.json', ''),
                            preview
                        };
                    })
                );
                setAvailableTexts(texts);
            } catch (error) {
                console.error('Error loading texts:', error);
            }
        };
        loadAvailableTexts();
    }, []);

    const loadTextData = async (textId: string) => {
        try {
            const textModule = await import(`./assets/texts/${textId}.json`);
            const predictionsModule = await import(`./assets/predictions/${textId}_predictions.json`);
            
            setCurrentText(textModule.default);
            setPredictions(predictionsModule.default);
            
            const initialTokens: DisplayedToken[] = textModule.default.sequence.slice(0, 10).map((token: string) => ({
                text: token,
                isCorrect: true,
                wrongGuess: null,
            }));
            
            setDisplayedTokens(initialTokens);
            setCurrentStep(10);
            setScore(0);
            setSkipCount(0);
            setGameCompleted(false);
            setIsInputActive(true);
            setSelectedTokenIndex(null);
            setUserInput('');
            setSuggestions([]);
        } catch (error) {
            console.error('Error loading text data:', error);
        }
    };

    const handleTextSelection = (textId: string) => {
        setSelectedTextId(textId);
        loadTextData(textId);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setUserInput(input);

        if (input.length > 0) {
            const currentSuggestions = TOKEN_VOCABULARY;

            const sortedSuggestions = currentSuggestions
                .map((token: string) => {
                    const normalizedInput = normalizeToken(input, SPACE_SYMBOL);
                    const normalizedToken = normalizeToken(token, SPACE_SYMBOL);
                    const isExactMatch = token === input;
            
                    return {
                        token,
                        distance: levenshteinDistance(
                            normalizedInput.toLowerCase(),
                            normalizedToken.toLowerCase()
                        ),
                        isExactMatch,
                    };
                })
                .sort((a: SuggestionItem, b: SuggestionItem) => {
                    if (a.isExactMatch && !b.isExactMatch) return -1;
                    if (!a.isExactMatch && b.isExactMatch) return 1;
                    return a.distance - b.distance;
                })
                .slice(0, 7)
                .map((item: SuggestionItem) => item.token);

            setSuggestions(sortedSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const getModelSuggestions = (seed: number = 1): string[] => {
        const rng = seedrandom(String(seed));
     
        if (!predictions || !currentText) return [];
     
        const currentPredictions = predictions[currentStep];
        if (!currentPredictions || Object.keys(currentPredictions).length === 0) return [];
     
        // Take first model's predictions (assuming there's at least one model)
        const modelName = Object.keys(currentPredictions)[0];
        const modelPredictions = currentPredictions[modelName];
     
        // Get top 5 predictions
        let topPredictions = modelPredictions
            .slice(0, 5)
            .map(pred => pred.token);
     
        // Check if correct token is in the predictions
        const correctToken = currentText.sequence[currentStep];
        if (!topPredictions.includes(correctToken)) {
            // Replace the lowest probability prediction with the correct token
            topPredictions[4] = correctToken;
        }
     
        // Shuffle using seeded random
        return topPredictions.sort(() => rng() - 0.5);
     };

    const handleSuggestionClick = (token: string) => {
        if (!currentText) return;

        const correctToken = currentText.sequence[currentStep];
        const isCorrect = token === correctToken;

        if (isCorrect) {
            setScore(prevScore => prevScore + 1);
        }

        setDisplayedTokens(prev => [
            ...prev,
            {
                text: correctToken,
                isCorrect: isCorrect,
                wrongGuess: isCorrect ? null : token,
            },
        ]);

        const nextStep = currentStep + 1;
        if (nextStep < currentText.sequence.length) {
            setCurrentStep(nextStep);
            setUserInput('');
            setSuggestions([]);
        } else {
            setGameCompleted(true);
            setIsInputActive(false);
        }
    };

    const handleSkipToken = () => {
        if (!currentText || gameCompleted) return;

        const correctToken = currentText.sequence[currentStep];
        
        setDisplayedTokens(prev => [
            ...prev,
            {
                text: correctToken,
                isCorrect: false,
                wrongGuess: 'skipped',
            },
        ]);

        setSkipCount(prev => prev + 1);
        
        const nextStep = currentStep + 1;
        if (nextStep < currentText.sequence.length) {
            setCurrentStep(nextStep);
            setUserInput('');
            setSuggestions([]);
        } else {
            setGameCompleted(true);
            setIsInputActive(false);
        }
    };

    const calculateAccuracy = (): string => {
        if (!currentText) return "0.0";
        const totalAttempts = currentStep - 10;
        const accuracyScore = ((score / (totalAttempts || 1)) * 100).toFixed(1);
        return accuracyScore;
    };

    const handleTokenClick = (index: number) => {
        setSelectedTokenIndex(selectedTokenIndex === index ? null : index);
    };

    if (!currentText) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>You are an LLM</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={handleTextSelection}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите текст для предсказания..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTexts.map((text) => (
                                <SelectItem key={text.id} value={text.id}>
                                    {text.preview}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="relative w-full pr-80">
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>You are an LLM</CardTitle>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={isHardcoreMode}
                                onCheckedChange={setIsHardcoreMode}
                                id="mode-switch"
                            />
                            <Label htmlFor="mode-switch">Hardcore mode</Label>
                        </div>
                    </div>
                    <Select value={selectedTextId} onValueChange={handleTextSelection}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите текст для предсказания..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTexts.map((text) => (
                                <SelectItem key={text.id} value={text.id}>
                                    {text.preview}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg text-lg font-medium leading-loose">
                        {displayedTokens.map((token, index) => {
                            const hasPrefix = token.text.startsWith(SPACE_SYMBOL);
                            const [prefix, mainText] = hasPrefix
                                ? [token.text[0], token.text.slice(1)]
                                : ['', token.text];

                            const needsWordSpace =
                                index < displayedTokens.length - 1 &&
                                displayedTokens[index + 1].text.startsWith(SPACE_SYMBOL);

                            return (
                                <span
                                    key={index}
                                    className={`relative inline-block mt-6 cursor-pointer ${
                                        selectedTokenIndex === index ? 'ring-2 ring-blue-500 rounded' : ''
                                    }`}
                                    onClick={() => handleTokenClick(index)}
                                    style={{
                                        marginRight: needsWordSpace ? '1.1rem' : '0.1rem',
                                    }}
                                >
                                    {token.wrongGuess && (
                                        <div className="absolute -top-6 left-0 w-full text-center">
                                            <span className="line-through text-gray-500 text-xs">
                                                {token.wrongGuess === 'skipped' ? '' : token.wrongGuess}
                                            </span>
                                        </div>
                                    )}
                                    <span
                                        className={`${
                                            token.isCorrect 
                                                ? token.wrongGuess 
                                                    ? '' 
                                                    : 'bg-green-100' 
                                                : token.wrongGuess === 'skipped'
                                                    ? 'bg-gray-300'
                                                    : 'bg-red-500'
                                        } px-1 rounded`}
                                    >
                                        {hasPrefix && (
                                            <span className="text-xs opacity-50">{prefix}</span>
                                        )}
                                        {mainText}
                                    </span>
                                </span>
                            );
                        })}

                        {!gameCompleted && (
                            <div className="relative inline-block">
                                {isHardcoreMode ? (
                                    <>
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={handleInputChange}
                                            className="bg-white border rounded px-2 py-1 w-24 inline-block focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder=""
                                            disabled={!isInputActive}
                                        />
                                        {suggestions.length > 0 && (
                                            <div className="absolute left-0 top-full mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                                <div className="flex flex-col p-1">
                                                    {suggestions.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                            className="px-3 py-2 text-left hover:bg-gray-100 rounded-sm"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col p-1 w-48 bg-white border rounded-md shadow-lg">
                                        {getModelSuggestions(currentStep).map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="px-3 py-2 text-left hover:bg-gray-100 rounded-sm"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div>
                                Прогресс: {currentStep} / {currentText.sequence.length - 1}
                            </div>
                            <div>Точность: {calculateAccuracy()}%</div>
                            {skipCount > 0 && (
                                <div className="text-gray-500">
                                    Пропущено: {skipCount}
                                </div>
                            )}
                        </div>
                        {!gameCompleted && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSkipToken}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <SkipForward className="w-4 h-4" />
                                <span>Пропустить</span>
                            </Button>
                        )}
                    </div>

                    {gameCompleted && (
                        <div className="space-y-2">
                            <p className="text-lg">Игра завершена!</p>
                            <p>Итоговая точность: {calculateAccuracy()}%</p>
                            {skipCount > 0 && (
                                <p className="text-gray-600">Пропущено токенов: {skipCount}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedTokenIndex !== null && predictions && predictions[selectedTokenIndex] && (
                <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-lg border-l px-4 py-6 z-50">
                    <h2 className="text-lg font-semibold mb-2">
                        Предсказания для <code className="font-mono text-sm bg-gray-100 p-2 rounded block my-2 whitespace-pre-wrap">
                            {currentText.sequence.slice(0, selectedTokenIndex).join('').replace(new RegExp(SPACE_SYMBOL, 'g'), ' ')}
                        </code>
                    </h2>

                    {Object.entries(predictions[selectedTokenIndex]).map(([modelName, modelPredictions]) => (
                        <div key={modelName} className="mb-6">
                            <h3 className="font-medium">{modelName}</h3>
                            <div className="space-y-1 mt-2">
                                {modelPredictions.map((item: PredictionItem, idx: number) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <div className="w-24">{item.token}</div>
                                        <div className="flex-1 bg-gray-200 h-3 relative rounded">
                                            <div
                                                className="bg-blue-500 h-3 rounded"
                                                style={{ width: `${item.probability * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-8 text-right">
                                            {(item.probability * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setSelectedTokenIndex(null)}
                        className="mt-6 py-1 px-3 rounded bg-gray-300 hover:bg-gray-400 transition"
                    >
                        Закрыть
                    </button>
                </div>
            )}
        </div>
    );
};

export default LLMGame;