#!/usr/bin/env python3
# -*- coding: utf-8 -*-

more_fixes = {
    '分离': '分離',
    '独立': '獨立',
    '单独': '單獨',
    '单一': '單一',
    '简单': '簡單',
    '简化': '簡化',
    '简介': '簡介',
    '简短': '簡短',
    '简要': '簡要',
}

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for simp, trad in more_fixes.items():
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
    
    print("\n✓ 額外的簡體字已修正！")
