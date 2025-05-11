---
layout: post
title: 使用Python操作MySQL数据库
date: 2018-01-13 22:27:18
categories: [系统理论实践]
tags: [python]
typora-root-url: ..
---

![](/assets/images/20180113PythonMySQL/MysqlPython.webp)


# 前言

为了实现`不斷學習 與時俱進`周末把大部分时间放在了学习`Python`上.
在最近的学习中有一些有价值的部分都摘录整理出来放到博客上,以免后续用到的时候忘记时回来翻翻博客.

我是在`study.163.com`的这个[《全栈数据工程师养成攻略》](http://study.163.com/course/courseMain.htm?courseId=1003520028)课程中学习的,推荐大家学习一下.

## 本篇主要内容

主要分为三个大部分

1. 搭建`Web`环境
2. 数据库MySQL的使用方法
3. 使用Python操作MySQL

### 搭建`Web`环境

* Web环境: Apache、Nginx...
* Web服务启动中相关配置.

#### Web环境: Apache、Nginx...

两个平台的相关的下载

[MAMP](https://www.mamp.info/en/): Mac, Apache, MySQL, PHP 
> Mac, Apache, MySQL, PHP 缩写`MAMP`

[WAMP](https://www.mamp.info/en/): Windows, Apache, MySQL, PHP 
> Windows, Apache, MySQL, PHP 缩写`WAMP`

当然还有linux版本这里就不做多介绍了

总之需要安装这个软件进行环境配置的搭建.

我这里用`MAMP`举例说明一下

![](/assets/images/20180113PythonMySQL/mamp1.webp)

打开之后  
![](/assets/images/20180113PythonMySQL/mamp2.webp)

#### Web服务启动中相关配置

开启`Apatch Server`和`MySQL Server`服务(右上角).
然后点击`Perferences`,进行本地端口配置.

![](/assets/images/20180113PythonMySQL/mamp3.webp)

这里有两种默认配置(红色框选部分) 

如果把服务开启的话那么打开浏览器输入:`localhost:8888`就可以看到相关的效果
> localhost == 127.0.0.1

`8888`是服务的端口

下面这张图可以选择文件根目录
![](/assets/images/20180113PythonMySQL/mamp4.webp)

什么意思呢?

就是你把网页的相关文件放到 这个文件夹的话
就会在浏览器上直接浏览.

![](/assets/images/20180113PythonMySQL/mamp2.webp)

这张图中间的`Open Start Page`. 

![](/assets/images/20180113PythonMySQL/sql1.webp)


进入到数据库配置相关

配置数据库名称
![](/assets/images/20180113PythonMySQL/sql2.webp)

输入表名

![](/assets/images/20180113PythonMySQL/sql3.webp)

配置数据库表
![](/assets/images/20180113PythonMySQL/sql4.webp)

配置完右侧完成

### 数据库MySQL的使用方法

* 基本概念
* 终端配置Python MySQL
* Navicat 数据的导出导入
* 个人的习惯搞法

#### 基本概念

`CURD`操作:

* `C` Create
* `R` Read
* `U` Update
* `D` Delete

这就是数据库相关知识中 `增``删``改``查`

#### 终端配置Python MySQL

在终端中使用如下指令安装MySQL环境

``` sh
pip install MySQL-python
```
我安装的时候出错了

![](/assets/images/20180113PythonMySQL/PipInstallMysqlPython.webp)

最后执行

``` sh
brew install mysql-python
```
然后再去执行`pip install MySQL-python`

如何测试是否成功

在shell中输入`python`

![](/assets/images/20180113PythonMySQL/pythonshell1.webp)

执行

``` python
import MySQLdb

```

如果没有错误就是OK的.


#### Navicat 数据的导出导入

这个数据库可视化操作软件大家自行下载吧  
![](/assets/images/20180113PythonMySQL/navicat1.webp)


打开之后点击左上角点击新建connect 选择MySQL
![](/assets/images/20180113PythonMySQL/navicat2.webp)

接着配置数据库的信息
![](/assets/images/20180113PythonMySQL/navicat3.webp)

这里的名称就是__数据库名称__
`host`地方本地,如果是远程的话,填写`ip`或者`url`  
`port`前面我们设置了`8889`  
账号和密码输入`root`(前面图里面已经看到了账号密码都是一样的)


下面就是连接数据库

![](/assets/images/20180113PythonMySQL/navicat4.webp)


下面这张图就是

![](/assets/images/20180113PythonMySQL/navicat5.webp)

__数据库导出和导入,当然也可以导出导入数据表.__



#### 个人的习惯搞法

* 使用`phpmyadmin`新建数据库和数据表
* 使用`python`插入、读取、更新、修改数据
* 使用`Navicat`导出数据库
* 使用`phpmyadmin`导入数据库 

最后deloy(部署)到线上,这样就可以避免各种错误操作数据库的问题

### 使用Python操作MySQL

这个没啥就是coding部分,使用之前把点击[这里下载](/assets/images/20180113PythonMySQL/DoubanMovieClean.txt)这个文本文件


我们用`sublime text`新建一个`text.py`文件


``` python
#!/usr/bin/env python
# coding:utf8

import sys
reload(sys)
sys.setdefaultencoding("utf8")

import MySQLdb
import MySQLdb.cursors
```

![](/assets/images/20180113PythonMySQL/Pythoncode1.webp)


> 注意:_test.py最好和douban_movie_clean.txt保持在同一个目录这样就不用写路径了_

接着创建数据库连接

``` python

db = MySQLdb.connect(host='127.0.0.1', user='root', passwd='root', db='douban', port=8889, charset='utf8', cursorclass=MySQLdb.cursors.DictCursor) //1
db.autocommit(True) //2
cursor = db.cursor() //3

fr = open('douban_movie_clean.txt','r') //4

fr.close() //4

cursor.close() //3
db.close() //1

```
> 注意 `db`记得用完关闭,`cursor`也要记得关闭, `fr`是文件的读写 和数据库没啥关系也需要记得用完关闭

下面解释一下什么意思

1. `db`创建输入库实例,输入参数 `host`(这里用的是127.0.0.1也可以换成localhost)、`passwd`、`db`、`port`、`charset`、`cursorclass`.
2. 自动改完提交完成更新数据库
3. 通过`db`实例拿到一个连接`cursor` 每次都通过`cursor.execute()`执行增删改查操作sql语句
4. 读取本地的文本文件

大概就是这个意思

#### 读取数据

``` python
# Create
# 读取数据
fr = open('douban_movie_clean.txt', 'r')

count = 0
for line in fr:
	count += 1
	# count表示当前处理到第几行了
	print count
	# 跳过表头
	if count == 1:
		continue

	# strip()函数可以去掉字符串两端的空白符
	# split()函数按照给定的分割符将字符串分割为列表
	line = line.strip().split('^')
	# 插入数据，注意对齐字段
	# execute()函数第一个参数为要执行的SQL命令
	# 这里用字符串格式化的方法生成一个模板
	# %s表示一个占位符
	# 第二个参数为需要格式化的参数，传入到模板中
	cursor.execute("insert into movie(title, url, rate, length, description) values(%s, %s, %s, %s, %s)", [line[1], line[2], line[4], line[-3], line[-1]])

# 关闭读文件
fr.close()
```

通过我们拿到的`cursor`连接实例来执行`cursor.execute()`函数进行`sql`的插入操作.

![](/assets/images/20180113PythonMySQL/Pythoncode2.webp)

来看下结果
![](/assets/images/20180113PythonMySQL/sqlresult.webp)


#### 更新数据

更新数据 比如我想把id=1的记录更新一下`title`字段和`length`长度

``` python
# Update
cursor.execute("update movie set title=%s, length=%s where id=1", ['孙亚洲', 999])
```

#### 读取数据

``` python
# Read
cursor.execute("select title, length from movie where id=1")
movies = cursor.fetchone()
```

#### 删除数据

``` python
# Delete
cursor.execute("delete from movie where id=%s",[2])
```

---

下面看下完成的代码


``` python 
#!/usr/bin/env python
# coding:utf8

import sys
reload(sys)
sys.setdefaultencoding("utf8")


import MySQLdb
import MySQLdb.cursors

db = MySQLdb.connect(host='127.0.0.1', user='root', passwd='root', db='douban', port=8889, charset='utf8', cursorclass=MySQLdb.cursors.DictCursor)
db.autocommit(True)
cursor = db.cursor()

fr = open('douban_movie_clean.txt','r')

# Create
count = 0
for line in fr:
	count += 1
	print count
	if count == 1:
		continue
	line = line.strip().split('^')
	cursor.execute("insert into movie(title, url, rate, length, description) values(%s, %s, %s, %s, %s)", [line[1], line[2], line[4], line[-3], line[-1]])
fr.close()

# Update
cursor.execute("update movie set title=%s, length=%s where id=1", ['孙亚洲', 999])

# Read
cursor.execute("select title, length from movie where id=1")
movies = cursor.fetchone()

print len(movies)
# print movies[0]


# Delete

cursor.execute("delete from movie where id=%s",[2])


cursor.close()
db.close()
```


## 总结

通过学习`python`操作数据库很有收获,想起了大学李月辉老师教我怎么用java连接数据库.
在工作中我们可能会遇到一大堆数据如何插入到数据等问题,通过学习了本章内容可以很容易的处理批量数据.

关于更多的SQL语句 
参考[SQL 教程](http://www.runoob.com/sql/sql-tutorial.html)


全文完