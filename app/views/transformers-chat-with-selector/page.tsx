'use client';

import TransformersChatInterfaceWithSelector from './components/TransformersChatInterfaceWithSelector';
import styles from '../../styles/AIPage.module.css';

export default function TransformersChatWithSelectorPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Transformers.js 聊天助手 (模型选择版)</h1>

            <div className={styles.content}>
                <TransformersChatInterfaceWithSelector />
            </div>

            <div className={styles.disclaimer}>
                注意：模型在浏览器中本地运行，首次加载可能需要一些时间。不同模型的对话能力和响应质量会有所差异。
            </div>
        </div>
    );
}