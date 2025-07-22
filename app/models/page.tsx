'use client';
import React, { useState, useEffect } from 'react';
import styles from '../styles/ModelsPage.module.css';
import * as tf from '@tensorflow/tfjs';

interface ModelInfo {
    name: string;
    description: string;
    createdAt: string;
    accuracy?: number;
    isActive: boolean;
}

export default function ModelsPage() {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>('idle');
    const [modelName, setModelName] = useState<string>('');
    const [modelDescription, setModelDescription] = useState<string>('');
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [normParamsFile, setNormParamsFile] = useState<File | null>(null);

    // 从localStorage加载模型列表
    useEffect(() => {
        const savedModels = localStorage.getItem('kline_prediction_models');
        if (savedModels) {
            setModels(JSON.parse(savedModels));
        }
    }, []);

    // 保存模型列表到localStorage
    const saveModels = (updatedModels: ModelInfo[]) => {
        localStorage.setItem('kline_prediction_models', JSON.stringify(updatedModels));
        setModels(updatedModels);
    };

    // 处理模型文件选择
    const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setModelFile(e.target.files[0]);
        }
    };

    // 处理归一化参数文件选择
    const handleNormParamsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setNormParamsFile(e.target.files[0]);
        }
    };

    // 上传模型
    const handleUploadModel = async () => {
        if (!modelFile || !normParamsFile || !modelName) {
            alert('请填写模型名称并选择模型文件和归一化参数文件');
            return;
        }

        setUploadStatus('uploading');

        try {
            // 读取模型文件
            const modelArrayBuffer = await modelFile.arrayBuffer();
            const modelBlob = new Blob([modelArrayBuffer], { type: 'application/octet-stream' });
            const modelUrl = URL.createObjectURL(modelBlob);

            // 读取归一化参数文件
            const normParamsText = await normParamsFile.text();
            const normParams = JSON.parse(normParamsText);

            // 保存模型到IndexedDB
            const model = await tf.loadLayersModel(modelUrl);
            await model.save(`indexeddb://${modelName}`);

            // 保存归一化参数到localStorage
            localStorage.setItem(`${modelName}_norm_params`, JSON.stringify(normParams));

            // 更新模型列表
            const newModel: ModelInfo = {
                name: modelName,
                description: modelDescription,
                createdAt: new Date().toISOString(),
                isActive: models.length === 0 // 如果是第一个模型，则设为活跃
            };

            const updatedModels = [...models, newModel];
            saveModels(updatedModels);

            // 重置表单
            setModelName('');
            setModelDescription('');
            setModelFile(null);
            setNormParamsFile(null);
            setUploadStatus('success');

            // 3秒后重置状态
            setTimeout(() => {
                setUploadStatus('idle');
            }, 3000);
        } catch (error) {
            console.error('上传模型失败:', error);
            setUploadStatus('failed');
            alert(`上传模型失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // 设置活跃模型
    const setActiveModel = (modelName: string) => {
        const updatedModels = models.map(model => ({
            ...model,
            isActive: model.name === modelName
        }));
        saveModels(updatedModels);
    };

    // 删除模型
    const deleteModel = async (modelName: string) => {
        try {
            // 从IndexedDB删除模型
            await tf.io.removeModel(`indexeddb://${modelName}`);

            // 从localStorage删除归一化参数
            localStorage.removeItem(`${modelName}_norm_params`);

            // 更新模型列表
            const updatedModels = models.filter(model => model.name !== modelName);
            saveModels(updatedModels);

            // 如果删除的是活跃模型，则设置第一个模型为活跃
            if (updatedModels.length > 0 && !updatedModels.some(model => model.isActive)) {
                updatedModels[0].isActive = true;
                saveModels(updatedModels);
            }
        } catch (error) {
            console.error('删除模型失败:', error);
            alert(`删除模型失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // 查看模型详情
    const viewModelDetails = (modelName: string) => {
        setSelectedModel(modelName);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>模型管理</h1>

            <div className={styles.uploadSection}>
                <h2>上传新模型</h2>
                <div className={styles.uploadForm}>
                    <div className={styles.formGroup}>
                        <label>模型名称:</label>
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            disabled={uploadStatus === 'uploading'}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>模型描述:</label>
                        <textarea
                            value={modelDescription}
                            onChange={(e) => setModelDescription(e.target.value)}
                            disabled={uploadStatus === 'uploading'}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>模型文件 (.json):</label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleModelFileChange}
                            disabled={uploadStatus === 'uploading'}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>归一化参数文件 (.json):</label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleNormParamsFileChange}
                            disabled={uploadStatus === 'uploading'}
                        />
                    </div>

                    <button
                        className={styles.uploadButton}
                        onClick={handleUploadModel}
                        disabled={uploadStatus === 'uploading'}
                    >
                        {uploadStatus === 'uploading' ? '上传中...' : '上传模型'}
                    </button>

                    {uploadStatus === 'success' && (
                        <div className={styles.successMessage}>模型上传成功!</div>
                    )}

                    {uploadStatus === 'failed' && (
                        <div className={styles.errorMessage}>模型上传失败!</div>
                    )}
                </div>
            </div>

            <div className={styles.modelsSection}>
                <h2>已上传模型</h2>
                {models.length === 0 ? (
                    <div className={styles.noModels}>暂无模型</div>
                ) : (
                    <div className={styles.modelsList}>
                        {models.map((model) => (
                            <div
                                key={model.name}
                                className={`${styles.modelCard} ${model.isActive ? styles.activeModel : ''}`}
                            >
                                <div className={styles.modelHeader}>
                                    <h3>{model.name}</h3>
                                    {model.isActive && <span className={styles.activeTag}>当前使用</span>}
                                </div>
                                <p className={styles.modelDescription}>{model.description || '无描述'}</p>
                                <div className={styles.modelMeta}>
                                    <span>创建时间: {new Date(model.createdAt).toLocaleString()}</span>
                                    {model.accuracy && <span>准确率: {model.accuracy.toFixed(2)}%</span>}
                                </div>
                                <div className={styles.modelActions}>
                                    <button
                                        className={styles.viewButton}
                                        onClick={() => viewModelDetails(model.name)}
                                    >
                                        查看详情
                                    </button>
                                    {!model.isActive && (
                                        <button
                                            className={styles.activateButton}
                                            onClick={() => setActiveModel(model.name)}
                                        >
                                            设为活跃
                                        </button>
                                    )}
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => deleteModel(model.name)}
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedModel && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>模型详情: {selectedModel}</h2>
                        <button
                            className={styles.closeButton}
                            onClick={() => setSelectedModel(null)}
                        >
                            关闭
                        </button>
                        <div className={styles.modelDetails}>
                            {/* 这里可以添加更多模型详情 */}
                            <p>模型名称: {selectedModel}</p>
                            <p>模型描述: {models.find(m => m.name === selectedModel)?.description || '无描述'}</p>
                            <p>创建时间: {new Date(models.find(m => m.name === selectedModel)?.createdAt || '').toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}