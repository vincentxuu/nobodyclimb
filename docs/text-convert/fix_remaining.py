#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 需要修正的簡體字對應
fixes = {
    '进入': '進入',
    '预加载': '預載入',
    '适合': '適合',
    '社交链接': '社交連結',
    '标题': '標題',
    '设施': '設施',
    '评分': '評分',
    '圖片链接': '圖片連結',
    '查詢词': '查詢詞',
    '过期': '過期',
    '体验': '體驗',
    '可读': '可讀',
    '标题包含': '標題包含',
    '初体验': '初體驗',
    '尝试': '嘗試',
    '方括号': '方括號',
    '布尔值': '布林值',
}

def fix_file(filename):
    """修正文件中的簡體字"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修正
    for simp, trad in fixes.items():
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
    
    print("\n✓ 所有簡體字已修正完成！")
