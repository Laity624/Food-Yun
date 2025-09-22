# 菜谱云函数 - 家庭版

本云函数已更新为支持家庭版菜谱分类系统，包含场景分类、食材分类和可选标签功能。

## 🔄 更新内容

### 数据结构变更
- **菜谱名称**: `title` → `name`
- **场景分类**: 新增 `sceneCategory` (必填)
- **食材分类**: 新增 `ingredientCategory` (必填)
- **可选标签**: `tags` → `optionalTags`
- **制作信息**: `cookTime/difficulty/serving` → `preparationTime/difficulty/servingSize`

### 新增功能
- 场景分类筛选 (日常家常菜、快手菜、宴客菜、清淡菜、重口味菜)
- 食材分类筛选 (肉类、水产、蛋类、蔬菜、汤类、主食)
- 可选标签筛选 (烹饪方式、口味特色)
- 数据验证增强
- 新增 `getById` 接口用于编辑模式

## 📋 API 接口

### 1. 创建菜谱 (create)
```javascript
{
  action: 'create',
  data: {
    name: '菜谱名称',                    // 必填
    description: '菜谱描述',             // 可选
    images: ['图片URL'],                // 可选
    sceneCategory: 'daily',            // 必填：场景分类ID
    ingredientCategory: 'meat',        // 必填：食材分类ID  
    preparationTime: { value: '30', label: '30分钟' },
    difficulty: { value: 1, label: '简单', color: 'green' },
    servingSize: { value: '3-4', label: '3-4人' },
    optionalTags: ['stir_fry', 'sichuan'], // 可选标签ID数组
    ingredients: [                     // 必填：食材清单
      { id: 'ing_1', name: '食材名', amount: '用量' }
    ],
    steps: [                          // 必填：制作步骤
      { id: 'step_1', content: '步骤描述', image: '图片URL' }
    ],
    isPublic: true,                   // 是否公开
    status: 'published'               // 状态：draft/published
  }
}
```

### 2. 获取菜谱列表 (list)
```javascript
{
  action: 'list',
  page: 1,                           // 页码
  pageSize: 10,                      // 每页数量
  search: '搜索关键词',                // 可选：搜索菜谱名称和描述
  sceneCategories: ['daily', 'quick'], // 可选：场景分类筛选
  ingredientCategories: ['meat'],     // 可选：食材分类筛选
  optionalTags: ['stir_fry'],        // 可选：可选标签筛选
  creatorId: 'openid'                // 可选：指定创建者
}
```

### 3. 获取菜谱详情 (detail)
```javascript
{
  action: 'detail',
  recipeId: '菜谱ID'
}
```

### 4. 根据ID获取菜谱 (getById) - 用于编辑
```javascript
{
  action: 'getById',
  recipeId: '菜谱ID'
}
```

### 5. 更新菜谱 (update)
```javascript
{
  action: 'update',
  recipeId: '菜谱ID',
  data: {
    // 同创建菜谱的数据结构
  }
}
```

### 6. 删除菜谱 (delete)
```javascript
{
  action: 'delete',
  recipeId: '菜谱ID'
}
```

## 🏷️ 分类系统

### 场景分类 (必选)
- `daily`: 日常家常菜
- `quick`: 快手菜  
- `guest`: 宴客菜
- `light`: 清淡菜
- `heavy`: 重口味菜

### 食材分类 (必选)
- `meat`: 肉类
- `seafood`: 水产
- `egg`: 蛋类
- `vegetable`: 蔬菜
- `soup`: 汤类
- `staple`: 主食

### 可选标签
**烹饪方式:**
- `stir_fry`: 炒菜
- `steam`: 蒸菜
- `stew`: 炖菜
- `cold_mix`: 凉拌
- `soup`: 汤品
- `fry`: 油炸
- `grill`: 烧烤
- `boil`: 水煮

**口味特色:**
- `sichuan`: 川菜
- `cantonese`: 粤菜
- `home_style`: 家常味
- `light`: 清淡
- `spicy`: 麻辣
- `sweet`: 甜味
- `sour`: 酸味
- `fresh`: 鲜香

## 🚀 部署步骤

1. 在微信开发者工具中打开项目
2. 右键点击 `cloudfunctions/recipe` 文件夹
3. 选择"创建并部署：云端安装依赖"
4. 等待部署完成

## 📊 数据库优化

建议在云开发控制台为 `recipes` 集合添加以下索引：

```json
// 基础查询索引
{ "isPublic": 1, "createdAt": -1 }

// 场景分类索引
{ "sceneCategory": 1, "isPublic": 1, "createdAt": -1 }

// 食材分类索引  
{ "ingredientCategory": 1, "isPublic": 1, "createdAt": -1 }

// 可选标签索引
{ "optionalTags": 1, "isPublic": 1, "createdAt": -1 }

// 创建者索引
{ "creatorId": 1, "createdAt": -1 }
```

## ⚠️ 注意事项

1. **数据迁移**: 如果已有旧数据，需要进行数据迁移以适配新结构
2. **权限控制**: 确保数据库安全规则正确配置
3. **索引优化**: 根据实际查询需求添加数据库索引
4. **测试验证**: 部署后建议进行完整的功能测试

## 🧪 测试

运行测试文件验证功能：
```bash
node test.js
```