'use client';
import React, { useState } from 'react';
import styles from '../../styles/KlineSystemPage.module.css';

// 导入各个子组件
import KlineAnalysis from './components/KlineAnalysis';
import ModelTraining from './components/ModelTraining';
import ModelManagement from './components/ModelManagement';

export default function KlineSystemPage() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'training' | 'management'>('analysis');

  const tabs = [
    {
      key: 'analysis' as const,
      title: '数据分析与推理',
      icon: '📊',
      description: '实时K线数据分析和智能推理'
    },
    {
      key: 'training' as const,
      title: '模型训练',
      icon: '🧠',
      description: '训练和优化机器学习模型'
    },
    {
      key: 'management' as const,
      title: '模型管理',
      icon: '⚙️',
      description: '管理和部署训练好的模型'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>K线推理模型</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabList}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <div className={styles.tabIcon}>{tab.icon}</div>
              <div className={styles.tabContent}>
                <div className={styles.tabTitle}>{tab.title}</div>
                <div className={styles.tabDescription}>{tab.description}</div>
              </div>
            </button>
          ))}
        </div>
        <div className={styles.tabIndicator}>
          <div
            className={styles.indicator}
            style={{
              transform: `translateX(${tabs.findIndex(tab => tab.key === activeTab) * 100}%)`
            }}
          />
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'analysis' && <KlineAnalysis />}
        {activeTab === 'training' && <ModelTraining />}
        {activeTab === 'management' && <ModelManagement />}
      </div>
    </div>
  );
}