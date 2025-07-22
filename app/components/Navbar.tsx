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
                        href="/train"
                        className={pathname === '/train' ? styles.active : ''}
                    >
                        模型训练
                    </Link>
                </li>
                <li>
                    <Link
                        href="/models"
                        className={pathname === '/models' ? styles.active : ''}
                    >
                        模型管理
                    </Link>
                </li>
            </ul>
        </nav>
    );
}