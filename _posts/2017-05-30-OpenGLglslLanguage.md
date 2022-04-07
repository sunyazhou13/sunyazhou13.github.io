---
title: OpenGL编程语言-glsl基础
categories: [ios开发]
tags: [ios, macos, opengl es]
date: 2017-05-30 20:32:33
---

# 前言  
![](/assets/images/20170530OpenGLglslLanguage/OpenglVboShaderGlslVaoGPU.jpg)

最近在研究OpenGL 被各种陌生的名词虐成狗,所以记录下来一些学习知识点供学习和参考.

## GLSL是什么?

GLSL(OpenGL Shading Language) 是OpenGL的着色器语言,纯粹的和GPU打交道的计算机语言.可以理解为C的变种专门针对OpenGL编程,不支持指针等等一些C的特性等. (名词解释:着色器(Shader))  
  
**GPU是多线程并行处理器**，GLSL直接面向[单指令流多数据流(SIMD)](https://zh.wikipedia.org/wiki/%E5%8D%95%E6%8C%87%E4%BB%A4%E6%B5%81%E5%A4%9A%E6%95%B0%E6%8D%AE%E6%B5%81)模型的多线程计算。
GLSL编写的着色器函数是对每个数据同时执行的。
每个顶点都会由顶点着色器中的算法处理，每个像素也都会由 **片段着色器(也有叫片元着色器)**中的算法处理。
初学者在编写自己的着色器时，需要考虑到SIMD的并发特性，并用并行计算的思路来思考问题 这就是GLSL.

我们最常见的用法是在 **顶点着色器**里生成所需要的值，然后传给 **片断着色器**用.

## GLSL能做什么

* 日以逼真的材质 -- 金属，岩石，木头，油漆等
* 日益逼真的光照效果 -- 区域光和软阴影
* 非现实材质 -- 美术效果，钢笔画，水墨画和对插画技术的模拟
* 针对纹理内存的新用途
* 更少的纹理访问 
* 图形处理 -- 选择，边缘钝化遮蔽和复杂混合
* 动画效果 -- 关键帧插值，粒子系统
* 用户可编程的反走样方法


## GLSL注意

* **GLSL支持函数重载**(就是父类定义方法,子类复写该方法叫重载)
* **GLSL不存在数据类型的自动提升(就是不支持类型自动向上转换 eg:float 转 double)，类型必须严格保持一致.**
* **GLSL不支持指针，字符串，字符，它基本上是一种处理数字数据的语言**
* **GLSL不支持联合(union)、枚举类型(enum)、结构体(stuct)位字段(>> or << 左右移)及按位运算符(| or &这种按位与)**(就是干掉麻烦的C操作 让这个更单纯的处理图形数据使用)

## GLSL的数据类型

GLSL有三种基本数据类型: 

* float
* int
* double
* 由float、int、double组成的array[]或者结构体  

``` glsl
42   // 十进制  
042  // 八进制  
0x2A // 十六进制

```

__**注意:GLSL不支持指针,GLSL把向量和矩阵作为基本数据类型**__  
[向量(vector)](http://baike.baidu.com/link?url=XKZL51jLByIFnqrj3vaZ-4cnL-AedjBKiVBcD7pEGQG26Jmb9RYl7QOrX4Mwck-mT0nNlzD8UtzXi4ueVYNGkdO1b2uARr59UAih7ulWRvO):有起始位置有方向的线段,也称作 **矢量**(不要被这些名词吓到,我记得这个向量是我高二的时候数学学的东西).

## 矢量

矢量可以和标量甚至矩阵做加减乘除(必须遵守一定规则才可以 否则报错)

```
vec2,  vec3,  vec4  //包含2/3/4个浮点数的矢量(浮点型)
ivec2, ivec3, ivec4 //包含2/3/4个整数的矢量(整形数 前边带i 代表integer)
bvec2, bvec3, bvec4 //包含2/3/4个布尔值的矢量(bool不用解释)
```

上边这些是一种GLSL的数据类型, 可以简单理解为 `vec+数字` 就代表 是一个数组里面放几个元素(应该都是 vec2~vec4之间,没见过 vec5以上和vec2以下,好像这就代表几维坐标系),默认元素是float浮点类型,前边带`i`代表`integer`整形,`b`代表`bool`.

### vec如何声明使用？

``` 
vec3 v; 	 //声明三维浮点型向量v
v[1] = 3.0;  //给向量v的第二个元素赋值(数组从0开始,下标为1就是第二个元素)

//下面两种等价
vec3 v = vec3(0.6); //数组是连续的存储空间 相当于其它元素默认被这个0.6值填充
vec3 v = vec3(0.6,0.6,0.6); 
```
> _注意: 除了用索引方式外,还能用选择运算符的方式来使用向量.择运算符是对于向量的各个元素（最多为4个）约定俗成的名称，用一个小写拉丁字母来表示。根据向量表示对象的意义不同，可以使用以下选择运算符:_  
 
* 表示顶点可以用 (x、y、z、w)  (坐标系)
* 表示颜色可以用 (r、g、b、a)  (颜色值带透明)
* 表示纹理坐标用 (s、t、p、q)    
三种任选一种都一样,作用都是等效的. 也就是说，如果`v`是一个向量，那么:  
* `v[0]`
* `v.x`
* `v.r`
* `v.s`  
都指的是向量v的第一个元素。  
例如:

``` glsl
//用构造函数的方式声明并初始化四维浮点型
vec4 v1 = vec4(1.0, 2.0, 3.0, 4.0); 
vec4 v2;  
v2.xy=v1.yz;  //将v1的第二个和第三个元素复制到v2的第一个和第二个元素
v2.z=2.0;  	  //给v2的第三个元素赋值  
v2.xy=v1.yx;  //将v1的头两个元素互换，再复制到v2的头两个元素中
```

## 矩阵(matrix) 
	
矩阵(matrix)以下类型都以mat开头

* `mat2` 代表2x2的矩阵
* `mat3` 代表3x3的矩阵
* `mat4` 代表4x4的矩阵  
_**注意:矩阵是按列顺序组织的，先列后行**_

如下代码:

``` glsl
mat4 m;		 //声明四维浮点型方阵m  
m[2][3]=2.0; //给方阵的第三列、第四行元素赋值 

// 下面两种等价，初始化矩阵对角
mat2 m = mat2(1.0)
mat2 m = mat2(1.0, 0.0, 0.0, 1.0);

```

## 取样器(Sampler)

纹理查找需要制定哪个纹理或者纹理单元将制定查找.

``` glsl
sampler1D        // 访问一个一维纹理
sampler2D        // 访问一个二维纹理           
sampler3D        // 访问一个三维纹理
samplerCube      // 访问一个立方贴图纹理
sampler1DShadow  // 访问一个带对比的一维深度纹理
sampler2DShadow  // 访问一个带对比的二维深度纹理
```

``` glsl
uniform sampler2D grass;

vcc2 coord = vec2(100, 100);
vec4 color = texture2D(grass, coord);
```

如果一个着色器在程序里结合多个文理, 可以使用取样器数组.

``` glsl
const int tex_nums = 4;
uniform sampler2D textures[tex_nums];

for(int i = 0; i < tex_nums; ++i) {
    sampler2D tex = textures[i];
    // todo ...
}
```

## 结构体

这是唯一的用户能用的自定义类型  

``` glsl
struct light  
{  
    vec3 position;  
    vec3 color;  
};  

light ceiling_light;
```

## 数组

数组索引是从0开始的，而且没有指针概念

``` glsl
// 创建一个10个元素的数组  
vec4 points[10];  

// 创建一个不指定大小的数组
vec4 points[]; 
points[2] = vec4(1.0);  // points现在大小为3
points[7] = vec4(2.0);  // points现在大小为8

```

## void

只能用于声明函数返回值

## 类型转换

必须明确地进行类型转换，不会自动类型提升

``` glsl
float f = 2.3; 
bool b = bool(f); // b is true
```

## 限定符

**GLSL中有4个限定符（variable qualifiers）可供使用，它们限定了被标记的变量不能被更改的"范围".**

* `const`
* `attribute`
* `uniform`
* `varying`  

`const`: 和C++里差不多，定义不可变常量
表示限定的变量在编译时不可被修改.

`attribute`:是应用程序传给顶点着色器用的  
不允许声明时初始化  

`attribute`限定符标记的是一种全局变量,该变量在顶点着色器中是只读（read-only）的，该变量被用作从OpenGL应用程序向顶点着色器中传递参数，因此该限定符仅能用于顶点着色器. 

```
attribute变量是只能在vertex shader中使用的变量
它不能在fragment shader中声明attribute变量，
也不能被fragment shader中使用）
在application中，一般用函数glBindAttribLocation（）来绑定每个attribute变量的位置，然后用函数
glVertexAttribPointer（）为每个attribute变量赋值。
以下是例子：
uniform mat4 u_matViewProjection;
attribute vec4 a_position;
attribute vec2 a_texCoord0;
varying vec2 v_texCoord;
void main(void)
{
  gl_Position = u_matViewProjection * a_position;
  v_texCoord = a_texCoord0;
}


```


`uniform`:一般是应用程序用于设定顶点着色器和片断着色器相关初始化值.不允许声明时初始化.`uniform`限定符标记的是一种全局变量,该变量对于一个图元（`primitive`）来说是不可更改的 它可以从`OpenGL`应用程序中接收传递来的参数  

``` 
uniform变量 外部程序传递给shader的变量.
函数glUniform**（）函数赋值的.
shader 中是只读变量,不能被 shader 修改.
uniform变量一般用来表示：变换矩阵，材质，光照参数和颜色等信息。
uniform mat4 viewProjMatrix; //投影+视图矩阵
uniform mat4 viewMatrix;        //视图矩阵
uniform vec3 lightPosition;     //光源位置

```

`varying`:用于传递顶点着色器的值给片断着色器.它提供了从顶点着色器向片段着色器传递数据的方法，varying限定符可以在顶点着色器中定义变量，然后再传递给光栅化器，光栅化器对数据插值后，再将每个片段的值交给片段着色器.

``` 
varying变量是vertex和fragment shader之间做数据传递用的。
一般vertex shader修改varying变量的值，
然后fragment shader使用该varying变量的值。
因此varying变量在vertex和fragment shader二者之间的声
明必须是一致的。
application不能使用此变量。
以下是例子：
// Vertex shaderuniform 
mat4 u_matViewProjection;
attribute vec4 a_position;
attribute vec2 a_texCoord0;
varying vec2 v_texCoord; // Varying in vertex shader
void main(void)
{  
  gl_Position = u_matViewProjection * a_position;
  v_texCoord = a_texCoord0;
}
// Fragment shaderprecision 
mediump float;
varying vec2 v_texCoord; // Varying in fragment shader
uniform sampler2D s_baseMap;
uniform sampler2D s_lightMap;
void main()
{
  vec4 baseColor;
  vec4 lightColor;
  baseColor = texture2D(s_baseMap, v_texCoord);
  lightColor = texture2D(s_lightMap, v_texCoord);
  gl_FragColor = baseColor * (lightColor + 0.25);
}


```

_**注意:以上这几种限定符很重要**_

## 限制性

* 不能在if-else中声明变量
* 用于判断的条件必须是bool类型(if,while,for...)
* (?:)操作符后两个参数必须类型相同
* 不支持switch语句  

``` glsl
vec4 toonify(in float intensify) 
{
    vec4 color;
    color = vec4(0.8,0.8,0.8,0.8)
    return color;
}
```

## discard

`discard`关键字可以避免片段更新帧缓冲区，当流控制遇到这个关键字时，正在处理的片段就会被标记为丢.

如果不理解什么叫标记为丢 可以参考一下[UIView的绘制过程](理解UIView的绘制)

## 函数

* 函数名可以通过参数类型重载，但是和返回值类型无关
* 所有参数必须完全匹配，参数不会自动
* 函数不能被递归调用
* 函数返回值不能是数组

函数参数标识符  

* `in`: 进复制到函数中，但不返回的参数(默认)
* `out`: 不将参数复制到函数中，但返回参数
* `inout`: 复制到函数中并返回 

## 混合操作

通过在选择器(.)后列出各分量名，就可以选择这些分量

``` glsl
vec4 v4;
v4.rgba;    // 得到vec4
v4.rgb;     // 得到vec3
v4.b;       // 得到float
v4.xy;      // 得到vec2
v4.xgba;    // 错误！分量名不是同一类

v4.wxyz;    // 打乱原有分量顺序
v4.xxyy;    // 重复分量
```

最后推荐一个GLSL编辑调试工具[OpenGL Shader Builder(Graphics Tools.dmg)](http://adcdownload.apple.com/Developer_Tools/Graphics_Tools_for_Xcode_7.2/Graphics_Tools_for_Xcode_7.2.dmg)


# 总结:

由于本人记性不好使 找东西有时候总找不到 把一些 名词知识点收录出来并加以解释 方便后来的学习者学习.


参考:  
[GLSL基础](http://www.cnblogs.com/luweimy/p/4208570.html?utm_source=tuicool&utm_medium=referral)

[iOS开发-OpenGL ES入门教程2](http://www.jianshu.com/p/ee597b2bd399)  

全文完

