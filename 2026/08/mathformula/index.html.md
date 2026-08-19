---
layout: post
title: MathFormula
date: 2026-08-19 13:54 +0000
categories: [Test]
tags: [math, test]
math: true
---

本文用于测试 MathJax 3.2.2 的公式渲染，写法遵循官方 Chirpy 主题规范：块级公式用 `$$...$$`，行内公式用 `$...$`（**不要**用 ```math 围栏，kramdown GFM 会把它当代码块渲染）。

## 1. 行内公式

当 $a \ne 0$ 时，方程 $ax^2 + bx + c = 0$ 有两个解，这是爱因斯坦的质能方程 $E = mc^2$，以及欧拉公式 $e^{i\pi} + 1 = 0$。

## 2. 块级公式（基础）

$$
x = {-b \pm \sqrt{b^2-4ac} \over 2a}
$$

$$
\sum_{n=1}^\infty \frac{1}{n^2} = \frac{\pi^2}{6}
$$

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

## 3. 编号公式与引用（equation + label）

$$
\begin{equation}
  \nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}
  \label{eq:gauss}
\end{equation}
$$

高斯定理如公式 $\eqref{eq:gauss}$ 所示，其中 $\rho$ 是电荷密度。

$$
\begin{equation}
  \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
  \label{eq:ampere}
\end{equation}
$$

安培-麦克斯韦定律见公式 $\eqref{eq:ampere}$，两个公式 $\eqref{eq:gauss}$ 和 $\eqref{eq:ampere}$ 同属麦克斯韦方程组。

## 4. 多行对齐（align）

$$
\begin{align}
  f(x) &= (x + 1)^2 \\
       &= x^2 + 2x + 1 \\
       &= x^2 + 2x + 2 - 1
\end{align}
$$

$$
\begin{align}
  \frac{\partial u}{\partial t} &= \alpha \frac{\partial^2 u}{\partial x^2} \\
  \frac{\partial u}{\partial t} + u \frac{\partial u}{\partial x} &= 0
\end{align}
$$

## 5. 矩阵

$$
\begin{pmatrix}
  a & b \\
  c & d
\end{pmatrix}
\begin{pmatrix}
  x \\
  y
\end{pmatrix}
=
\begin{pmatrix}
  ax + by \\
  cx + dy
\end{pmatrix}
$$

$$
A =
\begin{bmatrix}
  1 & 2 & 3 \\
  4 & 5 & 6 \\
  7 & 8 & 9
\end{bmatrix},
\quad
\det(A) = 0
$$

## 6. 分数、上下标、希腊字母

$$
\frac{\partial^2 \varphi}{\partial x^2} + \frac{\partial^2 \varphi}{\partial y^2} = 0
$$

希腊字母表：$\alpha, \beta, \gamma, \delta, \varepsilon, \zeta, \eta, \theta, \lambda, \mu, \nu, \pi, \rho, \sigma, \tau, \phi, \omega, \Gamma, \Delta, \Theta, \Lambda, \Sigma, \Omega$

## 7. 求和、积分、极限

$$
\lim_{n \to \infty} \left( 1 + \frac{1}{n} \right)^n = e
$$

$$
\oiint_S \mathbf{F} \cdot d\mathbf{S} = \iiint_V \nabla \cdot \mathbf{F} \, dV
$$

$$
\sum_{k=0}^{n} \binom{n}{k} x^k y^{n-k} = (x + y)^n
$$

## 8. 特殊运算符

$$
a \approx b, \quad a \ne b, \quad a \times b, \quad a \div b, \quad a \pm b, \quad a \le b, \quad a \ge b, \quad a \in S, \quad A \subset B, \quad A \cap B, \quad A \cup B
$$

$$
\forall \varepsilon > 0, \exists \delta > 0, \text{使得} |x - x_0| < \delta \Rightarrow |f(x) - f(x_0)| < \varepsilon
$$

## 9. 长公式（测试横向滚动）

$$
P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}, \quad k = 0, 1, 2, \ldots, \quad E(X) = \operatorname{Var}(X) = \lambda, \quad \hat{\theta}_{MLE} = \arg\max_{\theta} \prod_{i=1}^{n} f(x_i; \theta)
$$

## 10. 代码块中的美元符号（应保持原样，不被渲染）

```php
<?php
$price = 100;
$total = $price * 1.2;
echo "Total: $total";
?>
```

```javascript
const price = 5;
console.log(`Cost: ${price * 3} dollars`);
```

代码块里的 `$price` 和 `${price}` 都不应触发公式渲染。

## 11. 混合排版测试

傅里叶变换 $F(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} \, dt$ 是信号处理的核心工具，其逆变换为：

$$
f(t) = \frac{1}{2\pi} \int_{-\infty}^{\infty} F(\omega) e^{i\omega t} \, d\omega
$$

GPU 对齐计算（呼应之前的文章）：

$$
\text{offset} = \frac{\text{size} + \text{alignment} - 1}{\text{alignment}} \times \text{alignment} = \left\lceil \frac{\text{size}}{\text{alignment}} \right\rceil \times \text{alignment}
$$

## 12. 进阶公式综合测试

### 12.1 分段函数与矩阵变体（cases / vmatrix）

$$
f(x) =
\begin{cases}
  x^2, & x \ge 0 \\
  -x^2, & x < 0
\end{cases}
$$

$$
\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc, \quad \begin{Vmatrix} 1 \\ 2 \end{Vmatrix} = \sqrt{5}
$$

### 12.2 装饰结构（boxed / overbrace / underbrace / xrightarrow / substack / cancel）

$$
\boxed{E = mc^2}
$$

$$
\underbrace{(a + b + \cdots + z)}_{26\ \text{项}}, \quad \overbrace{a + a + \cdots + a}^{n\ \text{项}}
$$

$$
A \xrightarrow{\text{旋转}} B \qquad A \xleftarrow{\text{逆旋转}} A
$$

$$
\sum_{\substack{0 \le i \le n \\ 0 \le j \le i}} a_{ij} = \sum_{i=0}^{n} \sum_{j=0}^{i} a_{ij}
$$

$$
\frac{a}{\cancel{b}} \cdot \cancel{b} = a
$$

### 12.3 级数展开

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$

$$
f(x) = \frac{a_0}{2} + \sum_{n=1}^{\infty} \left( a_n \cos\frac{n\pi x}{L} + b_n \sin\frac{n\pi x}{L} \right)
$$

### 12.4 概率与统计

$$
P(A \mid B) = \frac{P(B \mid A) \, P(A)}{P(B)}
$$

$$
p(x) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\left( -\frac{(x-\mu)^2}{2\sigma^2} \right)
$$

$$
\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i, \quad s^2 = \frac{1}{n-1}\sum_{i=1}^{n} (x_i - \bar{x})^2
$$

### 12.5 矢量分析（梯度 / 散度 / 旋度）

$$
\nabla f = \frac{\partial f}{\partial x}\mathbf{i} + \frac{\partial f}{\partial y}\mathbf{j} + \frac{\partial f}{\partial z}\mathbf{k}
$$

$$
\nabla \cdot \mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y} + \frac{\partial F_z}{\partial z}
$$

$$
\nabla \times \mathbf{F} = \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ \dfrac{\partial}{\partial x} & \dfrac{\partial}{\partial y} & \dfrac{\partial}{\partial z} \\ F_x & F_y & F_z \end{vmatrix}
$$

### 12.6 物理经典方程

麦克斯韦方程组（微分形式）：

$$
\begin{align}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{align}
$$

薛定谔方程：

$$
i\hbar \frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \left( -\frac{\hbar^2}{2m}\nabla^2 + V(\mathbf{r}) \right) \Psi(\mathbf{r},t)
$$

欧拉-拉格朗日方程：

$$
\frac{\partial L}{\partial q} - \frac{d}{dt}\frac{\partial L}{\partial \dot{q}} = 0
$$

### 12.7 线性代数

$$
\mathbf{A}\mathbf{v} = \lambda \mathbf{v}, \quad \mathbf{A} = \mathbf{P}\mathbf{D}\mathbf{P}^{-1}, \quad \mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\mathsf{T}}
$$

$$
\operatorname{tr}(\mathbf{A}) = \sum_{i=1}^{n} a_{ii}, \quad \operatorname{rank}(\mathbf{A}\mathbf{B}) \le \min\{\operatorname{rank}(\mathbf{A}), \operatorname{rank}(\mathbf{B})\}
$$

### 12.8 机器学习常用公式

$$
\text{softmax}(z_i) = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}, \quad \mathcal{L} = -\sum_{i=1}^{C} y_i \log \hat{y}_i
$$

$$
\text{Attention}(Q, K, V) = \text{softmax}\left( \frac{QK^{\mathsf{T}}}{\sqrt{d_k}} \right) V
$$

$$
\nabla_{\theta} J(\theta) = \mathbb{E}_{\pi_{\theta}} \left[ \sum_{t=0}^{T} \nabla_{\theta} \log \pi_{\theta}(a_t \mid s_t) \, G_t \right]
$$

### 12.9 公式内中文（\text 测试）

$$
\text{速度} = \frac{\text{路程}}{\text{时间}}, \quad \text{压强} = \frac{F}{S}
$$

## 13. 数学符号读音速查表

> 整理自《数学符号读音速查表》，共 11 大类。表格中第三列给出对应的 LaTeX 命令。

### 13.1 基础运算符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $+$ | `+` | 加号 | 加 / jiā | 加法，$2 + 3 = 5$ |
| $-$ | `-` | 减号 | 减 / jiǎn | 减法，$5 - 2 = 3$ |
| $\times$ | `\times` | 乘号 | 乘 / chéng | 乘法，$2 \times 3 = 6$ |
| $\cdot$ | `\cdot` | 点乘号 | 点乘 | 数乘，$a \cdot b$ |
| $\div$ | `\div` | 除号 | 除以 / chú yǐ | 除法，$6 \div 2 = 3$ |
| $\pm$ | `\pm` | 正负号 | 正负 / zhèng fù | 正或负，$\pm 3$ |
| $\mp$ | `\mp` | 负正号 | 负正 / fù zhèng | 与 $\pm$ 相反 |
| $=$ | `=` | 等号 | 等于 / děng yú | $a = b$ |
| $\ne$ | `\ne` | 不等号 | 不等于 | $a \ne b$ |
| $\approx$ | `\approx` | 约等号 | 约等于 | $\pi \approx 3.14$ |
| $\equiv$ | `\equiv` | 恒等号 | 恒等于 | $a \equiv a$ |
| $\propto$ | `\propto` | 正比号 | 正比于 | $y \propto x$ |
| $:$ | `:` | 比号 | 比 / bǐ | 比例，$3 : 5$ |

### 13.2 比较与大小关系

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $>$ | `>` | 大于号 | 大于 / dà yú | $5 > 3$ |
| $<$ | `<` | 小于号 | 小于 / xiǎo yú | $3 < 5$ |
| $\ge$ | `\ge` | 大于等于 | 大于等于 | 不小于，$a \ge b$ |
| $\le$ | `\le` | 小于等于 | 小于等于 | 不大于，$a \le b$ |
| $\gg$ | `\gg` | 远大于 | 远大于 / yuǎn dà yú | 左边远大于右边 |
| $\ll$ | `\ll` | 远小于 | 远小于 / yuǎn xiǎo yú | 左边远小于右边 |
| $\nless$ | `\nless` | 不小于 | 不小于 | 同 $\ge$ |
| $\ngtr$ | `\ngtr` | 不大于 | 不大于 | 同 $\le$ |

### 13.3 指数 · 根号 · 对数

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $a^2$ | `a^2` | 平方 | a 的平方 | $a$ 的二次方 |
| $a^3$ | `a^3` | 立方 | a 的立方 | $a$ 的三次方 |
| $a^n$ | `a^n` | n 次方 | a 的 n 次方 | $a$ 的 n 次幂 |
| $\sqrt{a}$ | `\sqrt{a}` | 平方根 | 根号 / gēn hào | $\sqrt{4} = 2$ |
| $\sqrt[3]{a}$ | `\sqrt[3]{a}` | 立方根 | 三次根号 | $\sqrt[3]{8} = 2$ |
| $\sqrt[n]{a}$ | `\sqrt[n]{a}` | n 次根 | n 次根号 | $n$ 次方根 |
| $\log_a b$ | `\log_a b` | 对数 | 以 a 为底 b 的对数 | $\log_{10} 100 = 2$ |
| $\ln x$ | `\ln x` | 自然对数 | 自然对数 | 以 $e$ 为底 |
| $\lg x$ | `\lg x` | 常用对数 | 常用对数 | 以 10 为底 |
| $\mathrm{e}$ | `e` | 自然常数 | e | $\mathrm{e} \approx 2.718$ |
| $n!$ | `n!` | 阶乘 | n 的阶乘 | $3! = 6$ |
| $\vert x \vert$ | `\vert x \vert` | 绝对值 | 绝对值 | $\vert -3 \vert = 3$ |

### 13.4 集合符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $\in$ | `\in` | 属于 | 属于 / shǔ yú | $x \in A$ |
| $\notin$ | `\notin` | 不属于 | 不属于 | 元素不属于集合 |
| $\subseteq$ | `\subseteq` | 子集 | 包含于 | $A$ 是 $B$ 的子集 |
| $\subset$ | `\subset` | 真子集 | 真包含于 | $A$ 是 $B$ 的真子集 |
| $\supseteq$ | `\supseteq` | 包含 | 包含 / bāo hán | $B$ 包含 $A$ |
| $\cup$ | `\cup` | 并集 | 并 / bìng | $A \cup B$，取所有元素 |
| $\cap$ | `\cap` | 交集 | 交 / jiāo | $A \cap B$，取公共元素 |
| $\emptyset$ | `\emptyset` | 空集 | 空集 / kōng jí | 不含任何元素 |
| $\complement$ | `\complement` | 补集 | 补集 / bǔ jí | 全集中的补集 |
| $\forall$ | `\forall` | 任意 | 任意 / rèn yì | 对所有元素成立 |
| $\exists$ | `\exists` | 存在 | 存在 / cún zài | 至少存在一个 |
| $\nexists$ | `\nexists` | 不存在 | 不存在 | 不存在满足条件的元素 |
| $\mathbb{N}$ | `\mathbb{N}` | 自然数集 | 自然数集 | $\{0, 1, 2, \ldots\}$ |
| $\mathbb{Z}$ | `\mathbb{Z}` | 整数集 | 整数集 | $\{\ldots, -1, 0, 1, \ldots\}$ |
| $\mathbb{Q}$ | `\mathbb{Q}` | 有理数集 | 有理数集 | 所有分数 $p/q$ |
| $\mathbb{R}$ | `\mathbb{R}` | 实数集 | 实数集 | 所有实数 |
| $\mathbb{C}$ | `\mathbb{C}` | 复数集 | 复数集 | $a + bi$ |

### 13.5 微积分符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $\sum$ | `\sum` | 求和 | 西格玛 / xī gé mǎ | $\sum_i x_i$ |
| $\prod$ | `\prod` | 求积 | 派（连乘） | 连乘符号 |
| $\int$ | `\int` | 积分 | 积分 / jī fēn | 定积分或不定积分 |
| $\iint$ | `\iint` | 二重积分 | 二重积分 | 二维积分 |
| $\oint$ | `\oint` | 环路积分 | 环路积分 | 沿闭合路径积分 |
| $\frac{df}{dx}$ | `\frac{df}{dx}` | 导数 | df 比 dx / 对 x 求导 | $f$ 对 $x$ 求导 |
| $\partial$ | `\partial` | 偏导数 | 偏 / piān | $\partial f / \partial x$ |
| $\nabla$ | `\nabla` | 梯度算子 | 纳布拉 / nà bù lā | nabla / del |
| $\Delta$ | `\Delta` | 差分 / 增量 | 德尔塔 / dé ěr tǎ | 变化量，$\Delta x$ |
| $\lim$ | `\lim` | 极限 | 极限 / jí xiàn | $\lim_{x \to 0} f(x)$ |
| $\to$ | `\to` | 趋于 | 趋于 / qū yú | $x \to 0$ |
| $\infty$ | `\infty` | 无穷大 | 无穷大 / wú qióng dà | $x \to \infty$ |
| $o(x)$ | `o(x)` | 高阶小量 | 小 o | 高阶无穷小 |

### 13.6 逻辑符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $\Rightarrow$ | `\Rightarrow` | 蕴含 | 推出 / tuī chū | 如果…则…，$p \Rightarrow q$ |
| $\Leftrightarrow$ | `\Leftrightarrow` | 等价 | 等价于 | 互为充要条件 |
| $\to$ | `\to` | 推导 | 推导出 | 逻辑推导 |
| $\land$ | `\land` | 与 | 与（合取） | $p \land q$ |
| $\lor$ | `\lor` | 或 | 或（析取） | $p \lor q$ |
| $\neg$ | `\neg` | 非 | 非（否定） | $\neg p$ |
| $\sim$ | `\sim` | 非 | 非 | 逻辑否定 |
| $\oplus$ | `\oplus` | 异或 | 异或 / yì huò | 异或运算 |
| $\vdash$ | `\vdash` | 可推出 | 可推出 | 语法可推导 |
| $\top$ | `\top` | 恒真 | 恒真 | 永真式 |
| $\bot$ | `\bot` | 恒假 | 恒假 | 永假式 |

### 13.7 几何符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $\angle$ | `\angle` | 角 | 角 / jiǎo | $\angle ABC$ |
| $\parallel$ | `\parallel` | 平行 | 平行于 / píng xíng yú | $AB \parallel CD$ |
| $\nparallel$ | `\nparallel` | 不平行 | 不平行 | 两线不平行 |
| $\perp$ | `\perp` | 垂直 | 垂直于 / chuí zhí yú | $AB \perp CD$ |
| $\triangle$ | `\triangle` | 三角形 | 三角形 | $\triangle ABC$ |
| $\bigcirc$ | `\bigcirc` | 圆 | 圆 / yuán | 圆 $O$ |
| $^\circ$ | `^\circ` | 度 | 度 / dù | $90^\circ$ |
| $^\prime$ | `^\prime` | 分 | 分 / fēn | $30^\circ 15^\prime$ |
| $^{\prime\prime}$ | `^{\prime\prime}` | 秒 | 秒 / miǎo | 角度秒 |
| $\cong$ | `\cong` | 全等 | 全等于 | $\triangle ABC \cong \triangle DEF$ |
| $\sim$ | `\sim` | 相似 | 相似于 | $\triangle ABC \sim \triangle DEF$ |
| $\overset{\frown}{AB}$ | `\overset{\frown}{AB}` | 弧 | 弧 / hú | 弧 $AB$ |

### 13.8 概率与统计符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $P(A)$ | `P(A)` | 概率 | 概率 / gài lǜ | 事件 $A$ 发生的概率 |
| $E(X)$ | `E(X)` | 期望 | 期望 / qī wàng | 期望值 |
| $\operatorname{Var}(X)$ | `\operatorname{Var}` | 方差 | 方差 / fāng chā | 也记作 $D(X)$ |
| $\sigma$ | `\sigma` | 标准差 | 西格玛 | 标准差 |
| $\sigma^2$ | `\sigma^2` | 方差 | 西格玛方 | 方差 |
| $\mu$ | `\mu` | 均值 | 缪 / miù | 总体均值 |
| $\bar{x}$ | `\bar{x}` | 样本均值 | x bar | 样本平均值 |
| $N(\mu, \sigma^2)$ | `N(\mu,\sigma^2)` | 正态分布 | 正态分布 | 均值 $\mu$，方差 $\sigma^2$ |
| $A \cap B$ | `\cap` | 事件交 | 交 | $A$、$B$ 同时发生 |
| $A \cup B$ | `\cup` | 事件并 | 并 | 至少一个发生 |
| $P(A \vert B)$ | `P(A \vert B)` | 条件概率 | 条件 | $B$ 条件下 $A$ 的概率 |
| $A \mathrel{\perp\mkern-6mu\perp} B$ | `\mathrel{\perp\mkern-6mu\perp}` | 独立 | 独立 / dú lì | 相互独立（kramdown GFM 会吃掉 `\!` 的反斜杠，故用 `\mkern` 写法） |

### 13.9 线性代数符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $\vert A \vert$ | `\vert A \vert` | 行列式 | A 的行列式 | 矩阵 $A$ 的行列式 |
| $\det(A)$ | `\det(A)` | 行列式 | 行列式 | 同 $\vert A \vert$ |
| $A^{\mathsf{T}}$ | `A^{\mathsf{T}}` | 转置 | A 转置 | 矩阵的转置 |
| $A^{-1}$ | `A^{-1}` | 逆矩阵 | A 逆 | 矩阵的逆 |
| $\operatorname{rank}(A)$ | `\operatorname{rank}` | 秩 | 秩 / zhì | 矩阵的秩 |
| $\operatorname{tr}(A)$ | `\operatorname{tr}` | 迹 | 迹 / jì | 对角线元素之和 |
| $\langle x, y \rangle$ | `\langle x,y \rangle` | 内积 | 内积 / nèi jī | 向量的内积 |
| $\Vert x \Vert$ | `\Vert x \Vert` | 范数 | 范数 / fàn shù | 向量的长度 |
| $\otimes$ | `\otimes` | 张量积 | 张量积 | 克罗内克积 |
| $\oplus$ | `\oplus` | 直和 | 直和 / zhí hé | 子空间的直和 |
| $I$ | `I` | 单位矩阵 | 单位矩阵 | 对角线为 1 |
| $\ker$ | `\ker` | 核 | 核 / hé | 线性映射的核空间 |

### 13.10 其他常见符号

| 符号 | LaTeX | 名称 | 中文读法 | 含义 / 示例 |
| :---: | :--- | :--- | :--- | :--- |
| $\equiv$ | `\equiv` | 同余 | 同余 / tóng yú | $a \equiv b \pmod{n}$ |
| $\bmod$ | `\bmod` | 取模 | 取模 / qǔ mó | $7 \bmod 3 = 1$ |
| $\lfloor x \rfloor$ | `\lfloor x \rfloor` | 下取整 | 下取整 | $\lfloor 3.7 \rfloor = 3$ |
| $\lceil x \rceil$ | `\lceil x \rceil` | 上取整 | 上取整 | $\lceil 3.2 \rceil = 4$ |
| $\binom{n}{k}$ | `\binom{n}{k}` | 组合数 | C n k / 组合数 | 从 $n$ 中取 $k$ |
| $\mathrm{A}_n^k$ | `\mathrm{A}_n^k` | 排列数 | A n k / 排列数 | 从 $n$ 中取 $k$ 排列 |
| $\gcd$ | `\gcd` | 最大公约数 | 最大公约数 | $\gcd(12, 8) = 4$ |
| $\operatorname{lcm}$ | `\operatorname{lcm}` | 最小公倍数 | 最小公倍数 | $\operatorname{lcm}(4, 6) = 12$ |
| $f(x)$ | `f(x)` | 函数 | f x / 函数 | $x$ 的函数 |
| $f^{-1}$ | `f^{-1}` | 反函数 | f 逆 | 反函数 |
| $\aleph_0$ | `\aleph_0` | 阿列夫零 | 阿列夫零 | 可数无穷的基数 |

### 13.11 希腊字母表（数学常用）

| 符号 | LaTeX | 名称 | 中文读法 | 常见用途 |
| :---: | :--- | :--- | :--- | :--- |
| $A \ \alpha$ | `A \alpha` | Alpha | 阿尔法 / ā ěr fǎ | 角度、系数 |
| $B \ \beta$ | `B \beta` | Beta | 贝塔 / bèi tǎ | 角度、Beta 函数 |
| $\Gamma \ \gamma$ | `\Gamma \gamma` | Gamma | 伽马 / gā mǎ | Gamma 函数、欧拉常数 |
| $\Delta \ \delta$ | `\Delta \delta` | Delta | 德尔塔 / dé ěr tǎ | 变化量、判别式 |
| $E \ \varepsilon$ | `\varepsilon` | Epsilon | 艾普西龙 / ài pǔ xī lóng | 极小量、极限 |
| $Z \ \zeta$ | `Z \zeta` | Zeta | 泽塔 / zé tǎ | 黎曼 Zeta 函数 |
| $H \ \eta$ | `H \eta` | Eta | 伊塔 / yī tǎ | 效率、粘度 |
| $\Theta \ \theta$ | `\Theta \theta` | Theta | 西塔 / xī tǎ | 角度、参数 |
| $I \ \iota$ | `I \iota` | Iota | 约塔 / yuē tǎ | 微小量 |
| $K \ \kappa$ | `K \kappa` | Kappa | 卡帕 / kǎ pà | 曲率、常数 |
| $\Lambda \ \lambda$ | `\Lambda \lambda` | Lambda | 拉姆达 / lā mǔ dá | 波长、特征值 |
| $M \ \mu$ | `M \mu` | Mu | 缪 / miù | 均值、微（$\mu$） |
| $N \ \nu$ | `N \nu` | Nu | 纽 / niǔ | 自由度、频率 |
| $\Xi \ \xi$ | `\Xi \xi` | Xi | 克西 / kè xī | 随机变量 |
| $O \ o$ | `O o` | Omicron | 奥密克戎 | 大 O 记号 |
| $\Pi \ \pi$ | `\Pi \pi` | Pi | 派 / pài | 圆周率 $\approx 3.14159$ |
| $P \ \rho$ | `P \rho` | Rho | 柔 / róu | 密度、相关系数 |
| $\Sigma \ \sigma$ | `\Sigma \sigma` | Sigma | 西格玛 / xī gé mǎ | 求和（$\Sigma$）、标准差（$\sigma$） |
| $T \ \tau$ | `T \tau` | Tau | 陶 / táo | 扭矩、时间常数 |
| $\Upsilon \ \upsilon$ | `\Upsilon \upsilon` | Upsilon | 宇普西龙 | 物理中偶尔使用 |
| $\Phi \ \varphi$ | `\Phi \varphi` | Phi | 斐 / fěi | 黄金比例、相位 |
| $X \ \chi$ | `X \chi` | Chi | 凯 / kǎi | 卡方分布（$\chi^2$） |
| $\Psi \ \psi$ | `\Psi \psi` | Psi | 普西 / pǔ xī | 波函数 |
| $\Omega \ \omega$ | `\Omega \omega` | Omega | 欧米伽 / ōu mǐ jiā | 角速度、电阻（$\Omega$） |
