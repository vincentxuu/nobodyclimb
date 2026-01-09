#!/usr/bin/env python3
# -*- coding: utf-8 -*-

additional_fixes = {
    '浮点数': '浮點數',
    '整数': '整數',
    '标准库': '標準函式庫',
    '第三方库': '第三方函式庫',
    '相对': '相對',
    '长文本': '長文字',
    '营业': '營業',
    '电话': '電話',
    '统计': '統計',
    '按讚数': '按讚數',
    '封面图': '封面圖',
    '读取': '讀取',
    '允许': '允許',
    '虚拟': '虛擬',
    '隔离': '隔離',
    '初学者': '初學者',
    '社区': '社群',
    '官方檔案': '官方文件',
}

def fix_file(filename):
    """修正文件中的簡體字"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修正
    for simp, trad in additional_fixes.items():
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
    
    print("\n✓ 所有額外的簡體字已修正完成！")
