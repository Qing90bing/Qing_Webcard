# Components (组件)

此目录存放项目中所有可复用的UI组件样式。每个文件都对应一个独立的组件，例如按钮、卡片、模态框等。这种结构使得组件的样式相互独立，便于管理和维护。

## 文件说明

-   **`buttons.css`**: 定义了项目中所有可交互按钮的样式，包括通用图标按钮、特定功能的按钮（如返回今日、刷新）等。

    -   **可自定义变量**:
        -   `--accent-color`: 按钮的主要背景色（如“返回今日”按钮）。
        -   `--accent-color-highlight`: 各种按钮在鼠标悬停（hover）时的高亮背景色。
        -   `--card-border-color`: “返回今日”按钮的边框颜色。
        -   `--text-color-primary`, `--text-color-secondary`: 控制按钮内图标或文本的颜色。

-   **`cards.css`**: 定义了信息卡片的样式。卡片是应用中的核心内容容器，用于展示天气、GitHub提交历史等信息块。

    -   **可自定义变量**:
        -   `--card-bg-color`: 卡片在启用“毛玻璃效果”时的背景色（通常是半透明的）。
        -   `--card-hover-bg-color`: 鼠标悬停在卡片上时的背景色。
        -   `--card-border-color`: 卡片的边框颜色。
        -   `--card-hover-border-color`: 鼠标悬停在卡片上时的边框颜色。
        -   `--solid-card-bg-color`: 在禁用“毛玻璃效果”时的实心背景色。
        -   `--card-border-radius` (全局): 定义卡片的圆角, 在 `base/variables.css` 中设置。
        -   `--card-backdrop-blur` (全局): 定义卡片的背景模糊强度, 在 `base/variables.css` 中设置。

-   **`forms.css`**: 包含了表单元素（如输入框 `input`、开关 `switch`、滑块 `slider`）的样式。

    -   **可自定义变量**:
        -   `--accent-color`: 各种表单控件的“激活”颜色，如输入框的聚焦边框、开关的背景、滑块的填充色等。
        -   `--accent-color-highlight`: 控件的悬停辉光效果颜色。
        -   `--text-color-tertiary`: 开关关闭时的背景色、滑块禁用时的图标颜色。
        -   `--progress-bar-bg`: 滑块轨道的背景色。

-   **`link-slider.css`**: 定义了在主内容区下方显示的链接滑块组件的样式。

    -   **自定义说明**: 该组件分页指示点（dot）的颜色在 `link-slider.css` 中为暗色主题硬编码，并在 `themes/light.css` 中为亮色主题直接覆盖。它不使用CSS变量进行主题化。

-   **`modals.css`**: 提供了模态框（弹出对话框）的样式，用于显示设置菜单、时间胶囊等内容。

    -   **自定义说明**: 模态框窗口本身是一个 `.glass-card`，因此它的外观（背景色、边框、圆角等）由 `cards.css` 中定义的变量控制。此文件主要控制模态框的进入/退出动画和遮罩层行为，没有引入新的可自定义颜色变量。

-   **`music-player.css`**: 包含了迷你音乐播放器组件的所有样式。

    -   **自定义说明**: 这是一个高度定制化的组件，其颜色（如唱片底色、遮罩层颜色）目前是硬编码在 `music-player.css` 文件中的，不响应主题切换。如果需要自定义，请直接修改该文件中的颜色值。

-   **`progress-bar.css`**: 定义了进度条组件的样式，用于显示加载进度或数据统计。

    -   **可自定义变量**:
        -   `--progress-bar-bg`: 进度条轨道的背景颜色。
        -   `--accent-color`: 进度条填充部分的颜色。
        -   `--text-color-primary`: 进度条上文本的颜色。

-   **`scrollbar.css`**: 提供了自定义的滚动条样式，以美化页面滚动条的外观，使其与应用主题保持一致。

    -   **可自定义变量**:
        -   `--accent-color`: 滚动条滑块的颜色。
        -   `--accent-color-highlight`: 鼠标悬停在滚动条滑块上时的颜色。

-   **`tooltip.css`**: 定义了鼠标悬停时出现的提示框（Tooltip）的样式。

    -   **可自定义变量**:
        -   `--accent-color`: 工具提示的背景颜色。
