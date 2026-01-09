#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 最後的修正
last_fixes = {
    '学習': '學習',
    '类似': '類似',
    '類別似': '類似',  # 修正過度轉換的問題
    '分页': '分頁',
    '激活': '啟動',
    '推导式': '推導式',
    '单条': '單一條',
    '单条記錄': '單一筆記錄',
    '导入': '匯入',
    '导出': '匯出',
    '学习': '學習',
    '习': '習',
    '类': '類',
    '似': '似',
    '页': '頁',
    '单': '單',
    '条': '條',
    '动': '動',
    '态': '態',
    '静': '靜',
    '态': '態',
    '组': '組',
    '织': '織',
    '协': '協',
    '议': '議',
    '范': '範',
    '围': '圍',
    '档': '檔',
    '案': '案',
}

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 先修正過度轉換的問題
    content = content.replace('類別似', '類似')
    
    # 然後修正剩餘的簡體字
    for simp, trad in last_fixes.items():
        content = content.replace(simp, trad)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ 已修正: {filename}")

if __name__ == '__main__':
    files = [
        '01-django-basics-for-nodejs-developers.md',
        '02-project-structure-and-planning.md',
        '03-api-implementation-guide.md',
    ]
    
    for f in files:
        fix_file(f)
    
    print("\n✅ 最後的簡體字已全部修正！")
