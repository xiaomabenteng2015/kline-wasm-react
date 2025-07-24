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
                AI模型加载测试
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
                        href="/views/kline-system"
                        className={pathname === '/views/kline-system' ? styles.active : ''}
                    >
                        K线推理模型
                    </Link>
                </li>
                <li>
                    <Link
                        href="/views/ai"
                        className={pathname === '/views/ai' ? styles.active : ''}
                    >
                        WebLLM 聊天
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