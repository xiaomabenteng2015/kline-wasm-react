'use client';
import React, { useState } from 'react';
import { fetchHistoricalKlines, KlineInterval } from '../../../services/binanceService';
import styles from '../../../styles/TrainPage.module.css';
import * as tf from '@tensorflow/tfjs';

export default function TrainPage() {
    const [trainingStatus, setTrainingStatus] = useState<string>('idle');
    const [trainingProgress, setTrainingProgress] = useState<number>(0);
    const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
    const [modelMetrics, setModelMetrics] = useState<any>(null);
    const [symbol, setSymbol] = useState<string>('BTCUSDT');
    const [dataSize, setDataSize] = useState<number>(5000);
    const [epochs, setEpochs] = useState<number>(50);
    const [batchSize, setBatchSize] = useState<number>(32);

    const addLog = (message: string) => {
        setTrainingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // 准备训练数据
    const prepareTrainingData = async () => {
        try {
            addLog(`开始获取${symbol}历史数据...`);
            setTrainingStatus('fetching');

            // 获取历史K线数据
            const klineData = await fetchHistoricalKlines(
                symbol,
                KlineInterval.ONE_DAY,
                dataSize
            );

            addLog(`获取到${klineData.length}条历史K线数据`);

            // 提取特征和标签
            const features: number[][] = [];
            const labels: number[] = [];
            const windowSize = 30; // 使用过去30天的数据作为特征

            for (let i = windowSize; i < klineData.length - 1; i++) {
                // 基础特征：过去30天的收盘价
                const closePrices = klineData.slice(i - windowSize, i).map(item => item.close);

                // 计算价格变化率（更有意义的特征）
                const priceChanges = [];
                for (let j = 1; j < closePrices.length; j++) {
                    priceChanges.push((closePrices[j] - closePrices[j - 1]) / closePrices[j - 1]);
                }

                // 添加成交量变化
                const volumes = klineData.slice(i - windowSize, i).map(item => item.volume);
                const volumeChanges = [];
                for (let j = 1; j < volumes.length; j++) {
                    volumeChanges.push((volumes[j] - volumes[j - 1]) / (volumes[j - 1] + 1)); // 避免除以0
                }

                // 合并特征
                const combinedFeatures = [...closePrices];

                features.push(combinedFeatures);

                // 标签：下一天价格是否上涨
                const nextDayChange = klineData[i].close > klineData[i - 1].close ? 1 : 0;
                labels.push(nextDayChange);
            }

            addLog(`准备了${features.length}个训练样本`);

            // 转换为张量
            const xsTensor = tf.tensor2d(features);
            const ysTensor = tf.tensor2d(labels, [labels.length, 1]);

            // 归一化特征
            const mean = xsTensor.mean(0);
            const std = xsTensor.sub(mean).square().mean(0).sqrt();

            // 避免除以0（当标准差接近0时）
            const epsilon = tf.scalar(1e-7);
            const stdWithEpsilon = std.add(epsilon);

            const xsNorm = xsTensor.sub(mean).div(stdWithEpsilon);

            // 划分训练集和测试集
            const splitIdx = Math.floor(features.length * 0.8);

            // 确保形状正确
            const featureLength = features[0].length;
            const xsTrain = xsNorm.slice([0, 0], [splitIdx, featureLength]);
            const xsTest = xsNorm.slice([splitIdx, 0], [features.length - splitIdx, featureLength]);

            const ysTrain = ysTensor.slice([0, 0], [splitIdx, 1]);
            const ysTest = ysTensor.slice([splitIdx, 0], [features.length - splitIdx, 1]);

            addLog('数据准备完成，开始训练模型...');

            return {
                xsTrain, ysTrain, xsTest, ysTest,
                mean, std: stdWithEpsilon, // 保存归一化参数
                featureLength // 返回特征长度
            };
        } catch (error) {
            addLog(`数据准备失败: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    };

    // 创建和训练模型
    const trainModel = async () => {
        try {
            setTrainingStatus('preparing');
            const { xsTrain, ysTrain, xsTest, ysTest, mean, std, featureLength } = await prepareTrainingData();

            setTrainingStatus('training');
            addLog('创建模型...');

            // 创建模型
            const model = tf.sequential();

            // 添加LSTM层
            model.add(tf.layers.lstm({
                units: 64,
                returnSequences: true,
                inputShape: [featureLength, 1]
            }));

            // 添加Dropout层减少过拟合
            model.add(tf.layers.dropout({ rate: 0.2 }));

            // 添加第二个LSTM层
            model.add(tf.layers.lstm({
                units: 32,
                returnSequences: false
            }));

            // 添加Dropout层
            model.add(tf.layers.dropout({ rate: 0.2 }));

            // 添加Dense层
            model.add(tf.layers.dense({
                units: 16,
                activation: 'relu'
            }));

            // 添加输出层
            model.add(tf.layers.dense({
                units: 1,
                activation: 'sigmoid'
            }));

            // 编译模型
            model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            // 打印模型摘要
            model.summary();
            addLog('模型创建完成，开始训练...');

            // 重塑输入数据以适应LSTM
            const xsTrainReshaped = xsTrain.reshape([xsTrain.shape[0], featureLength, 1]);
            const xsTestReshaped = xsTest.reshape([xsTest.shape[0], featureLength, 1]);

            // 训练模型
            const history = await model.fit(xsTrainReshaped, ysTrain, {
                epochs,
                batchSize,
                validationData: [xsTestReshaped, ysTest],
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (logs) {
                            const progress = Math.round(((epoch + 1) / epochs) * 100);
                            setTrainingProgress(progress);

                            // 格式化日志输出，确保所有属性都存在
                            const lossValue = logs.loss ? logs.loss.toFixed(4) : 'N/A';
                            const accValue = logs.acc ? logs.acc.toFixed(4) : 'N/A';
                            const valLossValue = logs.val_loss ? logs.val_loss.toFixed(4) : 'N/A';
                            const valAccValue = logs.val_acc ? logs.val_acc.toFixed(4) : 'N/A';

                            addLog(`Epoch ${epoch + 1}/${epochs} - loss: ${lossValue} - accuracy: ${accValue} - val_loss: ${valLossValue} - val_accuracy: ${valAccValue}`);
                        }
                    }
                }
            });

            addLog('模型训练完成，评估模型...');

            // 评估模型
            const evalResult = await model.evaluate(xsTestReshaped, ysTest) as tf.Tensor[];

            if (evalResult && evalResult.length >= 2) {
                const testLoss = evalResult[0].dataSync()[0];
                const testAcc = evalResult[1].dataSync()[0];

                setModelMetrics({
                    testLoss,
                    testAcc
                });

                addLog(`测试集损失: ${testLoss.toFixed(4)}, 测试集准确率: ${testAcc.toFixed(4)}`);

                // 计算模型在测试集上的预测
                const predictions = model.predict(xsTestReshaped) as tf.Tensor;
                const predArray = Array.from(predictions.dataSync());
                const trueArray = Array.from(await ysTest.data());

                // 计算混淆矩阵
                let truePositives = 0;
                let falsePositives = 0;
                let trueNegatives = 0;
                let falseNegatives = 0;

                for (let i = 0; i < predArray.length; i++) {
                    const predicted = predArray[i] > 0.5 ? 1 : 0;
                    const actual = trueArray[i];

                    if (predicted === 1 && actual === 1) truePositives++;
                    if (predicted === 1 && actual === 0) falsePositives++;
                    if (predicted === 0 && actual === 0) trueNegatives++;
                    if (predicted === 0 && actual === 1) falseNegatives++;
                }

                // 计算精确率和召回率
                const precision = truePositives / (truePositives + falsePositives) || 0;
                const recall = truePositives / (truePositives + falseNegatives) || 0;
                const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

                addLog(`精确率: ${precision.toFixed(4)}, 召回率: ${recall.toFixed(4)}, F1分数: ${f1Score.toFixed(4)}`);
                addLog(`混淆矩阵: TP=${truePositives}, FP=${falsePositives}, TN=${trueNegatives}, FN=${falseNegatives}`);

                // 清理张量
                predictions.dispose();
            } else {
                addLog('模型评估结果无效');
            }

            // 保存模型
            addLog('保存模型...');
            const modelName = `${symbol}_prediction_model_${new Date().getTime()}`;
            await model.save(`downloads://${modelName}`);
            addLog(`模型已保存为 ${modelName}，可以下载使用`);

            // 保存归一化参数
            const normParams = {
                mean: Array.from(mean.dataSync()),
                std: Array.from(std.dataSync())
            };

            const normParamsBlob = new Blob(
                [JSON.stringify(normParams)],
                { type: 'application/json' }
            );
            const normParamsUrl = URL.createObjectURL(normParamsBlob);

            // 创建下载链接
            const normParamsLink = document.createElement('a');
            normParamsLink.href = normParamsUrl;
            normParamsLink.download = `${modelName}_norm_params.json`;
            normParamsLink.click();

            setTrainingStatus('completed');

            // 清理张量
            xsTrain.dispose();
            ysTrain.dispose();
            xsTest.dispose();
            ysTest.dispose();
            xsTrainReshaped.dispose();
            xsTestReshaped.dispose();
            mean.dispose();
            std.dispose();
            evalResult.forEach(tensor => tensor.dispose());

        } catch (error) {
            addLog(`训练失败: ${error instanceof Error ? error.message : String(error)}`);
            setTrainingStatus('failed');
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>模型训练</h1>

            <div className={styles.configSection}>
                <h2>训练配置</h2>
                <div className={styles.configGrid}>
                    <div className={styles.configItem}>
                        <label>交易对:</label>
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            disabled={trainingStatus !== 'idle' && trainingStatus !== 'completed' && trainingStatus !== 'failed'}
                        />
                    </div>

                    <div className={styles.configItem}>
                        <label>数据大小:</label>
                        <input
                            type="number"
                            value={dataSize}
                            onChange={(e) => setDataSize(Number(e.target.value))}
                            disabled={trainingStatus !== 'idle' && trainingStatus !== 'completed' && trainingStatus !== 'failed'}
                        />
                    </div>

                    <div className={styles.configItem}>
                        <label>训练轮数:</label>
                        <input
                            type="number"
                            value={epochs}
                            onChange={(e) => setEpochs(Number(e.target.value))}
                            disabled={trainingStatus !== 'idle' && trainingStatus !== 'completed' && trainingStatus !== 'failed'}
                        />
                    </div>

                    <div className={styles.configItem}>
                        <label>批次大小:</label>
                        <input
                            type="number"
                            value={batchSize}
                            onChange={(e) => setBatchSize(Number(e.target.value))}
                            disabled={trainingStatus !== 'idle' && trainingStatus !== 'completed' && trainingStatus !== 'failed'}
                        />
                    </div>
                </div>

                <button
                    className={styles.trainButton}
                    onClick={trainModel}
                    disabled={trainingStatus !== 'idle' && trainingStatus !== 'completed' && trainingStatus !== 'failed'}
                >
                    {trainingStatus === 'idle' || trainingStatus === 'completed' || trainingStatus === 'failed' ? '开始训练' : '训练中...'}
                </button>
            </div>

            {trainingStatus !== 'idle' && (
                <div className={styles.progressSection}>
                    <h2>训练进度</h2>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${trainingProgress}%` }}
                        ></div>
                    </div>
                    <div className={styles.progressText}>
                        {trainingProgress}%
                    </div>
                </div>
            )}

            {modelMetrics && (
                <div className={styles.metricsSection}>
                    <h2>模型评估</h2>
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricItem}>
                            <span className={styles.metricLabel}>测试集损失:</span>
                            <span className={styles.metricValue}>{modelMetrics.testLoss.toFixed(4)}</span>
                        </div>
                        <div className={styles.metricItem}>
                            <span className={styles.metricLabel}>测试集准确率:</span>
                            <span className={styles.metricValue}>{modelMetrics.testAcc.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.logsSection}>
                <h2>训练日志</h2>
                <div className={styles.logs}>
                    {trainingLogs.map((log, index) => (
                        <div key={index} className={styles.logEntry}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}