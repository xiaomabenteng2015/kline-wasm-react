'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                K线预测系统
            </div>
            <ul className={styles.navLinks}>
                <li>
                    <Link
                        href="/"
                        className={pathname === '/' ? styles.active : ''}
                    >
                        首页
                    </Link>
                </li>
                <li>
                    <Link
                        href="/views/train"
                        className={pathname === '/views/train' ? styles.active : ''}
                    >
                        模型训练
                    </Link>
                </li>
                <li>
                    <Link
                        href="/views/models"
                        className={pathname === '/views/models' ? styles.active : ''}
                    >
                        模型管理
                    </Link>
                </li>
                <li>
                    <Link
                        href="/views/ai"
                        className={pathname === '/views/ai' ? styles.active : ''}
                    >
                        AI助手
                    </Link>
                </li>
                <li>
                    <Link
                        href="/views/onnx-chat"
                        className={pathname === '/views/onnx-chat' ? styles.active : ''}
                    >
                        ONNX聊天
                    </Link>
                </li>
                <li>
                    <Link
                        href="/views/transformers-chat"
                        className={pathname === '/views/transformers-chat' ? styles.active : ''}
                    >
                        Transformers聊天
                    </Link>
                </li>
            </ul>
        </nav>
    );
}