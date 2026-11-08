---
layout: post
title: Math Formula Render
date: 2026-08-19 13:54 +0000
categories: [Test]
tags: [math, test]
math: true
mermaid: false
---

# Preface

This article is strongly personal in tone. If you find it uncomfortable to read, please close it as soon as possible. This article is only a personal learning record. You are welcome to repost or share it within the scope of the license agreement, but please respect the copyright and keep the original link. Thank you for your understanding and cooperation. If you find this site helpful, you can subscribe via RSS. Thanks for your support!

This post tests MathJax 3.2.2 rendering, following the official Chirpy theme conventions: block-level equations use `$$...$$`, inline math uses `$...$` (**never** use ```math fences — kramdown GFM renders them as plain code blocks).

## 1. Inline Math

When $a \ne 0$, the equation $ax^2 + bx + c = 0$ has two solutions. Here is Einstein's mass-energy equivalence $E = mc^2$, and Euler's identity $e^{i\pi} + 1 = 0$.

## 2. Block Equations (Basics)

$$
x = {-b \pm \sqrt{b^2-4ac} \over 2a}
$$

$$
\sum_{n=1}^\infty \frac{1}{n^2} = \frac{\pi^2}{6}
$$

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

## 3. Numbered Equations and References (equation + label)

$$
\begin{equation}
  \nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}
  \label{eq:gauss}
\end{equation}
$$

Gauss's law is given by $\eqref{eq:gauss}$, where $\rho$ is the charge density.

$$
\begin{equation}
  \nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
  \label{eq:ampere}
\end{equation}
$$

The Ampère–Maxwell law is shown in $\eqref{eq:ampere}$; both $\eqref{eq:gauss}$ and $\eqref{eq:ampere}$ belong to Maxwell's equations.

## 4. Multi-line Alignment (align)

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

## 5. Matrices

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

## 6. Fractions, Scripts, Greek Letters

$$
\frac{\partial^2 \varphi}{\partial x^2} + \frac{\partial^2 \varphi}{\partial y^2} = 0
$$

The Greek alphabet: $\alpha, \beta, \gamma, \delta, \varepsilon, \zeta, \eta, \theta, \lambda, \mu, \nu, \pi, \rho, \sigma, \tau, \phi, \omega, \Gamma, \Delta, \Theta, \Lambda, \Sigma, \Omega$

## 7. Sums, Integrals, Limits

$$
\lim_{n \to \infty} \left( 1 + \frac{1}{n} \right)^n = e
$$

$$
\oiint_S \mathbf{F} \cdot d\mathbf{S} = \iiint_V \nabla \cdot \mathbf{F} \, dV
$$

$$
\sum_{k=0}^{n} \binom{n}{k} x^k y^{n-k} = (x + y)^n
$$

## 8. Special Operators

$$
a \approx b, \quad a \ne b, \quad a \times b, \quad a \div b, \quad a \pm b, \quad a \le b, \quad a \ge b, \quad a \in S, \quad A \subset B, \quad A \cap B, \quad A \cup B
$$

$$
\forall \varepsilon > 0, \exists \delta > 0: |x - x_0| < \delta \Rightarrow |f(x) - f(x_0)| < \varepsilon
$$

## 9. Long Formula (Horizontal Scroll Test)

$$
P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}, \quad k = 0, 1, 2, \ldots, \quad E(X) = \operatorname{Var}(X) = \lambda, \quad \hat{\theta}_{MLE} = \arg\max_{\theta} \prod_{i=1}^{n} f(x_i; \theta)
$$

## 10. Dollar Signs in Code Blocks (Must Not Render)

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

Neither `$price` nor `${price}` inside code blocks should trigger math rendering.

## 11. Mixed Layout Test

The Fourier transform $F(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} \, dt$ is a cornerstone of signal processing; its inverse is:

$$
f(t) = \frac{1}{2\pi} \int_{-\infty}^{\infty} F(\omega) e^{i\omega t} \, d\omega
$$

GPU alignment arithmetic (echoing the earlier post):

$$
\text{offset} = \frac{\text{size} + \text{alignment} - 1}{\text{alignment}} \times \text{alignment} = \left\lceil \frac{\text{size}}{\text{alignment}} \right\rceil \times \text{alignment}
$$

## 12. Advanced Formula Gallery

### 12.1 Piecewise Functions and Matrix Variants (cases / vmatrix)

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

### 12.2 Decorative Structures (boxed / overbrace / underbrace / xrightarrow / substack / cancel)

$$
\boxed{E = mc^2}
$$

$$
\underbrace{(a + b + \cdots + z)}_{26\ \text{terms}}, \quad \overbrace{a + a + \cdots + a}^{n\ \text{terms}}
$$

$$
A \xrightarrow{\text{rotate}} B \qquad A \xleftarrow{\text{inverse rotate}} A
$$

$$
\sum_{\substack{0 \le i \le n \\ 0 \le j \le i}} a_{ij} = \sum_{i=0}^{n} \sum_{j=0}^{i} a_{ij}
$$

$$
\frac{a}{\cancel{b}} \cdot \cancel{b} = a
$$

### 12.3 Series Expansions

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$

$$
f(x) = \frac{a_0}{2} + \sum_{n=1}^{\infty} \left( a_n \cos\frac{n\pi x}{L} + b_n \sin\frac{n\pi x}{L} \right)
$$

### 12.4 Probability and Statistics

$$
P(A \mid B) = \frac{P(B \mid A) \, P(A)}{P(B)}
$$

$$
p(x) = \frac{1}{\sqrt{2\pi}\,\sigma} \exp\left( -\frac{(x-\mu)^2}{2\sigma^2} \right)
$$

$$
\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i, \quad s^2 = \frac{1}{n-1}\sum_{i=1}^{n} (x_i - \bar{x})^2
$$

### 12.5 Vector Calculus (Gradient / Divergence / Curl)

$$
\nabla f = \frac{\partial f}{\partial x}\mathbf{i} + \frac{\partial f}{\partial y}\mathbf{j} + \frac{\partial f}{\partial z}\mathbf{k}
$$

$$
\nabla \cdot \mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y} + \frac{\partial F_z}{\partial z}
$$

$$
\nabla \times \mathbf{F} = \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ \dfrac{\partial}{\partial x} & \dfrac{\partial}{\partial y} & \dfrac{\partial}{\partial z} \\ F_x & F_y & F_z \end{vmatrix}
$$

### 12.6 Classic Physics Equations

Maxwell's equations (differential form):

$$
\begin{align}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{align}
$$

The Schrödinger equation:

$$
i\hbar \frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \left( -\frac{\hbar^2}{2m}\nabla^2 + V(\mathbf{r}) \right) \Psi(\mathbf{r},t)
$$

The Euler–Lagrange equation:

$$
\frac{\partial L}{\partial q} - \frac{d}{dt}\frac{\partial L}{\partial \dot{q}} = 0
$$

### 12.7 Linear Algebra

$$
\mathbf{A}\mathbf{v} = \lambda \mathbf{v}, \quad \mathbf{A} = \mathbf{P}\mathbf{D}\mathbf{P}^{-1}, \quad \mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\mathsf{T}}
$$

$$
\operatorname{tr}(\mathbf{A}) = \sum_{i=1}^{n} a_{ii}, \quad \operatorname{rank}(\mathbf{A}\mathbf{B}) \le \min\{\operatorname{rank}(\mathbf{A}), \operatorname{rank}(\mathbf{B})\}
$$

### 12.8 Machine Learning Formulas

$$
\text{softmax}(z_i) = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}, \quad \mathcal{L} = -\sum_{i=1}^{C} y_i \log \hat{y}_i
$$

$$
\text{Attention}(Q, K, V) = \text{softmax}\left( \frac{QK^{\mathsf{T}}}{\sqrt{d_k}} \right) V
$$

$$
\nabla_{\theta} J(\theta) = \mathbb{E}_{\pi_{\theta}} \left[ \sum_{t=0}^{T} \nabla_{\theta} \log \pi_{\theta}(a_t \mid s_t) \, G_t \right]
$$

### 12.9 CJK Text Inside Math (\text Test)

$$
\text{speed} = \frac{\text{distance}}{\text{time}}, \quad p = \frac{F}{S}
$$

## 13. Math Symbol Pronunciation Cheat Sheet

> Adapted from a printable Chinese pronunciation reference; 11 categories. The third column lists the LaTeX command.

### 13.1 Basic Operators

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $+$ | `+` | plus | addition, $2 + 3 = 5$ |
| $-$ | `-` | minus | subtraction, $5 - 2 = 3$ |
| $\times$ | `\times` | times | $2 \times 3 = 6$ |
| $\cdot$ | `\cdot` | dot / centered dot | $a \cdot b$ |
| $\div$ | `\div` | divided by | $6 \div 2 = 3$ |
| $\pm$ | `\pm` | plus or minus | $\pm 3$ |
| $\mp$ | `\mp` | minus or plus | opposite of $\pm$ |
| $=$ | `=` | equals | $a = b$ |
| $\ne$ | `\ne` | is not equal to | $a \ne b$ |
| $\approx$ | `\approx` | is approximately equal to | $\pi \approx 3.14$ |
| $\equiv$ | `\equiv` | is identically equal to | $a \equiv a$ |
| $\propto$ | `\propto` | is proportional to | $y \propto x$ |
| $:$ | `:` | ratio | $3 : 5$ |

### 13.2 Comparison

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $>$ | `>` | greater than | $5 > 3$ |
| $<$ | `<` | less than | $3 < 5$ |
| $\ge$ | `\ge` | greater than or equal to | $a \ge b$ |
| $\le$ | `\le` | less than or equal to | $a \le b$ |
| $\gg$ | `\gg` | much greater than | $a \gg b$ |
| $\ll$ | `\ll` | much less than | $a \ll b$ |
| $\nless$ | `\nless` | not less than | same as $\ge$ |
| $\ngtr$ | `\ngtr` | not greater than | same as $\le$ |

### 13.3 Exponents, Roots, Logarithms

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $a^2$ | `a^2` | a squared | second power |
| $a^3$ | `a^3` | a cubed | third power |
| $a^n$ | `a^n` | a to the n | n-th power |
| $\sqrt{a}$ | `\sqrt{a}` | square root of a | $\sqrt{4} = 2$ |
| $\sqrt[3]{a}$ | `\sqrt[3]{a}` | cube root | $\sqrt[3]{8} = 2$ |
| $\sqrt[n]{a}$ | `\sqrt[n]{a}` | n-th root | n-th root of a |
| $\log_a b$ | `\log_a b` | log base a of b | $\log_{10} 100 = 2$ |
| $\ln x$ | `\ln x` | natural log | base $e$ |
| $\lg x$ | `\lg x` | common log | base 10 |
| $\mathrm{e}$ | `e` | Euler's number | $\mathrm{e} \approx 2.718$ |
| $n!$ | `n!` | n factorial | $3! = 6$ |
| $\vert x \vert$ | `\vert x \vert` | absolute value of x | $\vert -3 \vert = 3$ |

### 13.4 Set Theory

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $\in$ | `\in` | belongs to | $x \in A$ |
| $\notin$ | `\notin` | does not belong to | not an element |
| $\subseteq$ | `\subseteq` | is a subset of | $A \subseteq B$ |
| $\subset$ | `\subset` | is a proper subset of | $A \subset B$ |
| $\supseteq$ | `\supseteq` | is a superset of | $B \supseteq A$ |
| $\cup$ | `\cup` | union | $A \cup B$ |
| $\cap$ | `\cap` | intersection | $A \cap B$ |
| $\emptyset$ | `\emptyset` | the empty set | no elements |
| $\complement$ | `\complement` | complement | complement in a universe |
| $\forall$ | `\forall` | for all | holds for all elements |
| $\exists$ | `\exists` | there exists | at least one |
| $\nexists$ | `\nexists` | there does not exist | no such element |
| $\mathbb{N}$ | `\mathbb{N}` | natural numbers | $\{0, 1, 2, \ldots\}$ |
| $\mathbb{Z}$ | `\mathbb{Z}` | integers | $\{\ldots, -1, 0, 1, \ldots\}$ |
| $\mathbb{Q}$ | `\mathbb{Q}` | rational numbers | all fractions $p/q$ |
| $\mathbb{R}$ | `\mathbb{R}` | real numbers | all reals |
| $\mathbb{C}$ | `\mathbb{C}` | complex numbers | $a + bi$ |

### 13.5 Calculus

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $\sum$ | `\sum` | summation / sigma | $\sum_i x_i$ |
| $\prod$ | `\prod` | product / capital pi | repeated product |
| $\int$ | `\int` | integral | definite or indefinite |
| $\iint$ | `\iint` | double integral | 2-D integral |
| $\oint$ | `\oint` | contour integral | along a closed path |
| $\frac{df}{dx}$ | `\frac{df}{dx}` | derivative of f with respect to x | differentiation |
| $\partial$ | `\partial` | partial (derivative) | $\partial f / \partial x$ |
| $\nabla$ | `\nabla` | nabla / del | gradient operator |
| $\Delta$ | `\Delta` | delta / increment | change, $\Delta x$ |
| $\lim$ | `\lim` | limit | $\lim_{x \to 0} f(x)$ |
| $\to$ | `\to` | tends to | $x \to 0$ |
| $\infty$ | `\infty` | infinity | $x \to \infty$ |
| $o(x)$ | `o(x)` | little-o | higher-order infinitesimal |

### 13.6 Logic

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $\Rightarrow$ | `\Rightarrow` | implies | $p \Rightarrow q$ |
| $\Leftrightarrow$ | `\Leftrightarrow` | if and only if | necessary and sufficient |
| $\to$ | `\to` | derives | logical derivation |
| $\land$ | `\land` | logical and | $p \land q$ |
| $\lor$ | `\lor` | logical or | $p \lor q$ |
| $\neg$ | `\neg` | negation | $\neg p$ |
| $\sim$ | `\sim` | not | logical negation |
| $\oplus$ | `\oplus` | exclusive or / XOR | bitwise XOR |
| $\vdash$ | `\vdash` | syntactically entails | provable |
| $\top$ | `\top` | tautology / top | always true |
| $\bot$ | `\bot` | contradiction / bottom | always false |

### 13.7 Geometry

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $\angle$ | `\angle` | angle | $\angle ABC$ |
| $\parallel$ | `\parallel` | is parallel to | $AB \parallel CD$ |
| $\nparallel$ | `\nparallel` | is not parallel to | not parallel |
| $\perp$ | `\perp` | is perpendicular to | $AB \perp CD$ |
| $\triangle$ | `\triangle` | triangle | $\triangle ABC$ |
| $\bigcirc$ | `\bigcirc` | circle | circle $O$ |
| $^\circ$ | `^\circ` | degrees | $90^\circ$ |
| $^\prime$ | `^\prime` | minutes of arc | $30^\circ 15^\prime$ |
| $^{\prime\prime}$ | `^{\prime\prime}` | seconds of arc | arc seconds |
| $\cong$ | `\cong` | is congruent to | $\triangle ABC \cong \triangle DEF$ |
| $\sim$ | `\sim` | is similar to | $\triangle ABC \sim \triangle DEF$ |
| $\overset{\frown}{AB}$ | `\overset{\frown}{AB}` | arc | arc $AB$ |

### 13.8 Probability and Statistics

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $P(A)$ | `P(A)` | probability | probability of event $A$ |
| $E(X)$ | `E(X)` | expectation | expected value |
| $\operatorname{Var}(X)$ | `\operatorname{Var}` | variance | also $D(X)$ |
| $\sigma$ | `\sigma` | standard deviation | sigma |
| $\sigma^2$ | `\sigma^2` | variance | sigma squared |
| $\mu$ | `\mu` | mean | population mean |
| $\bar{x}$ | `\bar{x}` | x bar | sample mean |
| $N(\mu, \sigma^2)$ | `N(\mu,\sigma^2)` | normal distribution | mean $\mu$, variance $\sigma^2$ |
| $A \cap B$ | `\cap` | intersection of events | both occur |
| $A \cup B$ | `\cup` | union of events | at least one occurs |
| $P(A \vert B)$ | `P(A \vert B)` | conditional probability | $A$ given $B$ |
| $A \mathrel{\perp\mkern-6mu\perp} B$ | `\mathrel{\perp\mkern-6mu\perp}` | independent | statistically independent (kramdown GFM eats the backslash in `\!`, hence the `\mkern` form) |

### 13.9 Linear Algebra

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $\vert A \vert$ | `\vert A \vert` | determinant of A | determinant |
| $\det(A)$ | `\det(A)` | determinant | same as $\vert A \vert$ |
| $A^{\mathsf{T}}$ | `A^{\mathsf{T}}` | A transpose | matrix transpose |
| $A^{-1}$ | `A^{-1}` | A inverse | matrix inverse |
| $\operatorname{rank}(A)$ | `\operatorname{rank}` | rank | rank of the matrix |
| $\operatorname{tr}(A)$ | `\operatorname{tr}` | trace | sum of diagonal entries |
| $\langle x, y \rangle$ | `\langle x,y \rangle` | inner product | dot product of vectors |
| $\Vert x \Vert$ | `\Vert x \Vert` | norm of x | length of a vector |
| $\otimes$ | `\otimes` | tensor product | Kronecker product |
| $\oplus$ | `\oplus` | direct sum | direct sum of subspaces |
| $I$ | `I` | identity matrix | ones on the diagonal |
| $\ker$ | `\ker` | kernel | null space of a map |

### 13.10 Miscellaneous

| Symbol | LaTeX | Name | Meaning / Example |
| :---: | :--- | :--- | :--- |
| $\equiv$ | `\equiv` | congruent (modulo) | $a \equiv b \pmod{n}$ |
| $\bmod$ | `\bmod` | modulo | $7 \bmod 3 = 1$ |
| $\lfloor x \rfloor$ | `\lfloor x \rfloor` | floor of x | $\lfloor 3.7 \rfloor = 3$ |
| $\lceil x \rceil$ | `\lceil x \rceil` | ceiling of x | $\lceil 3.2 \rceil = 4$ |
| $\binom{n}{k}$ | `\binom{n}{k}` | n choose k | combinations |
| $\mathrm{A}_n^k$ | `\mathrm{A}_n^k` | permutations | k-permutations of n |
| $\gcd$ | `\gcd` | greatest common divisor | $\gcd(12, 8) = 4$ |
| $\operatorname{lcm}$ | `\operatorname{lcm}` | least common multiple | $\operatorname{lcm}(4, 6) = 12$ |
| $f(x)$ | `f(x)` | f of x | function of x |
| $f^{-1}$ | `f^{-1}` | f inverse | inverse function |
| $\aleph_0$ | `\aleph_0` | aleph-null | cardinality of the naturals |

### 13.11 Greek Alphabet (Common in Math)

| Symbol | LaTeX | Name | Common Usage |
| :---: | :--- | :--- | :--- |
| $A \ \alpha$ | `A \alpha` | Alpha | angles, coefficients |
| $B \ \beta$ | `B \beta` | Beta | angles, Beta function |
| $\Gamma \ \gamma$ | `\Gamma \gamma` | Gamma | Gamma function, Euler's constant |
| $\Delta \ \delta$ | `\Delta \delta` | Delta | change, discriminant |
| $E \ \varepsilon$ | `\varepsilon` | Epsilon | small quantities, limits |
| $Z \ \zeta$ | `Z \zeta` | Zeta | Riemann zeta function |
| $H \ \eta$ | `H \eta` | Eta | efficiency, viscosity |
| $\Theta \ \theta$ | `\Theta \theta` | Theta | angles, parameters |
| $I \ \iota$ | `I \iota` | Iota | tiny quantities |
| $K \ \kappa$ | `K \kappa` | Kappa | curvature, constants |
| $\Lambda \ \lambda$ | `\Lambda \lambda` | Lambda | wavelength, eigenvalues |
| $M \ \mu$ | `M \mu` | Mu | mean, micro- prefix |
| $N \ \nu$ | `N \nu` | Nu | degrees of freedom, frequency |
| $\Xi \ \xi$ | `\Xi \xi` | Xi | random variables |
| $O \ o$ | `O o` | Omicron | big-O notation |
| $\Pi \ \pi$ | `\Pi \pi` | Pi | circle constant $\approx 3.14159$ |
| $P \ \rho$ | `P \rho` | Rho | density, correlation |
| $\Sigma \ \sigma$ | `\Sigma \sigma` | Sigma | summation, std deviation |
| $T \ \tau$ | `T \tau` | Tau | torque, time constant |
| $\Upsilon \ \upsilon$ | `\Upsilon \upsilon` | Upsilon | occasionally in physics |
| $\Phi \ \varphi$ | `\Phi \varphi` | Phi | golden ratio, phase |
| $X \ \chi$ | `X \chi` | Chi | chi-squared distribution |
| $\Psi \ \psi$ | `\Psi \psi` | Psi | wave function |
| $\Omega \ \omega$ | `\Omega \omega` | Omega | angular velocity, ohms |
