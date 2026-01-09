# 文件風格指南 (Documentation Style Guide)

**Feature**: Django REST Framework Backend Documentation
**Last Updated**: 2025-10-13
**Purpose**: 確保所有後端文件保持一致性和高品質

---

## 目標讀者 (Target Audience)

**Primary**: Node.js 開發者，零 Python/Django 經驗
**Secondary**: 有 Express.js 經驗的全端開發者

所有文件應該：

- 假設讀者熟悉 Node.js/Express
- 不假設讀者了解 Python 或 Django
- 提供 Node.js 等價概念的對比

---

## 文件語言 (Documentation Language)

### 主要語言

**中文（繁體）** 作為主要說明語言，遵循以下規則：

1. **技術術語保持英文**

   ```markdown
   ✅ 正確: 使用 Django ORM 查詢資料
   ❌ 錯誤: 使用 Django 物件關聯映射查詢資料
   ```

2. **第一次提及時添加中文註釋**

   ```markdown
   ✅ 正確: Serializer (序列化器) 用於資料驗證
   ❌ 錯誤: 序列化器用於資料驗證
   ```

3. **程式碼範例使用英文註釋**

   ```python
   # Good: English code comments
   def get_user(user_id):
       """Retrieve user by ID"""  # ✅
       return User.objects.get(id=user_id)

   # Bad: Chinese code comments
   def get_user(user_id):
       """根據 ID 獲取使用者"""  # ❌
       return User.objects.get(id=user_id)
   ```

4. **保留的英文技術術語清單**
   - Django, DRF (Django REST Framework)
   - Model, View, Serializer, ViewSet
   - JWT, API, REST, CRUD
   - HTTP, URL, JSON
   - Git, GitHub, CLI
   - PostgreSQL, SQL
   - Deploy, Production, Staging

---

## 文件結構 (Document Structure)

### 檔案命名規範

```
01-topic-name.md          # 使用數字前綴表示閱讀順序
02-next-topic.md          # 使用連字符分隔單字
UPPERCASE_GUIDE.md        # 特殊文件使用大寫
README.md                 # 索引檔案
```

### 標準文件範本

```markdown
# 文件標題

> 簡短描述（一句話說明文件目的）

## 目錄

- [Section 1](#section-1)
- [Section 2](#section-2)

---

## Section 1

內容...

---

## 下一步

繼續閱讀：
1. [下一個主題](./next-topic.md)
2. [相關主題](./related-topic.md)
```

### 必需的 Frontmatter

每個主要文件應包含：

```markdown
# 標題

**Feature**: Django REST Framework Backend API
**Date**: YYYY-MM-DD
**Status**: [Draft | In Progress | Complete]
**Target Audience**: Node.js developers
```

---

## Node.js 對比格式 (Node.js Comparison Format)

### 對比表格格式

使用三欄表格進行對比：

```markdown
| Node.js/Express | Django | 說明 |
|----------------|--------|------|
| package.json | requirements.txt | 依賴管理 |
| npm install | pip install | 安裝依賴 |
| app.get() | @api_view(['GET']) | 路由定義 |
```

### 程式碼對比格式

使用側邊對比（Side-by-Side）：

````markdown
**Node.js/Express**:
```javascript
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});
```

**Django REST Framework**:
```python
@api_view(['GET'])
def user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
```
````

### 概念映射格式

使用箭頭表示等價概念：

```markdown
**Node.js Equivalent**:
- Express middleware → Django middleware
- Route handler → Django view
- Sequelize model → Django model
- Zod/Joi validator → DRF serializer
```

---

## 程式碼範例規範 (Code Example Standards)

### Python 程式碼風格

遵循 [PEP 8](https://pep8.org/) 規範：

```python
# ✅ Good: Clear, well-commented Python
class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'display_name']
        read_only_fields = ['id', 'created_at']

    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
```

### JavaScript/TypeScript 程式碼風格

使用現代 ES6+ 語法：

```javascript
// ✅ Good: Modern JavaScript with async/await
const getUserPosts = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/posts`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    throw error;
  }
};
```

### 命令範例格式

```bash
# 使用註釋說明命令用途
python manage.py makemigrations  # Create migrations

# 顯示預期輸出
# Migrations for 'users':
#   users/migrations/0001_initial.py
#     - Create model User
```

### 完整範例 vs 程式碼片段

**完整範例** - 可直接複製執行：

````markdown
**完整範例**:
```python
# users/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
```
````

**程式碼片段** - 顯示局部修改：

````markdown
**在 settings.py 中添加**:
```python
INSTALLED_APPS = [
    # ... existing apps
    'rest_framework',  # Add this line
    'corsheaders',     # Add this line
]
```
````

---

## 格式化約定 (Formatting Conventions)

### 強調和標記

```markdown
- **粗體**: 重要概念、技術術語首次出現
- `程式碼`: 程式碼片段、命令、檔案名稱、變數名稱
- *斜體*: 次要強調、引用
- > 引用: 重要提示、警告訊息
```

### 列表格式

**有序列表** - 步驟、優先順序：

```markdown
1. 第一步
2. 第二步
3. 第三步
```

**無序列表** - 特性、要點：

```markdown
- 特性 A
- 特性 B
- 特性 C
```

**任務列表** - 檢查清單：

```markdown
- [x] 已完成任務
- [ ] 待完成任務
```

### 連結格式

```markdown
- 內部連結: [標題](./relative-path.md)
- 外部連結: [Django Docs](https://docs.djangoproject.com/)
- 錨點連結: [跳轉到章節](#section-name)
```

---

## 特殊區塊 (Special Sections)

### 提示區塊

```markdown
> **💡 提示**: 這是一個有用的技巧

> **⚠️ 警告**: 注意這個潛在問題

> **🔥 重要**: 關鍵訊息不要遺漏

> **🎯 目標**: 這一節的學習目標
```

### Node.js 對比區塊

````markdown
**Node.js 對照：**
```javascript
// Express
app.use(express.json());
```

**等價的 Django 設定：**
```python
# Django handles JSON parsing automatically
# No additional configuration needed
```
````

### 故障排除區塊

```markdown
### 常見問題排查

#### 問題 1: Module not found

**症狀**: `ModuleNotFoundError: No module named 'rest_framework'`

**解決方案**:
```bash
# 確認虛擬環境已啟動
source venv/bin/activate

# 重新安裝依賴
pip install -r requirements.txt
```

```

---

## 圖表和視覺化 (Diagrams and Visualization)

### 使用 ASCII 圖表

```markdown
## 專案結構

```

nobodyclimb-backend/
├── manage.py           # CLI tool
├── config/             # Settings
│   ├── settings.py
│   └── urls.py
└── apps/               # Feature modules
    ├── users/
    └── posts/

```
```

### 使用表格對比

```markdown
| 功能 | Node.js | Django | 推薦 |
|-----|---------|--------|------|
| ORM | TypeORM | Django ORM | Django ORM |
| 驗證 | Zod | Serializers | Serializers |
```

### 流程圖（簡化）

```markdown
## JWT 認證流程

```

1. User Login
   ↓
2. Server generates JWT
   ↓
3. Client stores token
   ↓
4. Client includes token in requests
   ↓
5. Server validates token

```
```

---

## 文件組織 (Documentation Organization)

### 文件層次結構

```
docs/backend/
├── README.md                              # 索引和導航
├── STYLE_GUIDE.md                         # 本文件
├── 01-django-basics-for-nodejs-developers.md
├── 02-project-structure-and-planning.md
├── 03-api-implementation-guide.md
├── 04-deployment-guide.md
├── 05-testing-guide.md                    # 待建立
├── 06-frontend-integration.md             # 待建立
└── quick-reference.md                     # 快速參考
```

### 交叉引用規則

```markdown
# ✅ 正確: 使用相對路徑
查看 [Django 基礎](./01-django-basics-for-nodejs-developers.md) 了解更多

# ✅ 正確: 引用規範文件
完整的資料模型定義見 [data-model.md](../../specs/001-django-rest-framework/data-model.md)

# ❌ 錯誤: 使用絕對路徑
查看 /Users/xiaoxu/Projects/nobodyclimb-fe/docs/backend/01-...
```

### 版本控制

```markdown
# 文件更新記錄

**Version 1.0** (2025-10-11)
- 初始版本
- 包含基礎教學和 API 規劃

**Version 1.1** (2025-10-13)
- 添加部署指南
- 更新環境設定說明
```

---

## 品質檢查清單 (Quality Checklist)

在提交文件前，確保：

### 內容品質

- [ ] 目標讀者明確（Node.js 開發者）
- [ ] 所有技術概念都有 Node.js 對比
- [ ] 程式碼範例完整且可執行
- [ ] 命令範例包含預期輸出
- [ ] 專業術語在首次出現時有解釋

### 格式一致性

- [ ] 使用中文說明 + 英文技術術語
- [ ] 程式碼範例遵循風格指南
- [ ] 標題層次正確（使用 ##, ###, ####）
- [ ] 連結格式正確且有效
- [ ] 特殊符號正確使用（✅, ❌, 💡, ⚠️）

### 可用性

- [ ] 目錄清晰完整
- [ ] 章節之間有邏輯連接
- [ ] 包含「下一步」指引
- [ ] 故障排除部分完整
- [ ] 範例從簡單到複雜遞進

### Node.js 開發者友好度

- [ ] 避免 Django 行話（或提供解釋）
- [ ] 概念對比清晰準確
- [ ] 命令對照表完整
- [ ] 提供「為什麼」的解釋，不只是「如何」
- [ ] 學習曲線合理

---

## 範例：優秀 vs 不佳文件

### ✅ 優秀範例

````markdown
## 建立 Django Model

Django 的 Model 類似於 TypeORM 或 Sequelize 中的 Entity/Model 定義。

**Node.js (TypeORM)**:
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;
}
```

**Django**:
```python
from django.db import models

class User(models.Model):
    """User model - similar to TypeORM Entity"""
    username = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username
```

**Key Differences**:
- Django uses `models.CharField` instead of TypeScript decorators
- `auto_now_add=True` automatically sets timestamp (like TypeORM's `@CreateDateColumn()`)
- No explicit `@PrimaryGeneratedColumn()` needed - Django adds `id` automatically
````

### ❌ 不佳範例

````markdown
## 建立模型

建立一個模型：

```python
class User(models.Model):
    username = models.CharField(max_length=150)
```

這就是模型的定義方式。
````

**問題**:

- 沒有 Node.js 對比
- 缺少上下文說明
- 範例過於簡單
- 沒有解釋為什麼這樣做

---

## 文件審查流程 (Documentation Review Process)

### 自我審查（Self-Review）

1. **技術準確性**: 程式碼能執行嗎？命令正確嗎？
2. **目標讀者適配**: Node.js 開發者能理解嗎？
3. **完整性**: 是否遺漏重要訊息？
4. **一致性**: 與其他文件風格一致嗎？

### 同儕審查（Peer Review）

請其他 Node.js 開發者審查：

- 概念對比是否準確？
- 學習曲線是否合理？
- 是否有令人困惑的部分？

### 測試驗證（Testing）

- 讓新手按照文件操作
- 記錄他們遇到的問題
- 根據回饋改進文件

---

## 術語表 (Glossary)

### Django 術語 → Node.js 等價

| Django 術語 | Node.js 等價 | 說明 |
|-----------|------------|------|
| Project | Application | 整個應用程式 |
| App | Module/Feature | 功能模組 |
| Model | Entity/Model | 資料模型 |
| View | Route Handler | 請求處理器 |
| Serializer | Validator + Transformer | 資料驗證和序列化 |
| Migration | Migration | 資料庫遷移 |
| QuerySet | Query Builder | 查詢建構器 |
| Manager | Repository | 資料存取層 |

### 常用縮寫

- **DRF**: Django REST Framework
- **ORM**: Object-Relational Mapping
- **CRUD**: Create, Read, Update, Delete
- **JWT**: JSON Web Token
- **API**: Application Programming Interface
- **CORS**: Cross-Origin Resource Sharing

---

## 更新和維護 (Updates and Maintenance)

### 何時更新文件

- Django/DRF 版本更新時
- 發現技術錯誤時
- 收到使用者回饋時
- 添加新功能時
- 最佳實踐變化時

### 更新流程

1. 在文件頂部更新日期
2. 添加版本歷史記錄
3. 更新相關的交叉引用
4. 執行品質檢查清單
5. 通知文件使用者

---

## 參考資源 (Reference Resources)

### 官方文件風格指南

- [Django Documentation Style Guide](https://docs.djangoproject.com/en/dev/internals/contributing/writing-documentation/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)

### Markdown 最佳實踐

- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### 技術寫作資源

- [Technical Writing Courses](https://developers.google.com/tech-writing)
- [Docs for Developers](https://docsfordevelopers.com/)

---

## 結論

本風格指南確保所有 Django REST Framework 後端文件：

- ✅ 對 Node.js 開發者友善
- ✅ 格式一致
- ✅ 易於維護
- ✅ 專業且實用

遵循這些指南將幫助建立高品質、易於理解的技術文件，降低 Node.js 開發者學習 Django 的門檻。

---

**Questions?** 查看現有文件範例或參考官方風格指南。

**Happy Documenting!** 📝
