'use client';
import React from 'react';
import Link from 'next/link';
import styles from './styles/HomePage.module.css';

export default function HomePage() {
  const modules = [
    {
      title: 'K线推理系统',
      description: '完整的机器学习工作流程，包含数据分析、模型训练和推理预测功能',
      features: ['实时K线数据分析', '模型训练与优化', '智能推理预测', '模型管理'],
      href: '/views/kline-system',
      icon: '📈',
      color: 'primary'
    },
    {
      title: 'WebLLM 聊天',
      description: '基于WebLLM的浏览器端AI聊天体验',
      features: ['浏览器端运行', 'WebLLM模型', '无服务器依赖', '隐私保护'],
      href: '/views/ai',
      icon: '🤖',
      color: 'secondary'
    },
    {
      title: 'ONNX聊天',
      description: '基于ONNX Runtime的高性能AI聊天系统',
      features: ['ONNX模型', '高性能推理', '本地部署', '快速响应'],
      href: '/views/onnx-chat',
      icon: '⚡',
      color: 'accent'
    },
    {
      title: 'Transformers聊天',
      description: '基于Transformers.js的浏览器端AI聊天体验',
      features: ['浏览器端运行', 'Transformers模型', '无服务器依赖', '隐私保护'],
      href: '/views/transformers-chat',
      icon: '🔄',
      color: 'info'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>AI模型加载测试平台</h1>
        <p className={styles.heroSubtitle}>
          集成多种AI技术的综合测试平台，提供从数据分析到模型部署的完整解决方案
        </p>
      </div>

      <div className={styles.modulesGrid}>
        {modules.map((module, index) => (
          <Link key={index} href={module.href} className={styles.moduleCard}>
            <div className={`${styles.cardContent} ${styles[module.color]}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{module.icon}</span>
                <h3 className={styles.cardTitle}>{module.title}</h3>
              </div>

              <p className={styles.cardDescription}>{module.description}</p>

              <div className={styles.cardFeatures}>
                {module.features.map((feature, idx) => (
                  <span key={idx} className={styles.featureTag}>
                    {feature}
                  </span>
                ))}
              </div>

              <div className={styles.cardAction}>
                <span className={styles.actionText}>立即体验</span>
                <span className={styles.actionArrow}>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>4</div>
            <div className={styles.statLabel}>功能模块</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>3</div>
            <div className={styles.statLabel}>AI技术栈</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>100%</div>
            <div className={styles.statLabel}>浏览器兼容</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>∞</div>
            <div className={styles.statLabel}>扩展可能</div>
          </div>
        </div>
      </div>

      <div className={styles.quickStart}>
        <h2 className={styles.quickStartTitle}>快速开始</h2>
        <div className={styles.quickStartSteps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>选择功能模块</h4>
              <p>根据需求选择合适的AI功能模块</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>配置参数</h4>
              <p>调整模型参数和运行配置</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>开始体验</h4>
              <p>享受AI技术带来的便利</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}