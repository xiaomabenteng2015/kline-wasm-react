'use client';

import { useState } from 'react';
import { AVAILABLE_MODELS, buildModelUrls } from '../../../services/transformersModelSelectorService';

export default function ModelUrlDebugger() {
    const [selectedModelId, setSelectedModelId] = useState('distilgpt2');
    const [showUrls, setShowUrls] = useState(false);

    const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
    const urls = selectedModel ? buildModelUrls(selectedModel.modelPath) : null;

    return (
        <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '16px',
            margin: '16px 0'
        }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                模型 URL 调试器
            </h3>

            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    选择模型：
                </label>
                <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px'
                    }}
                >
                    {AVAILABLE_MODELS.filter(m => m.loadType === 'remote').map(model => (
                        <option key={model.id} value={model.id}>
                            {model.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={() => setShowUrls(!showUrls)}
                style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginBottom: '12px'
                }}
            >
                {showUrls ? '隐藏 URLs' : '显示 URLs'}
            </button>

            {showUrls && selectedModel && urls && (
                <div>
                    <h4 style={{ margin: '12px 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                        模型路径: <code style={{ background: '#e9ecef', padding: '2px 4px', borderRadius: '3px' }}>
                            {selectedModel.modelPath}
                        </code>
                    </h4>

                    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                        <p><strong>仓库主页:</strong></p>
                        <a href={urls.repoUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'none', wordBreak: 'break-all' }}>
                            {urls.repoUrl}
                        </a>

                        <p style={{ marginTop: '12px' }}><strong>模型文件:</strong></p>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                            <li>
                                <a href={urls.model} target="_blank" rel="noopener noreferrer"
                                    style={{ color: '#007bff', textDecoration: 'none', fontSize: '12px', wordBreak: 'break-all' }}>
                                    {urls.model}
                                </a>
                            </li>
                            <li>
                                <a href={urls.modelQuantized} target="_blank" rel="noopener noreferrer"
                                    style={{ color: '#007bff', textDecoration: 'none', fontSize: '12px', wordBreak: 'break-all' }}>
                                    {urls.modelQuantized}
                                </a>
                            </li>
                        </ul>

                        <p style={{ marginTop: '12px' }}><strong>配置文件:</strong></p>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                            <li>
                                <a href={urls.tokenizer} target="_blank" rel="noopener noreferrer"
                                    style={{ color: '#007bff', textDecoration: 'none', fontSize: '12px', wordBreak: 'break-all' }}>
                                    {urls.tokenizer}
                                </a>
                            </li>
                            <li>
                                <a href={urls.tokenizerConfig} target="_blank" rel="noopener noreferrer"
                                    style={{ color: '#007bff', textDecoration: 'none', fontSize: '12px', wordBreak: 'break-all' }}>
                                    {urls.tokenizerConfig}
                                </a>
                            </li>
                            <li>
                                <a href={urls.config} target="_blank" rel="noopener noreferrer"
                                    style={{ color: '#007bff', textDecoration: 'none', fontSize: '12px', wordBreak: 'break-all' }}>
                                    {urls.config}
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        padding: '8px',
                        marginTop: '12px',
                        fontSize: '12px'
                    }}>
                        <strong>说明:</strong> Transformers.js 会自动从这些 URL 下载所需的文件。
                        您可以点击链接查看文件是否存在。
                    </div>
                </div>
            )}
        </div>
    );
}