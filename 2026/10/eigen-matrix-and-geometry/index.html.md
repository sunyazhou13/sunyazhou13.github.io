---
layout: post
title: Eigen 用法笔记：矩阵运算与几何变换
description: "macOS 上装好 Eigen 3.4.1 并配好 zsh 环境变量，然后把《视觉 SLAM 十四讲》第三讲完整跑一遍：矩阵运算、解线性方程组、特征值，以及旋转矩阵、旋转向量、欧拉角、四元数和 Isometry3d 的用法与互转，附真实控制台输出。"
date: 2026-10-23 07:26 +0000
categories: [系统理论实践]
tags: [Eigen, SLAM, C++, 线性代数, 几何变换]
typora-root-url: ".."
math: false
mermaid: false
---

# 前言

本文具有强烈的个人感情色彩,如有观看不适,请尽快关闭. 本文仅作为个人学习记录使用,也欢迎在许可协议范围内转载或分享,请尊重版权并且保留原文链接,谢谢您的理解合作. 如果您觉得本站对您能有帮助,您可以使用RSS方式订阅本站,感谢支持!

---

这篇是我的《视觉 SLAM 十四讲》学习笔记第三讲的配套记录。

之所以单独为 Eigen 写一篇，是因为后面所有章节都绕不开它：第四讲的 Sophus 是对 `SO(3)` / `SE(3)` 的封装，底层还是 Eigen 的矩阵；第六讲之后的 g2o 和 Ceres，顶点、边、误差项、雅可比，全是 Eigen 类型。**这一讲要是没把用法记牢，后面每写一行代码都要回头翻书**。

所以我干脆把书里 `ch3/useEigen` 和 `ch3/useGeometry` 两个例子完整跑一遍，把代码、输出、踩到的坑都记下来，当作自己的速查表。以后忘了 `coeffs()` 的顺序是 `(x,y,z,w)` 还是 `(w,x,y,z)`，直接搜这篇文章就行。

---

## 一、先把 Eigen 装好（macOS 篇）

书上的环境是 Ubuntu + `sudo apt install libeigen3-dev`，装完头文件在 `/usr/include/eigen3`。macOS 上没有这个路径，得自己接。

### 1. 装哪个版本

Homebrew 默认的 `eigen` 现在是 **5.0.1**。这个版本比我用的书、也比后面要装的 Sophus / g2o / Ceres 都要新一大代——Eigen 5 里 `eulerAngles()` 已经被标成 deprecated（建议改用 `canonicalEulerAngles()`），而书上的代码到处在用 `eulerAngles`。

所以别装默认那个，装版本化的：

```bash
brew install eigen@3
```

装完是 **3.4.1**，和书上的 3.3/3.4、和我板子上（RK3576 / Debian）的 3.4.0 是同一代，行为一致。

`eigen@3` 是 **keg-only** 的，意思是它不会被软链到 `/opt/homebrew/include`，以免和 Eigen 5 打架。所以它的头文件在：

```
/opt/homebrew/opt/eigen@3/include/eigen3
```

两个版本可以共存，互不干扰。

### 2. 为什么裸编译会报 `Eigen/Core file not found`

装完之后我照着视频敲：

```bash
c++ eigenGeometry.cpp -o eigenGeometry
```

结果：

```
eigenGeometry.cpp:5:10: fatal error: 'Eigen/Core' file not found
```

原因很简单：**这条命令没带任何 `-I`**。`#include <Eigen/Core>` 让编译器去默认搜索路径里找 `Eigen/Core`，而 `/opt/homebrew/opt/eigen@3/include/eigen3` 不在默认路径里。Linux 上能过，是因为很多发行版会把 `/usr/include` 当默认路径，而 Eigen 恰好被 `libeigen3-dev` 放在 `/usr/include/eigen3`——**它其实也需要 `-I`**，只是书上用 CMake，路径已经在 `CMakeLists.txt` 里写好了，你没察觉而已。

### 3. 三种解决方式，按需选

**方式一，单次加 `-I`**，最直接：

```bash
c++ -I/opt/homebrew/opt/eigen@3/include/eigen3 eigenGeometry.cpp -o eigenGeometry
```

**方式二，写进 zsh 环境变量**（我用的是这个）。编译器会读 `CPLUS_INCLUDE_PATH`，设一次，之后任何目录裸编译都能找到：

```bash
# 追加到 ~/.zshrc
export CPLUS_INCLUDE_PATH="/opt/homebrew/opt/eigen@3/include/eigen3${CPLUS_INCLUDE_PATH:+:$CPLUS_INCLUDE_PATH}"
```

改完 `source ~/.zshrc` 或者开个新终端标签生效。验证一下：

```bash
echo $CPLUS_INCLUDE_PATH
# /opt/homebrew/opt/eigen@3/include/eigen3
```

之后再敲 `c++ eigenGeometry.cpp -o eigenGeometry` 就通了，不用再写 `-I`。

注意 `${CPLUS_INCLUDE_PATH:+:$CPLUS_INCLUDE_PATH}` 这个写法——如果直接写 `"...:$CPLUS_INCLUDE_PATH"` 而变量原本为空，结尾会留一个孤零零的冒号，某些编译器会把空项当成「当前目录」，不是我们想要的效果。

**方式三，用 CMake**，也是书上的方式。`ch3/useEigen/CMakeLists.txt` 里两行关键：

```cmake
# CMake 4.x 已经不支持 cmake_minimum_required(VERSION 2.8) 了，书上原来是 2.8
cmake_minimum_required( VERSION 3.10 )
project( useEigen )

# 指向 keg-only 的 eigen@3
include_directories( "/opt/homebrew/opt/eigen@3/include/eigen3" )

add_executable( eigenMatrix eigenMatrix.cpp )
```

然后：

```bash
cd ch3/useEigen
mkdir -p build && cd build
cmake .. && make -j8
./eigenMatrix
```

### 4. 在 CLion 里怎么配

我平时用 CLion，这段单独写——它和命令行是两套逻辑，不搞清楚会白折腾半天。

**先说为什么上面那招在 CLion 里失效。** `~/.zshrc` 里的 `CPLUS_INCLUDE_PATH` 只对「从终端启动的进程」生效。CLion 从 Dock 或 Finder 打开时，继承的是 launchd 的环境，`~/.zshrc` 压根没被读过。所以经常出现这种情况：终端里 `c++ eigenGeometry.cpp` 早就编得过了，CLion 里还是满屏红波浪线。

**第一步，打开对目录。** `slambook` 根目录**没有** `CMakeLists.txt`——整本书是几十个互相独立的 CMake 小工程，不是一个大工程。所以别把 `slambook` 整个拖进 CLion，它会提示找不到 CMake 工程。要打开的是具体那一讲的目录：

```
slambook/ch3/useEigen        有 CMakeLists.txt，可以打开
slambook/ch3/useGeometry     有，可以打开
slambook/                    没有，打不开
```

`File → Open` 选到 `useEigen` 这一层，CLion 会自动把它当 CMake 项目加载。

**第二步，让 CMake 找得到 Eigen。** 两种写法，任选一种。

跟书上一致，直接写死路径：

```cmake
include_directories( "/opt/homebrew/opt/eigen@3/include/eigen3" )
```

或者用 `find_package`，更规范一点：

```cmake
find_package( Eigen3 3.4 REQUIRED )

add_executable( eigenMatrix eigenMatrix.cpp )
target_link_libraries( eigenMatrix PRIVATE Eigen3::Eigen )
```

第二种有个前提：`eigen@3` 是 keg-only，不在 CMake 的默认搜索路径里，直接 `find_package` 是找不到的。得告诉 CLion 去哪找，位置在：

```
Settings → Build, Execution, Deployment → CMake → CMake options
```

填一行：

```
-DCMAKE_PREFIX_PATH=/opt/homebrew/opt/eigen@3
```

我这份 `CMakeLists.txt` 用的是第一种写法，所以把 `useEigen` 直接拖进 CLion 就能编，不用动任何设置。第二种适合你想让工程更「正规」、以后还要接别的库的场合。

**这里有个真坑，我专门测过：不锁版本会悄悄用上 Eigen 5。**

`find_package(Eigen3 REQUIRED)` 后面要是不写版本号，CMake 会去默认路径里找到 Homebrew 的 **Eigen 5.0.1**，然后痛痛快快接受——不报错、不警告。接着你代码里的 `eulerAngles()` 就开始刷 deprecated，行为也可能和书上对不上。实测对比：

| CMakeLists 写法 | 实际命中的版本 |
|---|---|
| `find_package(Eigen3 REQUIRED)`，不设 prefix | **5.0.1** |
| `find_package(Eigen3 3.4 REQUIRED)` + prefix 指向 `eigen@3` | **3.4.1** |

所以那个 `3.4` 必须写，它不是装饰。

**第三步，几个 CLion 的日常操作。**

- **改完 `CMakeLists.txt` 要点 Reload**：`Tools → CMake → Reload CMake Project`，或者点编辑器顶部弹出的 `Reload changes` 横幅。不 reload 的话，补全和构建还按旧配置走，改了半天没反应就是这个原因。
- **构建目录是 `cmake-build-debug/`**，不是我们手敲的 `build/`。两套目录并存没关系，但别指望 CLion 编出来的东西出现在 `build/` 里。
- **运行不用开终端**：每个 `add_executable` CLion 都会自动建一个运行配置，右上角下拉选中 `eigenMatrix`，点绿三角即可，输出在下方 Run 窗口。
- **`#include <Eigen/Core>` 标红但能编过**：这是代码洞察没拿到 include 路径，不是代码写错了。先 Reload CMake Project，还红就 `File → Invalidate Caches` 清缓存重启。
- **别引入第二套编译器**：Toolchain 保持 `Xcode` / `AppleClang` 就行（`Settings → Toolchains`）。书上第四讲有个 `1e-4d` 字面量，clang 直接报 `invalid suffix 'd'`，gcc 却能吃下去——两套编译器并存时，这种差异足够让人怀疑自己代码写错了。

> 顺带一句，`CMake 4.x` 那个报错在 CLion 里长得一模一样：`cmake_minimum_required(VERSION 2.8)` 会直接抛 `Compatibility with CMake < 3.5 has been removed`，工程根本加载不出来。书上所有例子都得改成 `3.10`。

---

## 二、第一部分：Eigen 的基本用法

源码在 `ch3/useEigen/eigenMatrix.cpp`。书里的注释写得很细，我按自己的理解重排一遍，把「为什么要这样写」补上。

先把完整源码和一次完整运行的输出放在这儿——下面逐段拆的时候，只挑相关的几行出来讲，随时可以翻回来对照。

### 完整源码

`ch3/useEigen/eigenMatrix.cpp` 全文，103 行：

```cpp
#include <iostream>
using namespace std;
#include <ctime>
// Eigen 部分
#include <Eigen/Core>
// 稠密矩阵的代数运算（逆，特征值等）
#include <Eigen/Dense>

#define MATRIX_SIZE 50

/****************************
* 本程序演示了 Eigen 基本类型的使用
****************************/

int main( int argc, char** argv )
{
    // Eigen 中所有向量和矩阵都是Eigen::Matrix，它是一个模板类。它的前三个参数为：数据类型，行，列
    // 声明一个2*3的float矩阵
    Eigen::Matrix<float, 2, 3> matrix_23;

    // 同时，Eigen 通过 typedef 提供了许多内置类型，不过底层仍是Eigen::Matrix
    // 例如 Vector3d 实质上是 Eigen::Matrix<double, 3, 1>，即三维向量
    Eigen::Vector3d v_3d;
	// 这是一样的
    Eigen::Matrix<float,3,1> vd_3d;

    // Matrix3d 实质上是 Eigen::Matrix<double, 3, 3>
    Eigen::Matrix3d matrix_33 = Eigen::Matrix3d::Zero(); //初始化为零
    // 如果不确定矩阵大小，可以使用动态大小的矩阵
    Eigen::Matrix< double, Eigen::Dynamic, Eigen::Dynamic > matrix_dynamic;
    // 更简单的
    Eigen::MatrixXd matrix_x;
    // 这种类型还有很多，我们不一一列举

    // 下面是对Eigen阵的操作
    // 输入数据（初始化）
    matrix_23 << 1, 2, 3, 4, 5, 6;
    // 输出
    cout << matrix_23 << endl;

    // 用()访问矩阵中的元素
    for (int i=0; i<2; i++) {
        for (int j=0; j<3; j++)
            cout<<matrix_23(i,j)<<"\t";
        cout<<endl;
    }

    // 矩阵和向量相乘（实际上仍是矩阵和矩阵）
    v_3d << 3, 2, 1;
    vd_3d << 4,5,6;
    // 但是在Eigen里你不能混合两种不同类型的矩阵，像这样是错的
    // Eigen::Matrix<double, 2, 1> result_wrong_type = matrix_23 * v_3d;
    // 应该显式转换
    Eigen::Matrix<double, 2, 1> result = matrix_23.cast<double>() * v_3d;
    cout << result << endl;

    Eigen::Matrix<float, 2, 1> result2 = matrix_23 * vd_3d;
    cout << result2 << endl;

    // 同样你不能搞错矩阵的维度
    // 试着取消下面的注释，看看Eigen会报什么错
    // Eigen::Matrix<double, 2, 3> result_wrong_dimension = matrix_23.cast<double>() * v_3d;

    // 一些矩阵运算
    // 四则运算就不演示了，直接用+-*/即可。
    matrix_33 = Eigen::Matrix3d::Random();      // 随机数矩阵
    cout << matrix_33 << endl << endl;

    cout << matrix_33.transpose() << endl;      // 转置
    cout << matrix_33.sum() << endl;            // 各元素和
    cout << matrix_33.trace() << endl;          // 迹
    cout << 10*matrix_33 << endl;               // 数乘
    cout << matrix_33.inverse() << endl;        // 逆
    cout << matrix_33.determinant() << endl;    // 行列式

    // 特征值
    // 实对称矩阵可以保证对角化成功
    Eigen::SelfAdjointEigenSolver<Eigen::Matrix3d> eigen_solver ( matrix_33.transpose()*matrix_33 );
    cout << "Eigen values = \n" << eigen_solver.eigenvalues() << endl;
    cout << "Eigen vectors = \n" << eigen_solver.eigenvectors() << endl;

    // 解方程
    // 我们求解 matrix_NN * x = v_Nd 这个方程
    // N的大小在前边的宏里定义，它由随机数生成
    // 直接求逆自然是最直接的，但是求逆运算量大

    Eigen::Matrix< double, MATRIX_SIZE, MATRIX_SIZE > matrix_NN;
    matrix_NN = Eigen::MatrixXd::Random( MATRIX_SIZE, MATRIX_SIZE );
    Eigen::Matrix< double, MATRIX_SIZE,  1> v_Nd;
    v_Nd = Eigen::MatrixXd::Random( MATRIX_SIZE,1 );

    clock_t time_stt = clock(); // 计时
    // 直接求逆
    Eigen::Matrix<double,MATRIX_SIZE,1> x = matrix_NN.inverse()*v_Nd;
    cout <<"time use in normal inverse is " << 1000* (clock() - time_stt)/(double)CLOCKS_PER_SEC << "ms"<< endl;

	// 通常用矩阵分解来求，例如QR分解，速度会快很多
    time_stt = clock();
    x = matrix_NN.colPivHouseholderQr().solve(v_Nd);
    cout <<"time use in Qr decomposition is " <<1000*  (clock() - time_stt)/(double)CLOCKS_PER_SEC <<"ms" << endl;

    return 0;
}
```

### 完整输出

`./eigenMatrix` 跑一次，控制台原样打印这么多行（34 行，其中最后两行计时每次都会浮动）：

```
1 2 3
4 5 6
1	2	3
4	5	6
10
28
32
77
 -0.999984 -0.0826997  -0.905911
 -0.736924  0.0655345   0.357729
  0.511211  -0.562082   0.358593

 -0.999984  -0.736924   0.511211
-0.0826997  0.0655345  -0.562082
 -0.905911   0.357729   0.358593
-1.99453
-0.575857
 -9.99984 -0.826997  -9.05911
 -7.36924  0.655345   3.57729
  5.11211  -5.62082   3.58593
 -0.370316  -0.888554 -0.0491136
 -0.737309  -0.172358   -1.69072
 -0.627782   0.996559   0.208558
-0.606436
Eigen values =
0.281738
0.548924
   2.378
Eigen vectors =
 0.213003 -0.511493  0.832469
 0.972431  0.193748  -0.12977
-0.094913   0.83716   0.53866
time use in normal inverse is 0.061ms
time use in Qr decomposition is 0.022ms
```

### 1. 一切都是 `Matrix<类型, 行, 列>`

Eigen 里没有单独的「向量」类型，向量就是列数为 1 的矩阵。

```cpp
// 2 行 3 列的 float 矩阵
Eigen::Matrix<float, 2, 3> matrix_23;

// Vector3d 就是 Eigen::Matrix<double, 3, 1>，只是起了个好记的名字
Eigen::Vector3d v_3d;
Eigen::Matrix<float, 3, 1> vd_3d;   // 和上面类似，但元素是 float

// Matrix3d 就是 Eigen::Matrix<double, 3, 3>
Eigen::Matrix3d matrix_33 = Eigen::Matrix3d::Zero();
```

常用别名记几个就够：

| 写法 | 实际类型 |
|---|---|
| `Vector3d` | `Matrix<double, 3, 1>` |
| `Matrix3d` | `Matrix<double, 3, 3>` |
| `MatrixXd` | 动态大小 `double` 矩阵 |
| `Matrix<float, Eigen::Dynamic, Eigen::Dynamic>` | 动态大小 `float` 矩阵 |

不定大小的场合用 `Dynamic`，比如点数事先不知道的 BA 问题。

### 2. 初始化和访问

`<<` 是按行填，这点和 `std::cin` 的直觉一致：

```cpp
matrix_23 << 1, 2, 3, 4, 5, 6;
cout << matrix_23 << endl;
```

访问用圆括号 `(i, j)`，不是方括号：

```cpp
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 3; j++)
        cout << matrix_23(i, j) << "\t";
    cout << endl;
}
```

输出：

```
1 2 3
4 5 6
1	2	3	
4	5	6	
```

### 3. 类型必须一致，维度必须匹配

这是 Eigen 最「烦」也最「好」的地方——它把错误挡在编译期。

```cpp
v_3d << 3, 2, 1;
vd_3d << 4, 5, 6;

// 编译不过：float 矩阵乘 double 向量，Eigen 不给你隐式转换
// Eigen::Matrix<double, 2, 1> result_wrong_type = matrix_23 * v_3d;

// 正确写法：显式 cast
Eigen::Matrix<double, 2, 1> result = matrix_23.cast<double>() * v_3d;
cout << result << endl;          // 10  28

Eigen::Matrix<float, 2, 1> result2 = matrix_23 * vd_3d;
cout << result2 << endl;         // 32  77
```

顺手验算一下：`(1,2,3)·(3,2,1) = 3+4+3 = 10`，`(4,5,6)·(3,2,1) = 12+10+6 = 28`，对得上。`vd_3d = (4,5,6)` 那组是 `4+10+18=32`、`16+25+36=77`。

维度搞错也是这样，编译期就炸：

```cpp
// 2x3 乘 3x1 得到 2x1，写成 2x3 就错
// Eigen::Matrix<double, 2, 3> result_wrong_dimension = matrix_23.cast<double>() * v_3d;
```

书上特意让你取消注释去试试——**这个错误信息值得看一次**，Eigen 的模板报错很长，但关键那行会告诉你维度对不上。

### 4. 基本运算

```cpp
matrix_33 = Eigen::Matrix3d::Random();   // 随机数矩阵（不 srand 播种则序列固定）

cout << matrix_33.transpose() << endl;   // 转置
cout << matrix_33.sum() << endl;         // 所有元素之和
cout << matrix_33.trace() << endl;       // 迹（对角线之和）
cout << 10 * matrix_33 << endl;          // 数乘
cout << matrix_33.inverse() << endl;     // 逆
cout << matrix_33.determinant() << endl; // 行列式
```

我这次跑出来的：

```
 -0.999984 -0.0826997  -0.905911
 -0.736924  0.0655345   0.357729
  0.511211  -0.562082   0.358593

 -0.999984  -0.736924   0.511211
-0.0826997  0.0655345  -0.562082
 -0.905911   0.357729   0.358593
-1.99453      ← sum
-0.575857     ← trace
 -9.99984 -0.826997  -9.05911
 -7.36924  0.655345   3.57729
  5.11211  -5.62082   3.58593
 -0.370316  -0.888554 -0.0491136
 -0.737309  -0.172358   -1.69072
 -0.627782   0.996559   0.208558
-0.606436     ← determinant
```

`trace = -0.999984 + 0.0655345 + 0.358593 = -0.575857`，和输出对上了。

> 这里得纠正一个我一开始的误解。`Random()` 听起来应该每次都不同，但它底层是 `std::rand()`，不调 `srand()` 播种的话序列是固定的。我连跑两次比对过：**34 行输出里只有最后两行计时不一样，矩阵数值一模一样**。所以你跑出来的数和上面相同不是巧合。想换一组，自己调 `srand()` 去。

### 5. 特征值：为什么乘一个 `A^T A`

```cpp
Eigen::SelfAdjointEigenSolver<Eigen::Matrix3d> eigen_solver ( matrix_33.transpose() * matrix_33 );
cout << "Eigen values = \n" << eigen_solver.eigenvalues() << endl;
cout << "Eigen vectors = \n" << eigen_solver.eigenvectors() << endl;
```

注意这里乘的是 `matrix_33.transpose() * matrix_33`，不是 `matrix_33` 本身。

原因：`SelfAdjointEigenSolver` 顾名思义只处理**自伴随矩阵**（实对称矩阵），而随机的 `matrix_33` 一般不对称，直接丢进去是不合法的。`A^T A` 一定是半正定对称的，所以先转成对称形式再求特征值——这也是最小二乘、PCA、协方差矩阵那一套的标准操作。

输出：

```
Eigen values = 
0.281738
0.548924
   2.378
Eigen vectors = 
 0.213003 -0.511493  0.832469
 0.972431  0.193748  -0.12977
-0.094913   0.83716   0.53866
```

特征向量是按列排的，第 i 列对应第 i 个特征值。

### 6. 解方程：别直接求逆

书中这段是全篇最有实操价值的地方。要解 `matrix_NN * x = v_Nd`，直觉做法是 `x = A^{-1} b`：

```cpp
Eigen::Matrix<double, MATRIX_SIZE, MATRIX_SIZE> matrix_NN;
matrix_NN = Eigen::MatrixXd::Random(MATRIX_SIZE, MATRIX_SIZE);   // MATRIX_SIZE = 50
Eigen::Matrix<double, MATRIX_SIZE, 1> v_Nd = Eigen::MatrixXd::Random(MATRIX_SIZE, 1);

clock_t time_stt = clock();
Eigen::Matrix<double, MATRIX_SIZE, 1> x = matrix_NN.inverse() * v_Nd;
cout << "time use in normal inverse is "
     << 1000 * (clock() - time_stt) / (double)CLOCKS_PER_SEC << "ms" << endl;

// 换成 QR 分解
time_stt = clock();
x = matrix_NN.colPivHouseholderQr().solve(v_Nd);
cout << "time use in Qr decomposition is "
     << 1000 * (clock() - time_stt) / (double)CLOCKS_PER_SEC << "ms" << endl;
```

我的机器上（M4）：

```
time use in normal inverse is 0.061ms
time use in Qr decomposition is 0.022ms
```

**快了将近 3 倍**。不过这个数每次跑都会浮动（我另一次是 0.058 / 0.022），看量级就行，别当基准测试。而且 50×50 的规模太小，差距不明显；矩阵一大，求逆的 `O(n^3)` 常系数会比分解法难看得多，数值稳定性也差。SLAM 里的正规方程动辄几百上千维，绝不能直接求逆。

记住这条规则：**解线性方程组用 `.solve()`，不要 `.inverse() *`**。Eigen 提供一堆分解可选：

```cpp
x = A.lu().solve(b);                    // 一般方阵
x = A.colPivHouseholderQr().solve(b);   // 一般矩阵，稳定
x = A.llt().solve(b);                   // 正定对称
x = A.ldlt().solve(b);                  // 半正定
```

---

## 三、第二部分：Eigen 的几何模块

源码在 `ch3/useGeometry/eigenGeometry.cpp`。这部分是给 SLAM 打地基的——刚体变换的四种表示法，全在这里。

先说结论，一张表：

| 表示 | 类型 | 参数个数 | 主要用途 |
|---|---|---|---|
| 旋转矩阵 | `Matrix3d` | 9（实际自由度 3） | 参与运算、求逆方便 |
| 旋转向量 | `AngleAxisd` | 4（轴 3 + 角 1） | 构造直观、无冗余 |
| 欧拉角 | `Vector3d` | 3 | 给人看 |
| 四元数 | `Quaterniond` | 4 | 存储、插值、优化 |

完整源码和完整输出同样先放这儿，篇幅不大，一共 60 行代码、24 行输出。

### 完整源码

`ch3/useGeometry/eigenGeometry.cpp` 全文：

```cpp
#include <iostream>
#include <cmath>
using namespace std;

#include <Eigen/Core>
// Eigen 几何模块
#include <Eigen/Geometry>

/****************************
* 本程序演示了 Eigen 几何模块的使用方法
****************************/

int main ( int argc, char** argv )
{
    // Eigen/Geometry 模块提供了各种旋转和平移的表示
    // 3D 旋转矩阵直接使用 Matrix3d 或 Matrix3f
    Eigen::Matrix3d rotation_matrix = Eigen::Matrix3d::Identity();
    // 旋转向量使用 AngleAxis, 它底层不直接是Matrix，但运算可以当作矩阵（因为重载了运算符）
    Eigen::AngleAxisd rotation_vector ( M_PI/4, Eigen::Vector3d ( 0,0,1 ) );     //沿 Z 轴旋转 45 度
    cout .precision(3);
    cout<<"rotation matrix =\n"<<rotation_vector.matrix() <<endl;                //用matrix()转换成矩阵
    // 也可以直接赋值
    rotation_matrix = rotation_vector.toRotationMatrix();
    // 用 AngleAxis 可以进行坐标变换
    Eigen::Vector3d v ( 1,0,0 );
    Eigen::Vector3d v_rotated = rotation_vector * v;
    cout<<"(1,0,0) after rotation = "<<v_rotated.transpose()<<endl;
    // 或者用旋转矩阵
    v_rotated = rotation_matrix * v;
    cout<<"(1,0,0) after rotation = "<<v_rotated.transpose()<<endl;

    // 欧拉角: 可以将旋转矩阵直接转换成欧拉角
    Eigen::Vector3d euler_angles = rotation_matrix.eulerAngles ( 2,1,0 ); // ZYX顺序，即roll pitch yaw顺序
    cout<<"yaw pitch roll = "<<euler_angles.transpose()<<endl;

    // 欧氏变换矩阵使用 Eigen::Isometry
    Eigen::Isometry3d T=Eigen::Isometry3d::Identity();                // 虽然称为3d，实质上是4＊4的矩阵
    T.rotate ( rotation_vector );                                     // 按照rotation_vector进行旋转
    T.pretranslate ( Eigen::Vector3d ( 1,3,4 ) );                     // 把平移向量设成(1,3,4)
    cout << "Transform matrix = \n" << T.matrix() <<endl;

    // 用变换矩阵进行坐标变换
    Eigen::Vector3d v_transformed = T*v;                              // 相当于R*v+t
    cout<<"v tranformed = "<<v_transformed.transpose()<<endl;

    // 对于仿射和射影变换，使用 Eigen::Affine3d 和 Eigen::Projective3d 即可，略

    // 四元数
    // 可以直接把AngleAxis赋值给四元数，反之亦然
    Eigen::Quaterniond q = Eigen::Quaterniond ( rotation_vector );
    cout<<"quaternion = \n"<<q.coeffs() <<endl;   // 请注意coeffs的顺序是(x,y,z,w),w为实部，前三者为虚部
    // 也可以把旋转矩阵赋给它
    q = Eigen::Quaterniond ( rotation_matrix );
    cout<<"quaternion = \n"<<q.coeffs() <<endl;
    // 使用四元数旋转一个向量，使用重载的乘法即可
    v_rotated = q*v; // 注意数学上是qvq^{-1}
    cout<<"(1,0,0) after rotation = "<<v_rotated.transpose()<<endl;

    return 0;
}
```

### 完整输出

```
rotation matrix =
 0.707 -0.707      0
 0.707  0.707      0
     0      0      1
(1,0,0) after rotation = 0.707 0.707     0
(1,0,0) after rotation = 0.707 0.707     0
yaw pitch roll = 0.785    -0     0
Transform matrix =
 0.707 -0.707      0      1
 0.707  0.707      0      3
     0      0      1      4
     0      0      0      1
v tranformed = 1.71 3.71    4
quaternion =
    0
    0
0.383
0.924
quaternion =
    0
    0
0.383
0.924
(1,0,0) after rotation = 0.707 0.707     0
```

### 1. 旋转向量：轴 + 角

```cpp
Eigen::Matrix3d rotation_matrix = Eigen::Matrix3d::Identity();

// 沿 Z 轴旋转 45 度
Eigen::AngleAxisd rotation_vector(M_PI / 4, Eigen::Vector3d(0, 0, 1));

cout.precision(3);
cout << "rotation matrix =\n" << rotation_vector.matrix() << endl;   // 用 matrix() 转成矩阵

rotation_matrix = rotation_vector.toRotationMatrix();   // 也可以直接赋值
```

这里 `cout.precision(3)` 只影响显示，不影响计算。输出：

```
rotation matrix =
 0.707 -0.707      0
 0.707  0.707      0
     0      0      1
```

`0.707` 就是 `√2/2`，45° 的 cos 和 sin。

`AngleAxisd` 底层不是 `Matrix`，但它重载了运算符，多数场合可以当矩阵用。

### 2. 用旋转向量转一个向量

```cpp
Eigen::Vector3d v(1, 0, 0);

Eigen::Vector3d v_rotated = rotation_vector * v;      // 直接乘，AngleAxis 支持
cout << "(1,0,0) after rotation = " << v_rotated.transpose() << endl;

v_rotated = rotation_matrix * v;                      // 或者用矩阵乘
cout << "(1,0,0) after rotation = " << v_rotated.transpose() << endl;
```

两行输出一样：

```
(1,0,0) after rotation = 0.707 0.707     0
```

绕 Z 轴转 45°，`(1,0,0)` 确实应该转到 `(0.707, 0.707, 0)`。画个图就能想明白：

![绕 Z 轴旋转 45 度](/assets/images/20261023EigenMatrixAndGeometry/rot-z45.avif)

> `transpose()` 是为了让向量横着打印。Eigen 的向量默认是列向量，直接 `cout << v` 会竖着打好几行。

### 3. 欧拉角：注意顺序，也注意坑

```cpp
Eigen::Vector3d euler_angles = rotation_matrix.eulerAngles(2, 1, 0);  // ZYX
cout << "yaw pitch roll = " << euler_angles.transpose() << endl;
```

`eulerAngles(2, 1, 0)` 里的 `2, 1, 0` 是指旋转轴的枚举顺序：0=X、1=Y、2=Z。所以 `2,1,0` 是「先绕 Z，再绕 Y，最后绕 X」——也就是导航里常说的 **yaw-pitch-roll（偏航-俯仰-滚转）**。返回的 `Vector3d` 也按这个顺序排列。

输出：

```
yaw pitch roll = 0.785    -0  0
```

0.785 = π/4，和我们设的 45° 一致。中间那个 `-0` 是浮点数的符号位，等于 0，别被它吓到。

**这里有两个坑**：

第一，欧拉角有 12 种顺序（`eulerAngles` 的六个参数排列组合），不同领域习惯不同。航空常用 ZYX，机器人学有时用 ZYZ。**顺序写错，结果完全不同**，而且不会报错，只会给你一个看起来正常但错的数。

第二，欧拉角有万向锁（Gimbal Lock）。当 pitch 接近 ±90° 时，yaw 和 roll 会退化成同一个自由度，解不唯一。所以**欧拉角只适合给人看，不适合存状态、不适合参与优化**。

顺便记一笔：Eigen 5 把 `eulerAngles()` 标成了 deprecated，理由是它返回的角度范围不唯一。3.4.x 上还能正常用，但以后升级会看到警告。

### 4. 欧氏变换矩阵：`Isometry3d`

```cpp
Eigen::Isometry3d T = Eigen::Isometry3d::Identity();   // 名字叫 3d，实质是 4x4
T.rotate(rotation_vector);                             // 设置旋转
T.pretranslate(Eigen::Vector3d(1, 3, 4));              // 设置平移
cout << "Transform matrix = \n" << T.matrix() << endl;
```

输出：

```
Transform matrix = 
 0.707 -0.707      0      1
 0.707  0.707      0      3
     0      0      1      4
     0      0      0      1
```

![Isometry3d 的 4×4 齐次矩阵分块](/assets/images/20261023EigenMatrixAndGeometry/isometry-4x4.avif)

**`Isometry3d` 虽然带个 "3d"，但它存的是 4×4 矩阵**——因为齐次坐标需要多一维。名字容易误导，第一次用会愣一下。真正的 3×3 旋转在左上角，平移在第四列，最后一行是 `0 0 0 1`。

关于 `pretranslate` 和 `translate` 的区别，这里要特别注意：

- `translate(t)` 是**右乘**，`T = T * Translation(t)`，平移在**当前坐标系**下解释
- `pretranslate(t)` 是**左乘**，`T = Translation(t) * T`，平移在**世界坐标系**下解释

书上用 `pretranslate`，所以在单位矩阵上操作时两者结果一样，看不出区别。但如果你先旋转再 `pretranslate`，平移向量是加在世界系里的——**这是最容易写错的地方之一**。

用变换矩阵转坐标：

```cpp
Eigen::Vector3d v_transformed = T * v;   // 相当于 R*v + t
cout << "v tranformed = " << v_transformed.transpose() << endl;
```

```
v tranformed = 1.71 3.71    4
```

验算：`R*v = (0.707, 0.707, 0)`，加个 `t = (1, 3, 4)`，得 `(1.707, 3.707, 4)`。对。

（书上这里把 `transformed` 拼成了 `tranformed`，输出的字符串就长这样，不是我看错。）

仿射变换和射影变换分别用 `Eigen::Affine3d` 和 `Eigen::Projective3d`，用法类似，书上略过了。

### 5. 四元数：`coeffs()` 的顺序是个大坑

```cpp
Eigen::Quaterniond q = Eigen::Quaterniond(rotation_vector);
cout << "quaternion = \n" << q.coeffs() << endl;

q = Eigen::Quaterniond(rotation_matrix);   // 也可以从旋转矩阵构造
cout << "quaternion = \n" << q.coeffs() << endl;
```

两次输出一样：

```
quaternion = 
    0
    0
0.383
0.924
```

**`coeffs()` 的存储顺序是 `(x, y, z, w)`，实部 `w` 在最后**。这和数学书上习惯写的 `q = w + xi + yj + zk`（实部在前）正好相反，也和很多论文、很多库的顺序不同。第一次看到 `0.924` 在最后一项，很容易以为哪里错了。

验算一下：绕 Z 轴转 45°，四元数应该是 `(cos22.5°, 0, 0, sin22.5°)` 按 `(w,x,y,z)` 排，即 `w=0.924, z=0.383`。而 `coeffs()` 给出的是 `(0, 0, 0.383, 0.924)`——`x=y=0`、`z=0.383`、`w=0.924`，正确。

如果你要按数学书写顺序取，用 `q.w()`、`q.x()`、`q.y()`、`q.z()` 单独访问，别直接拷 `coeffs()` 的内存。

用四元数旋转向量：

```cpp
v_rotated = q * v;   // 数学上是 q v q^{-1}
cout << "(1,0,0) after rotation = " << v_rotated.transpose() << endl;
```

```
(1,0,0) after rotation = 0.707 0.707     0
```

Eigen 重载了 `*`，内部自动做 `q v q^{-1}`，不用自己写。**但要注意：只有单位四元数才代表纯旋转**，用之前最好 `q.normalize()` 一下（从 `AngleAxis` 或旋转矩阵构造出来的已经是单位的）。

### 6. 四种表示之间怎么转

这张表建议直接抄下来：

```cpp
// 旋转向量 -> 旋转矩阵
Matrix3d R = angle_axis.toRotationMatrix();
Matrix3d R2 = angle_axis.matrix();

// 旋转矩阵 -> 旋转向量 / 四元数 / 欧拉角
AngleAxisd aa(R);
Quaterniond q(R);
Vector3d euler = R.eulerAngles(2, 1, 0);

// 旋转矩阵 <-> 四元数
Matrix3d R3 = q.toRotationMatrix();
Quaterniond q2(R3);

// 四元数 -> 旋转向量
AngleAxisd aa2(q2);
```

Eigen 的构造函数基本吃遍各种表示，转来转去很方便。**但每次转换都有精度损失和奇异性风险**——尤其是欧拉角，能不用就不用。

---

## 四、几个容易翻车的地方，集中记一下

写完上面两段，我把踩过的坑列成清单，方便以后自查：

| 坑 | 表现 | 正确做法 |
|---|---|---|
| 混用 `float` / `double` | 编译报一大串模板错误 | `.cast<double>()` 显式转换 |
| 直接 `A.inverse() * b` 解方程 | 慢、且数值不稳 | `A.xxx().solve(b)` |
| `SelfAdjointEigenSolver` 传非对称矩阵 | 结果没有意义（不一定报错） | 传 `A^T A` 或协方差矩阵 |
| `coeffs()` 顺序 | 以为 `w` 在第一个 | 顺序是 `(x,y,z,w)`，`w` 在最后 |
| `Isometry3d` 是 3×3 | 以为只有 9 个元素 | 实际是 4×4 齐次矩阵 |
| `pretranslate` vs `translate` | 平移方向莫名不对 | `pre` 是左乘（世界系），非 `pre` 是右乘（当前系） |
| 欧拉角顺序写错 | 数值看着正常但是错的 | 写明 `eulerAngles(2,1,0)` 并注释含义 |
| 对向量用 `cout <<` | 竖着打好多行 | `.transpose()` |
| 以为 `Random()` 每次都不同 | 跑两次结果一样，怀疑没重新编译 | 不播种时序列固定，只有计时会变 |
| 终端能编、CLion 标红 | 以为代码写错了 | 环境变量只对终端进程生效，IDE 里靠 CMake 的 `include_directories` |

还有三个 macOS 特有的：

- **CMake 4.x 不再支持 `cmake_minimum_required(VERSION 2.8)`**，书上所有 `CMakeLists.txt` 都得改成 `3.10`，否则报 `Compatibility with CMake < 3.5 has been removed`
- **AppleClang 不接受 `1e-4d` 这种字面量**（`d` 后缀是 GCC 扩展）。第四讲 `useSophus.cpp` 里就有一处，会报 `invalid suffix 'd' on floating constant`，改成 `1e-4` 即可
- **`find_package(Eigen3)` 不写版本号**会悄悄命中 Homebrew 的 Eigen 5.0.1，不报错但 `eulerAngles()` 立刻变 deprecated。写成 `find_package(Eigen3 3.4 REQUIRED)`，并配好 `CMAKE_PREFIX_PATH`

---

## 五、这套东西和 SLAM 的关系

跑完这两个例子，我才算真正理解为什么书要从这里开始。

第三讲看上去只是在练 API，其实是把后面所有章节的**词汇表**提前铺好了：

- 第四讲引入 Sophus，`Sophus::SO3d` / `SE3d` 内部就是 `Eigen::Matrix3d` + `Eigen::Quaterniond`，`log()` / `exp()` 映射的也是李代数向量（`Eigen::Matrix<double,6,1>`）
- 第六讲非线性优化，误差项、雅可比矩阵、正规方程 `H Δx = b`，`H` 和 `b` 都是 Eigen 的矩阵，解方程用的正是上面说的 `.ldlt().solve()`
- 第七讲特征点法、第八讲直接法、第十三讲稠密建图，全部围绕 `SE3` 变换和 Eigen 矩阵运算转
- g2o 和 Ceres 的接口，参数块、顶点估计值、信息矩阵，清一色 Eigen 类型

所以我把它当字典用：写代码时忘了某个 API，回来搜一下。

### 我的环境版本，留个底

| 组件 | 版本 | 说明 |
|---|---|---|
| Eigen | 3.4.1 | `brew install eigen@3`，keg-only |
| 系统 | macOS (Apple Silicon, M4) | AppleClang |
| 编译器 | AppleClang 21.0 | Xcode 自带 |
| CMake | 4.4.4 | 注意不支持 2.8 |

后面几讲还要装 Sophus、OpenCV、g2o、Ceres、PCL、Pangolin，版本搭配的坑更多，我会另开一篇记。

### 代码在哪

```
slambook/ch3/useEigen/eigenMatrix.cpp       ← 第一部分
slambook/ch3/useGeometry/eigenGeometry.cpp  ← 第二部分
```

跑法：

```bash
cd slambook/ch3/useEigen && mkdir -p build && cd build && cmake .. && make -j8 && ./eigenMatrix
cd slambook/ch3/useGeometry && mkdir -p build && cd build && cmake .. && make -j8 && ./eigenGeometry
```

CLion 里这些都不用敲：`File → Open` 打开对应目录，右上角下拉选目标，点绿三角就行。

---

## 写在最后

这一讲的内容不多，但密度很高。我当时看完视频觉得「懂了」，真正敲一遍才发现 `pretranslate` 的位置、`coeffs()` 的顺序这些细节全是坑。

所以记录这件事本身是有价值的——不是为了教别人，是为了三个月后自己还能看懂。

下一篇是第四讲，Sophus 和李代数。那才是真正开始疼的地方。
