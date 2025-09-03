# 资源文件夹：`icons`

本文件夹用于存放项目的所有图标文件。这些图标是项目视觉识别系统的核心部分，用于浏览器标签页、快捷方式以及页面内部的Logo展示。

## 文件说明

### `favicon.svg`

- **用途**: 这是项目当前使用的主要图标。它是一个 SVG (可缩放矢量图形) 文件，具有在任何分辨率下都能清晰显示的优点。
- **当前作用**:
    1.  **网站 Favicon**: 作为显示在浏览器标签页上的小图标。
    2.  **页面 Logo**: 在“关于”卡片中作为网站的 Logo 展示。

## 如何使用和修改

### 1. 引用位置

此图标在根目录的 `index.html` 文件中被引用。具体位置如下：

**作为 Favicon (在 `<head>` 标签内):**
```html
<head>
    ...
    <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
    ...
</head>
```

**作为“关于”页面的 Logo (在 `<body>` 标签内):**
```html
...
<div id="about-card" class="lg:col-span-3 glass-card p-5 hidden flex flex-col">
    ...
    <img id="about-card-logo" src="assets/icons/favicon.svg" alt="Website Icon" class="w-24 h-24 cursor-pointer">
    ...
</div>
...
```

### 2. 修改指南

你可以将 `favicon.svg` 替换为你自己的图标。推荐使用 SVG 格式以获得最佳显示效果，但标准的图像格式（如 `.png`, `.ico`）也可以使用。

#### 方案 A：替换同名文件 (最简单)

1.  准备好你的新图标文件。
2.  将其命名为 `favicon.svg`。
3.  用你的新文件覆盖掉 `assets/icons/` 目录下的同名文件。

这样操作无需修改任何代码。

#### 方案 B：使用不同文件名

如果你想使用不同的文件名（例如 `my-logo.png`），请按以下步骤操作：

1.  将你的新图标文件（例如 `my-logo.png`）放入 `assets/icons/` 文件夹。
2.  打开 `index.html` 文件。
3.  **更新 Favicon 路径**:
    -   找到 `<link rel="icon" ...>` 这一行。
    -   修改 `href` 属性为你新文件的路径。
    -   如果不是 SVG 文件，建议同时修改 `type` 属性（例如，PNG 文件对应 `image/png`）。

    ```html
    <!-- 修改前 -->
    <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">

    <!-- 修改后 (示例) -->
    <link rel="icon" type="image/png" href="assets/icons/my-logo.png">
    ```

4.  **更新“关于”页面 Logo 路径**:
    -   找到 `id="about-card-logo"` 的 `<img>` 标签。
    -   修改 `src` 属性为你新文件的路径。

    ```html
    <!-- 修改前 -->
    <img id="about-card-logo" src="assets/icons/favicon.svg" ...>

    <!-- 修改后 (示例) -->
    <img id="about-card-logo" src="assets/icons/my-logo.png" ...>
    ```

5.  保存 `index.html` 文件后，更改即可生效。
