'use client';

import { useState } from 'react';
import { AVAILABLE_MODELS } from '../../../services/transformersModelSelectorService';
import styles from '../../../styles/ModelSelector.module.css';

interface ModelSelectorProps {
    onModelSelect: (modelId: string) => void;
    disabled?: boolean;
    selectedModelId?: string;
}

export default function ModelSelector({ onModelSelect, disabled, selectedModelId }: ModelSelectorProps) {
    const [selectedModel, setSelectedModel] = useState(selectedModelId || 'distilgpt2');

    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
    };

    const handleLoadModel = () => {
        onModelSelect(selectedModel);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>选择模型</h3>

            <div className={styles.infoBox}>
                <p className={styles.infoText}>
                    <strong>远程模型</strong>：直接从 Hugging Face Hub 下载，无需预先准备文件<br />
                    <strong>本地模型</strong>：需要预先下载模型文件到 /public/models/ 目录
                </p>
            </div>

            <div className={styles.modelList}>
                {AVAILABLE_MODELS.map((model) => (
                    <div
                        key={model.id}
                        className={`${styles.modelCard} ${selectedModel === model.id ? styles.selected : ''
                            }`}
                        onClick={() => !disabled && handleModelChange(model.id)}
                    >
                        <div className={styles.modelHeader}>
                            <input
                                type="radio"
                                name="model"
                                value={model.id}
                                checked={selectedModel === model.id}
                                onChange={() => handleModelChange(model.id)}
                                disabled={disabled}
                                className={styles.radio}
                            />
                            <div className={styles.modelInfo}>
                                <h4 className={styles.modelName}>{model.name}</h4>
                                <div className={styles.modelTags}>
                                    {model.size && <span className={styles.sizeTag}>{model.size}</span>}
                                    <span className={`${styles.loadTypeTag} ${styles[model.loadType]}`}>
                                        {model.loadType === 'remote' ? '远程' : '本地'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className={styles.modelDescription}>{model.description}</p>
                    </div>
                ))}
            </div>

            <button
                className={styles.loadButton}
                onClick={handleLoadModel}
                disabled={disabled}
            >
                {disabled ? '加载中...' : '加载选定模型'}
            </button>
        </div>
    );
}